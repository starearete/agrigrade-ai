"""
Multi-Crop AI Predictor for AgriGrade AI.
Loads and runs inference using the trained Keras crop grading model (crop_grade_model.keras).
Supports: Mango, Tomato, Onion, Okra, Carrot.
Tagging predictions with experimental = True.
"""

import os
import sys
import numpy as np
from pathlib import Path
from PIL import Image

os.environ["KERAS_BACKEND"] = "torch"

try:
    import keras
    KERAS_AVAILABLE = True
except Exception as e:
    KERAS_AVAILABLE = False

MODEL_PATH = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\agrigrade-frontend\crop-quality-ai\crop-quality-ai\models\crop_grade_model.keras")

CLASS_NAMES = [
    "banana_grade_a", "banana_grade_b", "banana_grade_c",
    "carrot_grade_a", "carrot_grade_b", "carrot_grade_c",
    "mango_grade_a", "mango_grade_b", "mango_grade_c",
    "okra_grade_a", "okra_grade_b", "okra_grade_c",
    "onion_grade_a", "onion_grade_b", "onion_grade_c",
    "tomato_grade_a", "tomato_grade_b", "tomato_grade_c"
]

SUPPORTED_CROPS = {"mango", "tomato", "onion", "okra", "carrot"}

_LOADED_MODEL = None

def get_keras_model():
    global _LOADED_MODEL
    if not KERAS_AVAILABLE:
        return None
    if _LOADED_MODEL is None and MODEL_PATH.exists():
        try:
            _LOADED_MODEL = keras.models.load_model(str(MODEL_PATH))
        except Exception as e:
            print(f"[MultiCropPredictor] Error loading {MODEL_PATH}: {e}")
            _LOADED_MODEL = None
    return _LOADED_MODEL

def predict_crop_quality(crop_name: str, image_bytes: bytes) -> dict:
    """
    Predicts quality grade for supported crops using crop_grade_model.keras.
    Returns structured dict with prediction, confidence, model status, and experimental badge.
    """
    crop = crop_name.lower().strip()
    if crop not in SUPPORTED_CROPS:
        return {
            "status": "UNAVAILABLE",
            "reason": f"No trained CNN model exists in crop-quality-ai for {crop_name}. Routing to Gemini Multimodal Vision.",
            "experimental": False
        }

    model = get_keras_model()
    if model is None:
        return {
            "status": "UNAVAILABLE",
            "reason": "Keras model could not be loaded.",
            "experimental": True
        }

    try:
        import io
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
        arr = np.array(img, dtype=np.float32)
        arr = np.expand_dims(arr, axis=0)

        preds = model.predict(arr, verbose=0)[0]
        
        # Filter predictions for the relevant crop classes
        crop_prefix = f"{crop}_"
        crop_indices = [i for i, name in enumerate(CLASS_NAMES) if name.startswith(crop_prefix)]

        if not crop_indices:
            return {
                "status": "UNAVAILABLE",
                "reason": f"No class indices found for {crop} in model classes.",
                "experimental": True
            }

        crop_preds = {CLASS_NAMES[i]: float(preds[i]) for i in crop_indices}

        best_class = max(crop_preds, key=crop_preds.get)
        confidence = crop_preds[best_class]

        # Extract grade part e.g. "mango_grade_a" -> "Grade A"
        grade_raw = best_class.replace(crop_prefix, "")
        grade_clean = grade_raw.replace("grade_", "").upper()
        grade_formatted = f"Grade {grade_clean}"

        # Software normalization if softmax across all 18 classes
        crop_prob_sum = sum(crop_preds.values())
        norm_confidence = confidence / crop_prob_sum if crop_prob_sum > 0 else confidence

        probs_dict = {k: round(v / crop_prob_sum if crop_prob_sum > 0 else v, 4) for k, v in crop_preds.items()}

        return {
            "status": "AVAILABLE",
            "model": "crop_grade_model.keras",
            "model_name": "crop_grade_model.keras (MobileNetV2)",
            "task": "quality_grade",
            "crop": crop,
            "prediction": grade_formatted,
            "predicted_class": best_class,
            "confidence": round(float(norm_confidence), 4),
            "probabilities": probs_dict,
            "class_probabilities": probs_dict,
            "model_status": "AVAILABLE",
            "experimental": True,
            "source": "crop-quality-ai"
        }

    except Exception as e:
        print(f"[MultiCropPredictor] Inference error on {crop}: {e}")
        return {
            "status": "ERROR",
            "reason": str(e),
            "experimental": True
        }
