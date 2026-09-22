"""
Master Unified Image Analysis Pipeline for AgriGrade AI.
Orchestrates:
Image Validation -> Server-Side Crop Validation -> YOLO Detection -> CNN / Trained Model (Banana / Tomato) ->
Gemini Visual Validation -> Quality Grading Engine -> Shelf-Life Prediction -> Market Price Lookup ->
Quality-Aware Price Calculation -> Market Recommendation -> Return Unified Response.

Strictly protects existing Banana pipeline while enabling multi-crop (Tomato, Mango, Onion, etc.) pipeline integration.
"""

import io
import uuid
import time
import hashlib
import numpy as np
from PIL import Image
from pathlib import Path

from inference.model_registry import model_registry
from inference.cnn_inference import predict_cnn
from inference.yolo_inference import detect_objects
from inference.gemini_vision import run_gemini_vision_analysis, analyze_produce_pixels
from inference.multi_crop_predictor import predict_crop_quality, get_keras_model, CLASS_NAMES
from grading.quality_grader import calculate_quality_grade
from market.market_service import MarketService
from services.market_price_service import get_market_price_and_prediction
from services.shelf_life_service import predict_shelf_life

_market_service_instance = MarketService()

def validate_image_input(image_input):
    """
    Validates image format, resolution, and readability.
    Returns (pil_image, bytes_data, error_dict)
    """
    try:
        if isinstance(image_input, bytes):
            img_bytes = image_input
            pil_img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, (str, Path)):
            with open(image_input, "rb") as f:
                img_bytes = f.read()
            pil_img = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            pil_img = image_input
            buf = io.BytesIO()
            pil_img.save(buf, format="JPEG")
            img_bytes = buf.getvalue()
        else:
            return None, None, {
                "status": "IMAGE_UNAVAILABLE",
                "reason": "Invalid image payload format provided. Raw binary or file path required.",
                "quality": None,
                "shelf_life": None,
                "price_prediction": None,
                "market_recommendation": None
            }

        pil_img.verify()
        # Re-open after verify() reset
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        width, height = pil_img.size

        if width < 50 or height < 50:
            return None, None, {
                "status": "IMAGE_UNAVAILABLE",
                "reason": "Image resolution too low. Minimum 50x50 pixels required.",
                "quality": None,
                "shelf_life": None,
                "price_prediction": None,
                "market_recommendation": None
            }

        # Check if completely blank/black image
        extrema = pil_img.getextrema()
        if extrema == ((0, 0), (0, 0), (0, 0)):
            return None, None, {
                "status": "IMAGE_UNAVAILABLE",
                "reason": "Uploaded image is completely black or blank.",
                "quality": None,
                "shelf_life": None,
                "price_prediction": None,
                "market_recommendation": None
            }

        return pil_img, img_bytes, None
    except Exception as e:
        return None, None, {
            "status": "IMAGE_UNAVAILABLE",
            "reason": f"Corrupted image format or unreadable bytes: {e}",
            "quality": None,
            "shelf_life": None,
            "price_prediction": None,
            "market_recommendation": None
        }

def identify_crop_from_image(pil_img, img_bytes):
    """
    Identifies crop type using trained multi-crop Keras model (18 classes) and pixel color profiling.
    """
    try:
        model = get_keras_model()
        if model is not None:
            img = pil_img.convert("RGB").resize((224, 224))
            arr = np.expand_dims(np.array(img, dtype=np.float32), axis=0)
            preds = model.predict(arr, verbose=0)[0]

            crops = ["banana", "carrot", "mango", "okra", "onion", "tomato"]
            crop_scores = {}
            for c in crops:
                c_indices = [i for i, name in enumerate(CLASS_NAMES) if name.startswith(f"{c}_")]
                crop_scores[c] = sum(float(preds[i]) for i in c_indices)

            best_crop = max(crop_scores, key=crop_scores.get)
            return best_crop, crop_scores[best_crop]
    except Exception as e:
        pass

    # Fallback to pixel color profiling
    metrics = analyze_produce_pixels(pil_img)
    dom_color = metrics.get("dominant_color", "unknown")
    if dom_color == "red":
        return "tomato", 0.90
    elif dom_color == "yellow_green":
        return "banana", 0.90
    return "banana", 0.50

