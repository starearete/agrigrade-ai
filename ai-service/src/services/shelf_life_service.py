"""
Shelf Life & Freshness Prediction Service for AgriGrade AI.
Calculates dynamic estimated remaining shelf life based on crop type, maturity stage, quality grade, defects, disease, and storage conditions.
"""

def predict_shelf_life(crop_name, maturity_stage="ripe", quality_grade="Grade A", defects=None, disease_status="none", fungal_status="NONE", active_decay="NONE", storage_condition="ambient"):
    """
    Computes estimated remaining shelf life range, confidence, and storage assumptions.
    Returns shelf_life dictionary.
    """
    crop_name = str(crop_name).lower().strip()
    maturity_stage = str(maturity_stage).lower().strip()
    grade = str(quality_grade).upper().strip()

    if defects is None:
        defects = []

    g_upper = grade.upper().replace("_", " ")

    # Base shelf life in days for ambient room temperature (25°C)
    if crop_name == "banana":
        if "REJECT" in g_upper or maturity_stage in ["rotten", "advanced_rotten"] or fungal_status in ["SEVERE", "MODERATE"] or active_decay == "PRESENT":
            base_days_low, base_days_high = 0, 0
            conf = 0.95
        elif "GRADE C" in g_upper or g_upper in ["C", "COMMERCIAL"] or maturity_stage in ["overripe"]:
            base_days_low, base_days_high = 1, 1
            conf = 0.88
        elif "GRADE B" in g_upper or g_upper in ["B", "STANDARD"]:
            base_days_low, base_days_high = 4, 5
            conf = 0.92
        elif "GRADE A" in g_upper or g_upper in ["A", "PREMIUM"] or maturity_stage in ["unripe", "ripe"]:
            base_days_low, base_days_high = 6, 8
            conf = 0.90
        else:
            base_days_low, base_days_high = 2, 4
            conf = 0.80
    elif crop_name == "tomato":
        if maturity_stage in ["unripe", "green"]:
            base_days_low, base_days_high = 10, 14
            conf = 0.90
        elif maturity_stage in ["breaker", "turning"]:
            base_days_low, base_days_high = 7, 10
            conf = 0.90
        elif maturity_stage in ["ripe", "pink", "light_red"]:
            if "A" in grade:
                base_days_low, base_days_high = 5, 8
                conf = 0.92
            else:
                base_days_low, base_days_high = 3, 5
                conf = 0.90
        elif maturity_stage in ["overripe"]:
            base_days_low, base_days_high = 1, 3
            conf = 0.85
        elif maturity_stage in ["rotten"]:
            base_days_low, base_days_high = 0, 1
            conf = 0.90
        else:
            base_days_low, base_days_high = 4, 7
            conf = 0.85
    else:
        # Default crop shelf life
        base_days_low, base_days_high = 3, 7
        conf = 0.80

    # Adjust for storage condition
    storage_condition = str(storage_condition).lower().strip()
    if "cool" in storage_condition or "cold" in storage_condition or "refrigerat" in storage_condition:
        base_days_low = int(base_days_low * 1.5)
        base_days_high = int(base_days_high * 1.5)
        storage_label = "Cool / Refrigerated (12-15°C)"
    else:
        storage_label = "Ambient Room Temperature (25°C)"

    # Penalty for active decay or fungal growth or REJECT grade
    if fungal_status in ["SEVERE", "MODERATE"] or active_decay == "PRESENT" or "REJECT" in grade:
        base_days_low = 0
        base_days_high = 0
        conf = 0.95
        range_str = "0 days (Expired / Unmarketable)"
    else:
        range_str = f"{base_days_low}–{base_days_high} days"

    remaining_days = base_days_high

    from datetime import datetime, timedelta
    best_before_dt = datetime.now() + timedelta(days=remaining_days)
    best_before_date = best_before_dt.strftime("%Y-%m-%d")

    assumptions = [
        f"Assumes storage under {storage_label}",
        f"Maturity stage evaluated as {maturity_stage.capitalize()}",
        "Epidermal cuticle intact" if fungal_status == "NONE" else "Accelerated decay from fungal/rot exposure"
    ]

    return {
        "estimated_range": range_str,
        "remaining_days": remaining_days,
        "estimated_days_low": base_days_low,
        "estimated_days_high": base_days_high,
        "best_before_date": best_before_date,
        "confidence": round(conf, 2),
        "storage_condition": storage_label,
        "assumptions": assumptions,
        "disclaimer": "Visual commercial quality assessment only; not a food-safety certification."
    }
