"""
Quality Grading Engine for AgriGrade AI.
Calculates objective quality score (0-100), penalties, and Grade A / B / C / REJECT / REVIEW_REQUIRED assignment.
Evaluates maturity, disease, fungal growth, active decay, and defects independently.
"""

import json
from pathlib import Path

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent / "configs" / "grading"

def load_crop_config(crop_name):
    crop_name = crop_name.lower().strip()
    crop_file = CONFIGS_DIR / f"{crop_name}.json"
    default_file = CONFIGS_DIR / "default_crop_grading.json"

    if crop_file.exists():
        with open(crop_file, "r", encoding="utf-8") as f:
            return json.load(f)

    if default_file.exists():
        with open(default_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "crop": crop_name,
                "penalties": data["default_penalties"],
                "grade_boundaries": data["grade_boundaries"]
            }

    return {
        "crop": crop_name,
        "penalties": {
            "maturity": {"unripe": 10, "ripe": 0, "overripe": 20, "rotten": 95},
            "disease": {"none": 0, "suspected": 15, "visible": 45},
            "defect_severity": {"none": 0, "mild": 5, "moderate": 15, "severe": 35}
        },
        "grade_boundaries": {"grade_a": 90, "grade_b": 75, "grade_c": 60}
    }

def calculate_quality_grade(
    crop_name,
    maturity_stage="ripe",
    disease_status="none",
    defects=None,
    visual_quality=None,
    fungal_growth=None,
    active_decay=None,
    surface_discoloration=None,
    review_required=False
):
    if defects is None:
        defects = []
    if visual_quality is None:
        visual_quality = {}
    if fungal_growth is None:
        fungal_growth = {"status": "NONE", "confidence": 0.90, "evidence": "No visible fungal growth"}
    if active_decay is None:
        active_decay = {"status": "NONE", "confidence": 0.90, "evidence": "No active decay detected"}
    if surface_discoloration is None:
        surface_discoloration = {"status": "NONE", "likely_cause": "NONE"}

    crop_name = str(crop_name).lower().strip()
    config = load_crop_config(crop_name)
    penalties_cfg = config.get("penalties", {})
    boundaries = config.get("grade_boundaries", {"grade_a": 90, "grade_b": 75, "grade_c": 40})

    maturity_stage = str(maturity_stage).lower().strip()
    disease_status = str(disease_status).lower().strip()

    # Detect severe visual deterioration for any crop
    is_severe_deterioration = (
        visual_quality.get("surface_condition") in ["severely_deteriorated", "decayed"]
        or visual_quality.get("severe_visual_deterioration") is True
        or visual_quality.get("visible_damage") in ["significant_browning_bruising", "severe_deterioration", "severe"]
        or any(isinstance(d, dict) and (d.get("type") in ["severe_blackening", "severe_rot"] or d.get("severity") == "severe") for d in defects)
        or surface_discoloration.get("status") == "SEVERE"
    )

    is_rotten = (maturity_stage in ["rotten", "advanced_rotten"])

    fungal_status = str(fungal_growth.get("status", "NONE")).upper().strip()
    decay_status = str(active_decay.get("status", "NONE")).upper().strip()

    decision_basis = [f"Crop identified as {crop_name}"]

    # 1. Maturity Penalty
    mat_cfg = penalties_cfg.get("maturity", {})
    if is_rotten and is_severe_deterioration:
        mat_penalty = 95
        decision_basis.append("Maturity stage evaluated as ROTTEN with severe visual deterioration")
    elif crop_name == "banana" and (is_rotten or maturity_stage == "overripe" or visual_quality.get("surface_condition") == "moderate_browning") and fungal_status == "NONE" and decay_status == "NONE" and disease_status in ["none", "healthy"]:
        mat_penalty = 45  # Moderate overripe/dark banana without severe structural breakdown is Grade C (Score 55)
        decision_basis.append("Maturity stage evaluated as ADVANCED RIPENING / MODERATE BROWNING without severe rot (Grade C baseline)")
    elif maturity_stage in ["unripe", "green"]:
        mat_penalty = mat_cfg.get("unripe", 0)
        decision_basis.append("Maturity stage: UNRIPE / GREEN (Optimal commercial harvest maturity, Grade A Premium)")
    elif maturity_stage == "rotten":
        mat_penalty = 95
        decision_basis.append("Maturity stage: ROTTEN")
    elif maturity_stage == "overripe":
        mat_penalty = mat_cfg.get("overripe", 20)
        decision_basis.append(f"Maturity stage: OVERRIPE (penalty: {mat_penalty} pts)")
    else:
        mat_penalty = 0
        decision_basis.append("Maturity stage: RIPE / OPTIMAL")

    # 2. Disease, Fungal & Decay Penalties
    dis_cfg = penalties_cfg.get("disease", {})
    dis_penalty = dis_cfg.get(disease_status, 0 if disease_status == "none" else (45 if disease_status == "visible" else 15))

    fungal_penalty = 95 if fungal_status == "SEVERE" else (40 if fungal_status == "MODERATE" else (20 if fungal_status == "MILD" else 0))
    decay_penalty = 95 if decay_status == "PRESENT" else 0

    if fungal_status in ["SEVERE", "MODERATE"]:
        decision_basis.append(f"Fungal growth detected: {fungal_status}")
    else:
        decision_basis.append("No fungal growth detected")

    if decay_status == "PRESENT":
        decision_basis.append("Active decay detected: PRESENT")
    else:
        decision_basis.append("No active decay detected")

    dis_penalty = max(dis_penalty, fungal_penalty, decay_penalty)

    # 3. Defect Penalties
    def_penalty = 0
    defect_reasons = []
    def_sev_cfg = penalties_cfg.get("defects", penalties_cfg.get("defect_severity", {}))

    for d in defects:
        if isinstance(d, dict):
            sev = d.get("severity", "mild").lower()
            dtype = d.get("type", "blemish").lower()
            penalty_val = def_sev_cfg.get(dtype, def_sev_cfg.get(sev, 10))
            def_penalty += penalty_val
            defect_reasons.append(f"{sev.capitalize()} {dtype}")
        elif isinstance(d, str):
            penalty_val = def_sev_cfg.get(d, 10)
            def_penalty += penalty_val
            defect_reasons.append(d)

    def_penalty = min(def_penalty, 50)
    if defect_reasons:
        decision_basis.append(f"Defects identified: {', '.join(defect_reasons)}")

    # Calculate Total Score
    if is_rotten and is_severe_deterioration:
        score = 0
    elif crop_name == "banana" and fungal_status == "NONE" and decay_status == "NONE" and disease_status in ["none", "healthy"]:
        total_penalty = mat_penalty + dis_penalty + def_penalty
        score = max(45, min(100, 100 - total_penalty))
    else:
        total_penalty = mat_penalty + dis_penalty + def_penalty
        score = max(0, min(100, 100 - total_penalty))

    # Condition-based Grade Assignment & Priority Engine
    status_flag = "SUCCESS"

    if review_required is True or fungal_status == "UNKNOWN" or decay_status == "UNKNOWN":
        grade_code = "REVIEW_REQUIRED"
        grade_name = "Review Required"
        status_flag = "REVIEW_REQUIRED"
        description = "Visual evidence is ambiguous or insufficient to reliably distinguish ripening browning from fungal decay."
        decision_basis.append("Visual evidence ambiguous -> Decision: Review Required")
    elif (is_rotten and is_severe_deterioration) or fungal_status in ["SEVERE", "MODERATE"] or decay_status == "PRESENT" or disease_status in ["visible", "fungal_rot"]:
        grade_code = "REJECT"
        grade_name = "Reject"
        score = 0
        description = "Severely deteriorated, rotten, fungal infected, or unmarketable produce"
        decision_basis.append("Severe visual deterioration / rot overrides maturity -> Final quality decision: REJECT")
    elif maturity_stage == "rotten" and is_severe_deterioration:
        grade_code = "REJECT"
        grade_name = "Reject"
        score = 0
        description = "Severely decayed or non-marketable produce"
        decision_basis.append("Rotten produce condition -> Final quality decision: REJECT")
    elif score < boundaries.get("grade_c", 40):
        grade_code = "REJECT"
        grade_name = "Reject"
        score = 0
        description = "Quality score below commercial marketability threshold"
        decision_basis.append(f"Quality score ({score}) below Grade C threshold -> Final quality decision: REJECT")
    elif score >= boundaries.get("grade_a", 90):
        grade_code = "A"
        grade_name = "Grade A"
        description = "Premium Quality Produce"
        decision_basis.append(f"Quality score ({score} pts) meets Grade A standards -> Final quality decision: Grade A")
    elif score >= boundaries.get("grade_b", 60):
        grade_code = "B"
        grade_name = "Grade B"
        description = "Standard Market Quality Produce"
        decision_basis.append(f"Quality score ({score} pts) meets Grade B standards -> Final quality decision: Grade B")
    else:
        grade_code = "C"
        grade_name = "Grade C"
        description = "Discount Market Quality Produce"
        decision_basis.append(f"Quality score ({score} pts) meets Grade C commercial discount standards -> Final quality decision: Grade C")

    # Hard Invariant Override for Severe Deterioration
    if is_severe_deterioration or (is_rotten and is_severe_deterioration) or visual_quality.get("surface_condition") == "severely_deteriorated" or visual_quality.get("suggested_grade") == "REJECT":
        grade_code = "REJECT"
        grade_name = "Reject"
        score = 0
        description = "Severely deteriorated, rotten produce. Unmarketable."

    reasons = []
    if maturity_stage != "ripe" and maturity_stage != "mature":
        reasons.append(f"Maturity stage: {maturity_stage}")
    if disease_status != "none":
        reasons.append(f"Disease status: {disease_status}")
    if fungal_status != "NONE":
        reasons.append(f"Fungal growth: {fungal_status}")
    if decay_status != "NONE":
        reasons.append(f"Active decay: {decay_status}")
    reasons.extend(defect_reasons)
    if not reasons:
        if grade_code == "C":
            reasons.append("Significant brown/black surface discoloration and peel deterioration detected")
        elif grade_code == "B":
            reasons.append("Minor surface blemishes or uneven ripening detected")
        elif grade_code == "REJECT":
            reasons.append("Severe produce deterioration or rot detected")
        else:
            reasons.append("Commercially desirable maturity with clean surface condition")

    return {
        "status": status_flag,
        "quality_score": score,
        "grade": grade_name,
        "grade_code": grade_code,
        "description": description,
        "decision_basis": decision_basis,
        "penalties": {
            "maturity": mat_penalty,
            "disease": dis_penalty,
            "defect": def_penalty
        },
        "reasons": reasons
    }