def analyze_crop_image(image_input, crop_hint=None, location=None, storage_condition="ambient"):
    """
    Unified Master Pipeline executing all 12 orchestrated steps.
    """
    start_time = time.time()
    analysis_id = f"anl-{uuid.uuid4().hex[:12]}"

    # 1. Image Ingestion & Validation
    pil_img, img_bytes, val_error = validate_image_input(image_input)
    if val_error:
        return val_error

    # Compute SHA-256 hash of the received image bytes
    sha256_hash = hashlib.sha256(img_bytes).hexdigest()
    image_size_bytes = len(img_bytes)

    # 2. YOLO Object Detection
    yolo_result = detect_objects(img_bytes, crop_hint=crop_hint)

    # 3. Server-Side Crop Validation
    detected_crop, detected_conf = identify_crop_from_image(pil_img, img_bytes)
    expected_crop = model_registry.resolve_crop(crop_hint) if crop_hint else None

    # Diagnostic Logging
    print(f"[AI-PIPELINE] Incoming Request -> analysis_id: {analysis_id} | SHA-256: {sha256_hash} | size: {image_size_bytes}B | crop_hint: {crop_hint} | detected_crop: {detected_crop}")

    # Strict Wrong-Crop Protection Rule
    if expected_crop and detected_crop:
        if expected_crop != detected_crop and detected_conf >= 0.65:
            metrics = analyze_produce_pixels(pil_img)
            # Special case 1: green unripe tomato may be classified as okra/banana/mango by CNN
            if expected_crop == "tomato" and detected_crop in ["okra", "banana", "mango"] and metrics.get("dominant_color") in ["yellow_green", "green"]:
                canonical_crop = "tomato"
            # Special case 2: rotten/black banana
            elif expected_crop == "banana" and metrics.get("dark_ratio", 0) > 0.30:
                canonical_crop = "banana"
            else:
                return {
                    "status": "INVALID_CROP",
                    "analysis_id": analysis_id,
                    "input_image": {
                        "sha256": sha256_hash,
                        "mime_type": "image/jpeg",
                        "size_bytes": image_size_bytes,
                        "source": "UPLOADED_IMAGE"
                    },
                    "message": f"The uploaded image does not appear to be a {model_registry.get_display_name(expected_crop)}.",
                    "expected_crop": expected_crop,
                    "detected_crop": detected_crop
                }
        else:
            canonical_crop = expected_crop
    else:
        canonical_crop = expected_crop if expected_crop else detected_crop

    display_crop = model_registry.get_display_name(canonical_crop)

    # 4. Trained Model Inference (Banana EfficientNet-B0 or Multi-Crop Keras Model)
    if canonical_crop == "banana":
        cnn_result = predict_cnn(img_bytes, canonical_crop, task="maturity")
        trained_model_info = {
            "status": "AVAILABLE",
            "name": "EfficientNet-B0 (Banana Maturity CNN)",
            "model_name": "EfficientNet-B0 (Banana Maturity CNN)",
            "prediction": cnn_result.get("prediction", "ripe"),
            "confidence": cnn_result.get("confidence", 0.90),
            "experimental": False
        }
        cnn_task = "maturity"
        cnn_pred_val = cnn_result.get("prediction", "ripe")
        cnn_conf_val = cnn_result.get("confidence", 0.90)
        cnn_status_str = "AVAILABLE"
        cnn_probs = cnn_result.get("probabilities", {})
        is_experimental = False
    elif canonical_crop in ["tomato", "mango", "onion", "okra", "carrot"]:
        multi_pred = predict_crop_quality(canonical_crop, img_bytes)
        cnn_status_str = multi_pred.get("status", "AVAILABLE")
        trained_model_info = {
            "status": cnn_status_str,
            "name": "crop_grade_model.keras",
            "model_name": "crop_grade_model.keras (MobileNetV2)",
            "prediction": multi_pred.get("prediction", "Grade A"),
            "confidence": multi_pred.get("confidence", 0.95),
            "experimental": True
        }
        cnn_task = "quality_grade"
        cnn_pred_val = multi_pred.get("prediction", "Grade A")
        cnn_conf_val = multi_pred.get("confidence", 0.95)
        cnn_probs = multi_pred.get("probabilities", multi_pred.get("class_probabilities", {}))
        is_experimental = True
        cnn_result = {
            "model_status": cnn_status_str,
            "model": "crop_grade_model.keras",
            "task": "quality_grade",
            "crop": canonical_crop,
            "prediction": cnn_pred_val,
            "confidence": cnn_conf_val,
            "probabilities": cnn_probs,
            "experimental": True
        }
    else:
        trained_model_info = {
            "status": "UNAVAILABLE",
            "name": "NONE",
            "model_name": "GEMINI_FALLBACK",
            "prediction": "NONE",
            "confidence": 0.0,
            "experimental": False
        }
        cnn_task = "quality_grade"
        cnn_pred_val = "NONE"
        cnn_conf_val = 0.0
        cnn_status_str = "NOT_TRAINED"
        cnn_probs = {}
        is_experimental = False
        cnn_result = {
            "model_status": cnn_status_str,
            "prediction": None,
            "confidence": 0.0
        }

    # 5. Gemini Vision Multimodal Evidence Reasoning
    gemini_result = run_gemini_vision_analysis(
        img_bytes,
        yolo_result=yolo_result,
        cnn_result=cnn_result,
        crop_hint=canonical_crop
    )

    # Resolve maturity stage & fungal status with strict Disease Priority Hierarchy
    gemini_mat_stage = gemini_result.get("maturity", {}).get("stage", "ripe")
    gemini_fungal = gemini_result.get("fungal_growth", {}).get("status", "NONE")
    gemini_decay = gemini_result.get("active_decay", {}).get("status", "NONE")
    visual_qual = gemini_result.get("visual_quality", {})
    gemini_suggested_grade = str(visual_qual.get("suggested_grade", "")).upper()
    is_severe_deterioration = (
        visual_qual.get("surface_condition") in ["severely_deteriorated", "decayed"]
        or visual_qual.get("severe_visual_deterioration") is True
        or "REJECT" in gemini_suggested_grade
    )

    # Priority: If Gemini Vision detected rotten maturity, severe deterioration, severe fungal growth, or active decay:
    if gemini_mat_stage == "rotten" or is_severe_deterioration or gemini_fungal in ["SEVERE", "MODERATE"] or gemini_decay == "PRESENT":
        mat_stage = "rotten"
        mat_confidence = max(0.90, gemini_result.get("maturity", {}).get("confidence", 0.95))
    elif canonical_crop == "banana" and cnn_result.get("model_status") == "AVAILABLE":
        mat_stage = cnn_result.get("prediction", "ripe")
        mat_confidence = max(0.85, cnn_result.get("confidence", 0.90))
    else:
        mat_stage = gemini_mat_stage
        mat_confidence = max(0.85, gemini_result.get("maturity", {}).get("confidence", 0.85))

    # Agreement check between Trained Model and Gemini Vision
    trained_pred = trained_model_info.get("prediction")
    gemini_pred = gemini_result.get("visual_quality", {}).get("suggested_grade", "Grade A")

    if trained_model_info.get("status") == "AVAILABLE" and trained_pred:
        norm_t = str(trained_pred).lower().replace(" ", "").replace("_", "")
        norm_g = str(gemini_pred).lower().replace(" ", "").replace("_", "")
        if norm_t == norm_g or (("gradea" in norm_t or "ripe" in norm_t) and ("gradea" in norm_g or "ripe" in norm_g)):
            agreement_status = "AGREEMENT"
            agreement_expl = f"Consensus agreement between {trained_model_info.get('name')} and visual inspection."
        elif gemini_fungal in ["SEVERE", "MODERATE"] or gemini_decay == "PRESENT" or is_severe_deterioration:
            agreement_status = "DISAGREEMENT"
            agreement_expl = f"Visual scanner detected severe deterioration overriding {trained_model_info.get('name')} baseline."
        else:
            agreement_status = "DISAGREEMENT"
            agreement_expl = f"Trained model predicted {trained_pred}, while visual inspection suggested {gemini_pred}."
    else:
        agreement_status = "NOT_APPLICABLE"
        agreement_expl = "Visual inspection fallback active."

    agreement_info = {
        "status": agreement_status,
        "trained_model_prediction": trained_pred,
        "cnn_prediction": trained_pred,
        "gemini_prediction": gemini_pred,
        "gemini_assessment": gemini_pred,
        "explanation": agreement_expl
    }

    # 6. Quality Grading Engine with Consensus Logic
    disease_status = gemini_result.get("disease", {}).get("status", "none")
    defects = gemini_result.get("defects", [])
    fungal_growth = gemini_result.get("fungal_growth", {"status": "NONE", "confidence": 0.90, "evidence": "No fungal growth"})
    active_decay = gemini_result.get("active_decay", {"status": "NONE", "confidence": 0.90, "evidence": "No active decay"})
    surface_discoloration = gemini_result.get("surface_discoloration", {"status": "NONE", "likely_cause": "NONE"})
    review_required = gemini_result.get("review_required", False)

    # For Tomato, incorporate CNN Grade / Unripe classification into defects/maturity
    if canonical_crop == "tomato":
        if gemini_fungal in ["SEVERE", "MODERATE"] or gemini_decay == "PRESENT":
            defects = [{"type": "severe_rot", "severity": "severe"}]
            mat_stage = "rotten"
            disease_status = "fungal_rot"
        elif gemini_mat_stage == "unripe":
            mat_stage = "unripe"
            defects = []
        elif trained_model_info.get("status") == "AVAILABLE":
            if "Grade B" in str(trained_pred):
                defects = [{"type": "surface_blemish", "severity": "moderate"}]
                mat_stage = "ripe"
            elif "Grade C" in str(trained_pred):
                defects = [{"type": "growth_cracking", "severity": "moderate"}]
                mat_stage = "overripe"
            elif "Grade A" in str(trained_pred):
                defects = []
                mat_stage = "ripe"

    grading_result = calculate_quality_grade(
        crop_name=canonical_crop,
        maturity_stage=mat_stage,
        disease_status=disease_status,
        defects=defects,
        visual_quality=visual_qual,
        fungal_growth=fungal_growth,
        active_decay=active_decay,
        surface_discoloration=surface_discoloration,
        review_required=review_required
    )

    # 7. Shelf-Life Prediction
    fungal_status_str = str(fungal_growth.get("status", "NONE")).upper()
    decay_status_str = str(active_decay.get("status", "NONE")).upper()

    shelf_life_res = predict_shelf_life(
        crop_name=canonical_crop,
        maturity_stage=mat_stage,
        quality_grade=grading_result["grade"],
        defects=defects,
        disease_status=disease_status,
        fungal_status=fungal_status_str,
        active_decay=decay_status_str,
        storage_condition=storage_condition
    )

    # 8. Market Price Service Integration & Quality-Adjusted Price Prediction
    shelf_remaining = shelf_life_res.get("remaining_days", 0) if isinstance(shelf_life_res, dict) else 0

    from market.market_service import normalize_grade
    final_grade_clean = normalize_grade(grading_result["grade_code"], grading_result["quality_score"])

    # Synchronize grading_result fields with final authoritative clean grade:
    if final_grade_clean == "REJECT":
        grading_result["grade_code"] = "REJECT"
        grading_result["grade"] = "Reject"
        grading_result["quality_score"] = 0
    else:
        grading_result["grade_code"] = final_grade_clean
        if "Grade" not in str(grading_result.get("grade", "")):
            grading_result["grade"] = f"Grade {final_grade_clean}"

    m_analysis = _market_service_instance.get_market_analysis(
        crop_name=canonical_crop,
        quality_grade=final_grade_clean,
        quality_score=grading_result["quality_score"],
        shelf_life_days=shelf_remaining,
        user_state=location.get("state", "Tamil Nadu") if isinstance(location, dict) else "Tamil Nadu",
        user_district=location.get("district", "Coimbatore") if isinstance(location, dict) else "Coimbatore",
        user_market=location.get("market") if isinstance(location, dict) else None
    )

    market_price = m_analysis.get("market_price", {})
    official_mkt_price = m_analysis.get("official_market_price", market_price)
    p_pred_schema = m_analysis.get("price_prediction", {})
    ai_price_pred = m_analysis.get("ai_price_prediction", {"estimated_low": 0.0, "estimated_high": 0.0, "unit": "INR/kg"})
    m_rec_schema = m_analysis.get("market_recommendation", {})
    market_act = m_analysis.get("market_action", {"action": "REJECT" if final_grade_clean == "REJECT" else "SELL_NOW", "listing_allowed": final_grade_clean != "REJECT"})
    market_comparison = m_analysis.get("market_comparison", [])

    # Exclusive Derivation & Consistency Invariant Validator:
    if final_grade_clean == "REJECT":
        ai_price_pred = {"estimated_low": 0.0, "estimated_high": 0.0, "unit": "INR/kg"}
        market_act = {
            "action": "REJECT",
            "listing_allowed": False,
            "reason": "Produce is unmarketable due to severe visible deterioration."
        }
        assert grading_result["quality_score"] == 0, f"Invariant violated: REJECT score must be 0, got {grading_result['quality_score']}"
        assert ai_price_pred["estimated_low"] == 0.0, f"Invariant violated: REJECT price low must be 0, got {ai_price_pred['estimated_low']}"
        assert ai_price_pred["estimated_high"] == 0.0, f"Invariant violated: REJECT price high must be 0, got {ai_price_pred['estimated_high']}"
        assert market_act["action"] == "REJECT", f"Invariant violated: REJECT market_action must be REJECT, got {market_act['action']}"
        assert market_act["listing_allowed"] is False, "Invariant violated: REJECT listing_allowed must be False"

    if final_grade_clean in {"A", "B", "C"}:
        assert grading_result["grade_code"] in ["A", "B", "C"], f"Invariant violated: Valid grade must be A/B/C, got {grading_result['grade_code']}"
        assert grading_result["quality_score"] >= 40, f"Invariant violated: Valid grade score must be >= 40, got {grading_result['quality_score']}"
        assert market_act["action"] != "REJECT", f"Invariant violated: Grade {final_grade_clean} market_action cannot be REJECT, got {market_act['action']}"
        assert market_act["listing_allowed"] is True, f"Invariant violated: Grade {final_grade_clean} listing_allowed must be True"
        assert ai_price_pred["estimated_low"] > 0, f"Invariant violated: Grade {final_grade_clean} AI price low must be > 0"
        assert ai_price_pred["estimated_high"] > 0, f"Invariant violated: Grade {final_grade_clean} AI price high must be > 0"

    inference_ms = int((time.time() - start_time) * 1000)
    overall_status = grading_result.get("status", "SUCCESS")

    # Construct Final Integrated API Response with All Requested Contract Fields
    response = {
        "status": overall_status,
        "analysis_id": analysis_id,
        "input_image": {
            "sha256": sha256_hash,
            "mime_type": "image/jpeg",
            "size_bytes": image_size_bytes,
            "source": "UPLOADED_IMAGE"
        },
        "crop": {
            "name": canonical_crop,
            "display_name": display_crop,
            "confidence": round(detected_conf, 4),
            "cnn_status": cnn_status_str
        },
        "detection": {
            "objects_detected": yolo_result.get("objects_count", 1),
            "model_status": yolo_result.get("model_status", "PRETRAINED_GENERAL_MODEL"),
            "objects": [
                {
                    "class": obj.get("class", "produce"),
                    "confidence": obj.get("confidence", 0.92),
                    "bbox": obj.get("bbox", {"x1": 0, "y1": 0, "x2": 416, "y2": 416})
                } for obj in yolo_result.get("detected_objects", [])
            ],
            "bounding_boxes": [obj.get("bbox") for obj in yolo_result.get("detected_objects", [])]
        },
        "trained_model": trained_model_info,
        "trainedModel": trained_model_info,
        "agreement": agreement_info,
        "cnn": {
            "model": trained_model_info.get("name", "crop_grade_model.keras" if canonical_crop == "tomato" else "EfficientNet-B0"),
            "task": cnn_task,
            "crop": canonical_crop,
            "prediction": cnn_pred_val,
            "confidence": round(cnn_conf_val, 4),
            "probabilities": cnn_probs,
            "model_status": cnn_status_str,
            "experimental": is_experimental
        },
        "yolo": {
            "model_status": yolo_result.get("model_status", "PRETRAINED_GENERAL_MODEL"),
            "objects_count": yolo_result.get("objects_count", 1),
            "detected_objects": yolo_result.get("detected_objects", [])
        },
        "gemini": {
            "status": gemini_result.get("status", "SUCCESS"),
            "visual_quality": gemini_result.get("visual_quality", {}),
            "disease": gemini_result.get("disease", {}),
            "fungal_growth": fungal_status_str,
            "active_decay": (decay_status_str == "PRESENT"),
            "visible_damage": gemini_result.get("visual_quality", {}).get("visible_damage", "NONE"),
            "evidence": gemini_result.get("grading_evidence", []),
            "confidence": 0.90
        },
        "maturity": {
            "stage": mat_stage,
            "confidence": round(mat_confidence, 4),
            "evidence": gemini_result.get("maturity", {}).get("evidence", "Visually verified produce maturity stage")
        },
        "disease": {
            "status": "visual_indication" if disease_status not in ["none", "healthy"] else "none",
            "name": f"{display_crop} {disease_status.replace('_', ' ').title()}" if disease_status not in ["none", "healthy"] else "None",
            "confidence": 0.90,
            "evidence": [gemini_result.get("disease", {}).get("evidence", "No visible disease lesions")]
        } if disease_status != "none" else {
            "status": "none",
            "confidence": 0.92,
            "evidence": ["No visible disease lesions detected"]
        },
        "fungal_growth": fungal_growth,
        "active_decay": active_decay,
        "surface_discoloration": surface_discoloration,
        "defects": defects,
        "review_required": grading_result.get("review_required", False),
        "review_status": "NEEDS_REVIEW" if grading_result.get("review_required") else "NONE",
        "quality": {
            "score": grading_result["quality_score"],
            "grade": grading_result["grade_code"],
            "grade_display": grading_result["grade"],
            "description": grading_result["description"],
            "decision_basis": grading_result["decision_basis"],
            "penalties": grading_result["penalties"]
        },
        "shelf_life": shelf_life_res,
        "official_market_price": official_mkt_price,
        "ai_price_prediction": ai_price_pred,
        "market_action": market_act,
        "market_price": market_price,
        "price_prediction": p_pred_schema,
        "market_recommendation": m_rec_schema,
        "market_comparison": market_comparison,
        "decision_basis": grading_result["decision_basis"],
        "recommendations": [
            f"Produce evaluated as {grading_result['grade']} quality ({grading_result['quality_score']}/100 score).",
            f"Estimated remaining shelf life: {shelf_life_res['estimated_range']}.",
            "Store in cool ambient conditions to preserve freshness."
        ],
        "safety_disclaimer": "This analysis provides a visual commercial quality assessment only, not a food-safety or chemical hygiene certification.",
        "models": {
            "crop_classifier": "model_registry",
            "maturity_classifier": "EfficientNet-B0" if canonical_crop == "banana" else "MODEL_NOT_AVAILABLE",
            "quality_classifier": trained_model_info.get("model_name", "GEMINI_FALLBACK"),
            "detector": "yolo_v8",
            "grade_engine": "deterministic_rule_engine",
            "inference_sources": {
                "crop_identification": "crop_grade_model.keras",
                "maturity": "TRAINED_MODEL" if canonical_crop == "banana" else "GEMINI",
                "trained_quality_model": cnn_status_str,
                "visual_analysis": "GEMINI",
                "quality_grading": "RULE_ENGINE",
                "market_pricing": "MARKET_DATA" if market_price.get("available") else "UNAVAILABLE"
            }
        },
        "performance": {
            "total_inference_ms": inference_ms
        }
    }

    return response
