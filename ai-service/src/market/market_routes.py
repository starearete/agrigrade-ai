"""
FastAPI Routes for AgriGrade AI Market Intelligence.
Exposes public endpoints for querying official government mandi prices, multi-market comparison, and refresh audits.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List

try:
    from .market_service import MarketService
    from .market_cache import MarketCache
except ImportError:
    from market.market_service import MarketService
    from market.market_cache import MarketCache

router = APIRouter(prefix="/api/v1/market", tags=["Market Intelligence"])
market_service = MarketService()
market_cache = MarketCache()

@router.get("/prices")
def get_market_prices(
    crop: str = Query(..., description="Crop name (e.g. tomato, banana, mango, onion)"),
    state: Optional[str] = Query("Tamil Nadu", description="State name"),
    district: Optional[str] = Query("Coimbatore", description="District name"),
    market: Optional[str] = Query(None, description="Specific market name"),
    grade: Optional[str] = Query("A", description="Quality grade (A, B, C, REJECT)"),
    score: Optional[float] = Query(90.0, description="AI Quality score (0-100)"),
    shelf_life_days: Optional[float] = Query(None, description="Remaining shelf life in days")
) -> Dict[str, Any]:
    """
    Returns official government mandi rates, quality-adjusted predicted range, and multi-market recommendations.
    """
    analysis = market_service.get_market_analysis(
        crop_name=crop,
        quality_grade=grade,
        quality_score=score,
        shelf_life_days=shelf_life_days,
        user_state=state,
        user_district=district,
        user_market=market
    )
    return {
        "status": "SUCCESS" if analysis["market_price"].get("available") else "PRICE_DATA_UNAVAILABLE",
        **analysis
    }

@router.get("/recommendations")
def get_market_recommendations_get(
    crop: str = Query(..., description="Crop name (e.g. tomato, banana, mango, onion)"),
    state: Optional[str] = Query("Tamil Nadu", description="State name"),
    district: Optional[str] = Query("Coimbatore", description="District name"),
    grade: Optional[str] = Query("Grade A", description="Quality grade (Grade A, Grade B, Grade C, REJECT)"),
    quality_score: Optional[float] = Query(90.0, description="AI Quality score (0-100)"),
    shelf_life_days: Optional[float] = Query(5.0, description="Remaining shelf life in days"),
    quantity_kg: Optional[float] = Query(1000.0, description="Load quantity in kg"),
    sort_mode: Optional[str] = Query("BEST_NET_REALIZATION", description="Sorting criteria"),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None)
) -> Dict[str, Any]:
    """
    GET /api/v1/market/recommendations — Returns full multi-market recommendation payload based on official mandi data.
    """
    return market_service.get_recommendations_v1(
        crop_name=crop,
        quality_grade=grade or "Grade A",
        quality_score=quality_score if quality_score is not None else 90.0,
        shelf_life_days=shelf_life_days,
        quantity_kg=quantity_kg if quantity_kg is not None else 1000.0,
        user_state=state or "Tamil Nadu",
        user_district=district or "Coimbatore",
        sort_mode=sort_mode or "BEST_NET_REALIZATION",
        latitude=latitude,
        longitude=longitude
    )

@router.post("/recommendations")
def get_market_recommendations_post(
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    POST /api/v1/market/recommendations — Returns full multi-market recommendation payload based on official mandi data.
    """
    crop = payload.get("crop") or payload.get("cropName") or "tomato"
    state = payload.get("state") or "Tamil Nadu"
    district = payload.get("district") or payload.get("harvestLocationDistrict") or "Coimbatore"
    grade = payload.get("grade") or payload.get("qualityGrade") or "Grade A"
    score = payload.get("qualityScore") or payload.get("quality_score") or 90.0
    shelf = payload.get("shelfLifeDays") or payload.get("shelf_life_days") or 5.0
    qty = payload.get("quantityKg") or payload.get("quantity_kg") or payload.get("quantity") or 1000.0
    sort_mode = payload.get("sortMode") or payload.get("sort_mode") or "BEST_NET_REALIZATION"
    lat = payload.get("latitude")
    lng = payload.get("longitude")

    return market_service.get_recommendations_v1(
        crop_name=crop,
        quality_grade=grade,
        quality_score=float(score),
        shelf_life_days=float(shelf) if shelf is not None else 5.0,
        quantity_kg=float(qty),
        user_state=state,
        user_district=district,
        sort_mode=sort_mode,
        latitude=float(lat) if lat is not None else None,
        longitude=float(lng) if lng is not None else None
    )

@router.get("/latest")
def get_latest_market_rates(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    state: Optional[str] = Query("Tamil Nadu", description="State name"),
    district: Optional[str] = Query(None, description="District name"),
    limit: int = Query(50, ge=1, le=200)
) -> Dict[str, Any]:
    """
    Returns latest cached official government mandi records.
    """
    if crop:
        records = market_cache.query_market_prices(crop, state=state, district=district, limit=limit)
    else:
        records = []
        for c in ["banana", "tomato", "mango", "onion", "okra", "carrot", "brinjal", "green_chilli"]:
            records.extend(market_cache.query_market_prices(c, state=state, district=district, limit=5))

    return {
        "status": "SUCCESS",
        "source": "data.gov.in",
        "total_records": len(records),
        "records": records
    }

@router.post("/refresh")
def trigger_market_refresh() -> Dict[str, Any]:
    """
    Manually triggers daily government mandi data synchronization.
    """
    result = market_service.refresh_daily_data()
    return result

@router.get("/status")
def get_market_status() -> Dict[str, Any]:
    """
    Returns database cache status, record count, and last refresh timestamp.
    """
    return market_cache.get_status()
