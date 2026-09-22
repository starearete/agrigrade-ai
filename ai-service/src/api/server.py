"""
FastAPI Server for AgriGrade AI Python Inference Engine.
Exposes REST endpoints for image analysis, crop identification, CNN/YOLO inference, quality grading, shelf life, and market price prediction.
"""

import sys
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.analyze_pipeline import analyze_crop_image
from inference.model_registry import model_registry
from market.market_routes import router as market_router
from api.admin_health_routes import router as admin_health_router
from market.market_refresh_scheduler import MarketRefreshScheduler
from market.market_cache import MarketCache

app = FastAPI(
    title="AgriGrade AI — Vision & Quality Analysis API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router)
app.include_router(admin_health_router)

scheduler = MarketRefreshScheduler()

@app.on_event("startup")
def on_startup():
    scheduler.start()

@app.on_event("shutdown")
def on_shutdown():
    scheduler.stop()

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    cache = MarketCache()
    cache_status = cache.get_status()
    mandi_up = cache_status.get("status") == "HEALTHY" or cache_status.get("total_records", 0) > 0
    return {
        "status": "UP",
        "service": "ai-service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dependencies": {
            "database": {
                "status": "UP"
            },
            "mandi_api": {
                "status": "UP" if mandi_up else "DEGRADED"
            },
            "model": {
                "status": "UP"
            }
        },
        "yolo": model_registry.get_yolo_info(),
        "banana_cnn": model_registry.get_cnn_info("banana", "maturity"),
        "market": cache_status
    }

@app.post("/api/v1/ai/analyze")
async def analyze_image(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    crop_hint: str = Form(None),
    location: str = Form(None),
    storage_condition: str = Form("ambient"),
    market: str = Form(None),
    quantity: str = Form(None)
):
    upload = file or image
    if not upload:
        raise HTTPException(status_code=400, detail="No image file uploaded. Parameter 'file' or 'image' required.")

    img_bytes = await upload.read()
    if not img_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = analyze_crop_image(
        img_bytes,
        crop_hint=crop_hint,
        location=location or market,
        storage_condition=storage_condition
    )

    if result.get("status") == "REJECTED" and ("Invalid image" in result.get("reason", "") or "No supported" in result.get("reason", "")):
        raise HTTPException(status_code=400, detail=result.get("reason"))

    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
