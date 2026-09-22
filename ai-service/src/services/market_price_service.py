"""
Market Price Integration Service for AgriGrade AI Python Engine.
Connects AI quality grading results with official Government of India (data.gov.in) mandi market rates
and calculates deterministic quality-adjusted selling prices.
"""

from typing import Tuple, Dict, Any, Optional
from market.market_service import MarketService

_market_service_instance = MarketService()

def get_market_price_and_prediction(
    crop_name: str,
    grade_code: str,
    quality_score: float,
    shelf_life_days: Optional[float] = None,
    location_hint: Optional[Dict[str, str]] = None
) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], list]:
    """
    Fetches official government mandi data and computes quality-adjusted price prediction,
    market recommendation, and multi-market comparison.
    
    Returns:
        (market_price_dict, price_prediction_dict, recommendation_dict, market_comparison_list)
    """
    state = "Tamil Nadu"
    district = "Coimbatore"
    market = None

    if location_hint:
        state = location_hint.get("state", state)
        district = location_hint.get("district", district)
        market = location_hint.get("market", market)

    analysis = _market_service_instance.get_market_analysis(
        crop_name=crop_name,
        quality_grade=grade_code,
        quality_score=quality_score,
        shelf_life_days=shelf_life_days,
        user_state=state,
        user_district=district,
        user_market=market
    )

    return (
        analysis["market_price"],
        analysis["price_prediction"],
        analysis["market_recommendation"],
        analysis.get("market_comparison", [])
    )
