import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_market_prices():
    print("\n--- 1. Testing GET /api/v1/market/prices (Tomato) ---")
    url = f"{BASE_URL}/api/v1/market/prices?crop=tomato&state=Tamil+Nadu&district=Coimbatore&grade=Grade+A&score=90.0&shelf_life_days=5.0"
    res = requests.get(url)
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print("Response keys:", list(data.keys()))
    print("Freshness:", data.get("data_freshness"))
    print("Market Price:", data.get("market_price"))
    assert res.status_code == 200
    assert data.get("status") == "SUCCESS"
    assert "data.gov.in" in data.get("market_price", {}).get("source", "")

def test_market_recommendations_commercial():
    print("\n--- 2. Testing GET /api/v1/market/recommendations (Grade A Commercial) ---")
    url = f"{BASE_URL}/api/v1/market/recommendations?crop=banana&state=Tamil+Nadu&district=Coimbatore&grade=Grade+A&quality_score=92.0&shelf_life_days=7.0&quantity_kg=1500"
    res = requests.get(url)
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print("Status:", data.get("status"))
    print("Source:", data.get("source"))
    print("Total Markets returned:", len(data.get("markets", [])))
    if data.get("markets"):
        top = data["markets"][0]
        print("Top Market:", top["market_name"], "District:", top["district"], "Modal Price:", top["modal_price_per_kg"], "Net:", top["net_realization"])
    assert res.status_code == 200
    assert data.get("status") == "SUCCESS"
    assert len(data.get("markets", [])) > 0

def test_market_recommendations_reject():
    print("\n--- 3. Testing GET /api/v1/market/recommendations (REJECTED Crop) ---")
    url = f"{BASE_URL}/api/v1/market/recommendations?crop=tomato&grade=REJECT&quality_score=0.0"
    res = requests.get(url)
    print(f"Status Code: {res.status_code}")
    data = res.json()
    print("Status:", data.get("status"))
    print("Action:", data.get("action"))
    print("Reason:", data.get("reason"))
    assert res.status_code == 200
    assert data.get("status") == "REJECTED"

if __name__ == "__main__":
    test_market_prices()
    test_market_recommendations_commercial()
    test_market_recommendations_reject()
    print("\n[SUCCESS] ALL LIVE MARKET INTELLIGENCE INTEGRATION TESTS PASSED PERFECTLY!")
