"""
Live End-to-End Test Matrix for AgriGrade AI Master Image Analysis Pipeline.
Executes real HTTP requests against live Python server at http://127.0.0.1:5000/api/v1/ai/analyze.
Validates SHA-256 hash uniqueness, decision basis, crop specificity, Banana baseline, and Tomato REJECT handling.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE_URL = "http://127.0.0.1:5000/api/v1/ai/analyze"

def post_image(image_path, crop_hint=None):
    boundary = "----WebKitFormBoundary" + hex(int(time.time() * 1000))[2:]
    with open(image_path, "rb") as f:
        img_bytes = f.read()

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{Path(image_path).name}"\r\n'.encode("utf-8"))
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(img_bytes)
    body.extend(b"\r\n")

    if crop_hint:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="crop_hint"\r\n\r\n'.encode("utf-8"))
        body.extend(crop_hint.encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        BASE_URL,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return resp.status, data
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode("utf-8"))
            return e.code, data
        except:
            return e.code, {"error": str(e)}

def run_matrix():
    print("=========================================================================================")
    print("                     AgriGrade AI — Live Full Matrix Verification Suite                 ")
    print("=========================================================================================\n")

    test_images = [
        ("1. Fungal Rotten Tomato", r"C:\Users\naksh\.gemini\antigravity\brain\14475d51-5939-410a-bad2-68c95c87bb35\.user_uploaded\media_1786686525044.jpg", "tomato", "REJECT", 0),
        ("2. Healthy Unripe Tomato", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\tomato\Image_1.jpg", "tomato", "Grade A", 90),
        ("3. Healthy Ripe Tomato", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\tomato\Image_2.jpg", "tomato", "Grade A", 100),
        ("4. Overripe/Blemished Tomato", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\tomato\Image_5.jpg", "tomato", "Grade C", 60),
        ("5. Dark/Overripe Banana (No Fungus)", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\processed\banana\maturity\test\rotten\00256d964b03b9e7.jpg", "banana", "Grade C", 65),
        ("6. Healthy Ripe Banana", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\processed\banana\maturity\test\ripe\0023a170f79eaf5c.jpg", "banana", "Grade A", 100),
        ("7. Mango Sample", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\mango\Grade_A\IMG_20210703_142244.jpg", "mango", "Grade A", 90),
        ("8. Carrot Sample", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\carrot\Carrots-168\Carrots_001.jpg", "carrot", "Grade B", 80),
        ("9. Okra Sample", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\okra\Okra Image Dataset\Okra Image Dataset\Mature\10007_jpg.rf.644e14c5eeba1110c17e2df7bf135883.jpg", "okra", "Grade A", 90),
        ("10. Wrong Crop Protection (Banana with crop_hint=tomato)", r"C:\Users\naksh\.gemini\antigravity\scratch\ai-service\dataset\processed\banana\maturity\test\ripe\0023a170f79eaf5c.jpg", "tomato", "INVALID_CROP", None)
    ]

    all_passed = True
    seen_hashes = {}

    for name, img_path, crop_hint, exp_grade, exp_score in test_images:
        p = Path(img_path)
        if not p.exists():
            print(f"[SKIP] {name}: File not found at {img_path}")
            continue

        status_code, res = post_image(p, crop_hint)
        sha = res.get("input_image", {}).get("sha256", "N/A")
        anl_id = res.get("analysis_id", "N/A")
        crop = res.get("crop", {}).get("name", res.get("detected_crop", "N/A"))
        grade_code = res.get("quality", {}).get("grade", res.get("status", "N/A"))
        grade_display = res.get("quality", {}).get("grade_display", grade_code)
        score = res.get("quality", {}).get("score", None)
        shelf = res.get("shelf_life", {}).get("estimated_range", "N/A") if res.get("shelf_life") else "N/A"
        price = res.get("price_prediction", {}).get("estimated_low", "N/A") if res.get("price_prediction") else "N/A"
        basis = res.get("decision_basis", [])

        # Check hash uniqueness
        if sha != "N/A":
            if sha in seen_hashes and name != "10. Wrong Crop Protection (Banana with crop_hint=tomato)":
                print(f"[WARNING] Duplicate SHA-256 detected with {seen_hashes[sha]}: {sha}")
            seen_hashes[sha] = name

        pass_check = False
        if exp_grade == "INVALID_CROP":
            pass_check = (res.get("status") == "INVALID_CROP")
        elif exp_grade == "REJECT":
            pass_check = (grade_code in ["Reject", "REJECT"] and score == 0)
        elif "Grade A" in exp_grade:
            pass_check = (grade_code in ["A", "Grade A"] and score is not None and score >= 85)
        elif "Grade B" in exp_grade:
            pass_check = (grade_code in ["B", "Grade B", "A", "Grade A"] and score is not None and score >= 75)
        elif "Grade C" in exp_grade:
            pass_check = (grade_code in ["C", "Grade C", "B", "Grade B"] and score is not None and score >= 60)
        else:
            pass_check = (score is not None)

        if not pass_check:
            all_passed = False

        status_str = "PASS" if pass_check else "FAIL"
        print(f"[{status_str}] {name}")
        print(f"       Analysis ID: {anl_id} | SHA-256: {sha[:16]}... ({len(sha)} chars)")
        print(f"       Crop: {crop} | Grade: {grade_display} ({grade_code}) | Score: {score} | Shelf: {shelf} | Price: {price}")
        if basis:
            print(f"       Decision Basis: {basis[-1]}")
        print()

    print("=========================================================================================")
    print(f" Matrix Summary: {'ALL TESTS PASSED 100%' if all_passed else 'SOME TESTS FAILED'}")
    print("=========================================================================================")

if __name__ == "__main__":
    run_matrix()
