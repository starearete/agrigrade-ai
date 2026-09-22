"""
Comprehensive Tomato Pipeline Validation & Banana Regression Test Suite.
Validates:
1. Test 1: Rotten / Fungal Tomato Detection -> REJECT (Score: 0, Shelf Life: 0 days)
2. Test 2: Healthy Unripe Tomato -> Maturity: UNRIPE, Condition: HEALTHY, Grade != REJECT
3. Test 3: Healthy Ripe Tomato -> Maturity: RIPE, Grade: A (High Commercial Grade)
4. Test 4: Ripe Tomato with Fungus -> Disease Priority Over Maturity -> REJECT (Score: 0)
5. Test 5: Wrong Crop Protection -> Banana image with crop_hint="tomato" -> INVALID_CROP
6. Test 6: Banana Regression Test (Protected Baseline — EfficientNet-B0 Maturity, Grade A, Rs.28.50/kg)

Saves results to reports/tomato_integration/
"""

import io
import sys
import json
import time
import numpy as np
from pathlib import Path
from PIL import Image

# Force UTF-8 console output encoding for Windows compatibility
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "src"))

from api.analyze_pipeline import analyze_crop_image
from services.market_price_service import get_market_price_and_prediction
from services.shelf_life_service import predict_shelf_life
from inference.multi_crop_predictor import predict_crop_quality

DATASET_DIR = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\agrigrade-frontend\crop-quality-ai\crop-quality-ai\dataset")
BANANA_TEST_DIR = BASE_DIR / "dataset" / "processed" / "banana" / "maturity" / "test"
USER_ROTTEN_PATH = Path(r"C:\Users\naksh\.gemini\antigravity\brain\14475d51-5939-410a-bad2-68c95c87bb35\.user_uploaded\media_1786686525044.jpg")
REPORT_DIR = BASE_DIR / "reports" / "tomato_integration"

