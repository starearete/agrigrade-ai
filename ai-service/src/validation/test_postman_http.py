"""
Postman / HTTP API Validation for Tomato Endpoint.
Tests live POST http://127.0.0.1:5000/api/v1/ai/analyze with multipart/form-data using a real Tomato image.
Saves results to reports/tomato_integration/tomato_postman_validation.json
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Force UTF-8 console output encoding for Windows compatibility
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPORT_DIR = BASE_DIR / "reports" / "tomato_integration"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

TOMATO_IMG_PATH = Path(r"C:\Users\naksh\.gemini\antigravity\scratch\agrigrade-frontend\crop-quality-ai\crop-quality-ai\dataset\tomato\grade_a\Grade_A_01.jpg")

def test_live_api():
    print("=================================================================")
    print("      AgriGrade AI — Tomato Live HTTP / Postman API Test         ")
    print("=================================================================\n")

    # Read image
    with open(TOMATO_IMG_PATH, "rb") as f:
        img_bytes = f.read()

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    body = bytearray()
    # Add file part
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="tomato_grade_a.jpg"\r\n'.encode("utf-8"))
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(img_bytes)
    body.extend(b"\r\n")

    # Add crop_hint part
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="crop_hint"\r\n\r\n'.encode("utf-8"))
    body.extend(b"tomato\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    url = "http://127.0.0.1:5000/api/v1/ai/analyze"
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.status
            raw_data = resp.read().decode("utf-8")
            data = json.loads(raw_data)

            print(f"[HTTP RESPONSE] Status Code: {status_code}")
            print(f" -> Analysis ID: {data.get('analysis_id')}")
            print(f" -> Crop Name: {data.get('crop', {}).get('name')}")
            print(f" -> CNN Model: {data.get('cnn', {}).get('model')} (Prediction: {data.get('cnn', {}).get('prediction')}, Conf: {data.get('cnn', {}).get('confidence')})")
            print(f" -> YOLO Status: {data.get('yolo', {}).get('model_status')}")
            print(f" -> Quality Grade: {data.get('quality', {}).get('grade')} (Score: {data.get('quality', {}).get('score')})")
            print(f" -> Shelf Life: {data.get('shelf_life', {}).get('estimated_range')}")
            print(f" -> Market Price: Rs.{data.get('market_price', {}).get('reference_price')}/kg ({data.get('market_price', {}).get('market')})")
            print(f" -> Selling Range: Rs.{data.get('price_prediction', {}).get('estimated_low')}-Rs.{data.get('price_prediction', {}).get('estimated_high')}/kg")
            print(f" -> Recommendation: {data.get('market_recommendation', {}).get('action')}")

            # Verify required fields
            required_fields = [
                "status", "analysis_id", "crop", "detection", "cnn", "yolo", "gemini",
                "maturity", "disease", "defects", "agreement", "quality", "shelf_life",
                "market_price", "price_prediction", "market_recommendation", "recommendations",
                "models", "performance"
            ]

            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"[ERROR] Missing required contract fields: {missing}")
                pass_fail = "FAIL"
            else:
                print("\n[SUCCESS] All 19 required response contract fields present and validated!")
                pass_fail = "PASS"

            # Save report
            report_payload = {
                "test_name": "Tomato Live HTTP / Postman API Test",
                "endpoint": "POST http://127.0.0.1:5000/api/v1/ai/analyze",
                "http_status": status_code,
                "pass_fail": pass_fail,
                "response": data
            }

            with open(REPORT_DIR / "tomato_postman_validation.json", "w", encoding="utf-8") as f:
                json.dump(report_payload, f, indent=2)

            print(f"Saved Postman validation artifact to: {REPORT_DIR / 'tomato_postman_validation.json'}")

    except Exception as e:
        print(f"[HTTP REQUEST ERROR] {e}")

if __name__ == "__main__":
    test_live_api()