def run_tomato_validation():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    all_validation_results = []

    print("=================================================================")
    print("      AgriGrade AI — Tomato Pipeline Integration & Test Suite     ")
    print("=================================================================\n")

    # -------------------------------------------------------------------
    # TEST 1: Rotten / Fungal Tomato (Mandatory REJECT Rule)
    # -------------------------------------------------------------------
    print("[RUNNING] Test 1: Rotten / Fungal Tomato Detection...")
    with open(USER_ROTTEN_PATH, "rb") as f:
        rotten_bytes = f.read()

    res_1 = analyze_crop_image(rotten_bytes, crop_hint="tomato")
    
    pass_1 = (
        res_1.get("status") == "SUCCESS" and
        res_1.get("crop", {}).get("name") == "tomato" and
        res_1.get("fungal_growth", {}).get("status") == "SEVERE" and
        res_1.get("active_decay", {}).get("status") == "PRESENT" and
        res_1.get("quality", {}).get("grade") == "REJECT" and
        res_1.get("quality", {}).get("score") == 0 and
        res_1.get("shelf_life", {}).get("estimated_days_high", 0) == 0
    )

    t1_record = {
        "test": "Test 1 — Rotten/Fungal Tomato",
        "pass_fail": "PASS" if pass_1 else "FAIL",
        "crop": res_1.get("crop"),
        "maturity": res_1.get("maturity"),
        "fungal_growth": res_1.get("fungal_growth"),
        "active_decay": res_1.get("active_decay"),
        "quality": res_1.get("quality"),
        "shelf_life": res_1.get("shelf_life"),
        "market_recommendation": res_1.get("market_recommendation")
    }
    all_validation_results.append(t1_record)
    print(f" -> Test 1: {t1_record['pass_fail']} | Crop: {res_1.get('crop', {}).get('name')} | Fungal: {res_1.get('fungal_growth', {}).get('status')} | Active Decay: {res_1.get('active_decay', {}).get('status')} | Grade: {res_1.get('quality', {}).get('grade')} ({res_1.get('quality', {}).get('score')} pts) | Shelf Life: {res_1.get('shelf_life', {}).get('estimated_range')}\n")

    # -------------------------------------------------------------------
    # TEST 2: Healthy Unripe Tomato
    # -------------------------------------------------------------------
    print("[RUNNING] Test 2: Healthy Unripe Tomato...")
    # Generate smooth firm green tomato image
    y, x = np.ogrid[:224, :224]
    dist_from_center = np.sqrt((x - 112)**2 + (y - 112)**2)
    mask = dist_from_center <= 80
    green_arr = np.full((224, 224, 3), 255, dtype=np.uint8)
    green_arr[mask] = [60, 165, 45] # bright firm green
    buf = io.BytesIO()
    Image.fromarray(green_arr).save(buf, format="JPEG")
    unripe_bytes = buf.getvalue()

    res_2 = analyze_crop_image(unripe_bytes, crop_hint="tomato")

    pass_2 = (
        res_2.get("status") == "SUCCESS" and
        res_2.get("crop", {}).get("name") == "tomato" and
        res_2.get("maturity", {}).get("stage") == "unripe" and
        res_2.get("fungal_growth", {}).get("status") == "NONE" and
        res_2.get("active_decay", {}).get("status") == "NONE" and
        res_2.get("quality", {}).get("grade") != "REJECT" and
        res_2.get("quality", {}).get("score", 0) >= 80
    )

    t2_record = {
        "test": "Test 2 — Healthy Unripe Tomato",
        "pass_fail": "PASS" if pass_2 else "FAIL",
        "crop": res_2.get("crop"),
        "maturity": res_2.get("maturity"),
        "fungal_growth": res_2.get("fungal_growth"),
        "active_decay": res_2.get("active_decay"),
        "quality": res_2.get("quality"),
        "shelf_life": res_2.get("shelf_life")
    }
    all_validation_results.append(t2_record)
    print(f" -> Test 2: {t2_record['pass_fail']} | Crop: {res_2.get('crop', {}).get('name')} | Maturity: {res_2.get('maturity', {}).get('stage')} | Fungal: {res_2.get('fungal_growth', {}).get('status')} | Grade: {res_2.get('quality', {}).get('grade')} ({res_2.get('quality', {}).get('score')} pts) | Shelf Life: {res_2.get('shelf_life', {}).get('estimated_range')}\n")

    # -------------------------------------------------------------------
    # TEST 3: Healthy Ripe Tomato (Grade A)
    # -------------------------------------------------------------------
    print("[RUNNING] Test 3: Healthy Ripe Tomato...")
    img_a_path = DATASET_DIR / "tomato" / "grade_a" / "Grade_A_01.jpg"
    with open(img_a_path, "rb") as f:
        img_a_bytes = f.read()

    res_3 = analyze_crop_image(img_a_bytes, crop_hint="tomato")

    pass_3 = (
        res_3.get("status") == "SUCCESS" and
        res_3.get("crop", {}).get("name") == "tomato" and
        res_3.get("maturity", {}).get("stage") == "ripe" and
        res_3.get("fungal_growth", {}).get("status") == "NONE" and
        res_3.get("quality", {}).get("grade") == "A" and
        res_3.get("quality", {}).get("score", 0) >= 90
    )

    t3_record = {
        "test": "Test 3 — Healthy Ripe Tomato",
        "pass_fail": "PASS" if pass_3 else "FAIL",
        "crop": res_3.get("crop"),
        "cnn": res_3.get("cnn"),
        "maturity": res_3.get("maturity"),
        "quality": res_3.get("quality"),
        "shelf_life": res_3.get("shelf_life"),
        "market_price": res_3.get("market_price"),
        "price_prediction": res_3.get("price_prediction")
    }
    all_validation_results.append(t3_record)
    print(f" -> Test 3: {t3_record['pass_fail']} | Crop: {res_3.get('crop', {}).get('name')} | Maturity: {res_3.get('maturity', {}).get('stage')} | Grade: {res_3.get('quality', {}).get('grade')} ({res_3.get('quality', {}).get('score')} pts) | Price: Rs.{res_3.get('market_price', {}).get('reference_price')}/kg\n")

    # -------------------------------------------------------------------
    # TEST 4: Ripe Tomato with Fungus (Disease Priority Hierarchy)
    # -------------------------------------------------------------------
    print("[RUNNING] Test 4: Ripe Tomato with Fungus (Disease Priority Hierarchy)...")
    # Using red tomato with fungal calyx mold (media_1786686525044.jpg)
    res_4 = analyze_crop_image(rotten_bytes, crop_hint="tomato")

    pass_4 = (
        res_4.get("status") == "SUCCESS" and
        res_4.get("crop", {}).get("name") == "tomato" and
        res_4.get("fungal_growth", {}).get("status") == "SEVERE" and
        res_4.get("quality", {}).get("grade") == "REJECT" and
        res_4.get("quality", {}).get("score") == 0 and
        res_4.get("shelf_life", {}).get("estimated_days_high", 0) == 0
    )

    t4_record = {
        "test": "Test 4 — Ripe Tomato with Fungus",
        "pass_fail": "PASS" if pass_4 else "FAIL",
        "quality": res_4.get("quality"),
        "fungal_growth": res_4.get("fungal_growth"),
        "active_decay": res_4.get("active_decay"),
        "shelf_life": res_4.get("shelf_life")
    }
    all_validation_results.append(t4_record)
    print(f" -> Test 4: {t4_record['pass_fail']} | Disease Priority Enforced -> Grade: {res_4.get('quality', {}).get('grade')} (Score: {res_4.get('quality', {}).get('score')} pts) | Shelf Life: {res_4.get('shelf_life', {}).get('estimated_range')}\n")

    # -------------------------------------------------------------------
    # TEST 5: Wrong Crop Protection
    # -------------------------------------------------------------------
    print("[RUNNING] Test 5: Wrong Crop Protection (Upload Banana with crop_hint='tomato')...")
    banana_ripe_sample = BANANA_TEST_DIR / "ripe" / "0023a170f79eaf5c.jpg"
    with open(banana_ripe_sample, "rb") as f:
        banana_bytes = f.read()

    res_5 = analyze_crop_image(banana_bytes, crop_hint="tomato")
    pass_5 = res_5.get("status") == "INVALID_CROP" and res_5.get("expected_crop") == "tomato" and res_5.get("detected_crop") == "banana"

    t5_record = {
        "test": "Test 5 — Wrong Crop Protection",
        "pass_fail": "PASS" if pass_5 else "FAIL",
        "status": res_5.get("status"),
        "expected_crop": res_5.get("expected_crop"),
        "detected_crop": res_5.get("detected_crop"),
        "message": res_5.get("message")
    }
    all_validation_results.append(t5_record)
    print(f" -> Test 5: {t5_record['pass_fail']} | Status: {res_5.get('status')} | Expected: {res_5.get('expected_crop')} | Detected: {res_5.get('detected_crop')}\n")

    # -------------------------------------------------------------------
    # TEST 6: Banana Regression Test (Protected Baseline)
    # -------------------------------------------------------------------
    print("[RUNNING] Test 6: Banana Regression Test (Protected Baseline)...")
    res_6 = analyze_crop_image(banana_bytes, crop_hint="banana")

    pass_6 = (
        res_6.get("status") == "SUCCESS" and
        res_6.get("crop", {}).get("name") == "banana" and
        res_6.get("trained_model", {}).get("name") == "EfficientNet-B0 (Banana Maturity CNN)" and
        res_6.get("maturity", {}).get("stage") == "ripe" and
        res_6.get("quality", {}).get("grade") == "A" and
        res_6.get("market_price", {}).get("reference_price") == 28.50 and
        res_6.get("market_price", {}).get("market") == "Coimbatore Wholesale APMC"
    )

    t6_record = {
        "test": "Test 6 — Banana Protected Baseline Regression",
        "pass_fail": "PASS" if pass_6 else "FAIL",
        "crop": res_6.get("crop"),
        "trained_model": res_6.get("trained_model"),
        "maturity": res_6.get("maturity"),
        "quality": res_6.get("quality"),
        "market_price": res_6.get("market_price"),
        "price_prediction": res_6.get("price_prediction")
    }
    all_validation_results.append(t6_record)
    print(f" -> Test 6: {t6_record['pass_fail']} | Crop: {res_6.get('crop', {}).get('name')} | CNN: {res_6.get('trained_model', {}).get('name')} ({res_6.get('maturity', {}).get('stage')}) | Grade: {res_6.get('quality', {}).get('grade')} | Price: Rs.{res_6.get('market_price', {}).get('reference_price')}/kg\n")

    # Save comprehensive validation JSON report
    with open(REPORT_DIR / "tomato_pipeline_validation.json", "w", encoding="utf-8") as f:
        json.dump(all_validation_results, f, indent=2)

    print("=================================================================")
    print(" Tomato Pipeline Validation complete! All artifacts saved to:")
    print(f" {REPORT_DIR}")
    print("=================================================================\n")

if __name__ == "__main__":
    run_tomato_validation()
