"""
High-Level Agricultural Market Analysis & Recommendation Engine for AgriGrade AI.
Orchestrates official Government mandi data retrieval, validation, quality-adjusted pricing,
shelf-life compatibility scoring, and multi-market arbitrage recommendations.
"""

import os
import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Tuple

try:
    from .commodity_mapper import CommodityMapper
    from .data_gov_provider import DataGovProvider
    from .market_cache import MarketCache
    from .market_price_validator import MarketPriceValidator
except ImportError:
    from market.commodity_mapper import CommodityMapper
    from market.data_gov_provider import DataGovProvider
    from market.market_cache import MarketCache
    from market.market_price_validator import MarketPriceValidator

logger = logging.getLogger("AgriGradeMarketService")

# Known approximate distances from Coimbatore agricultural hub (km)
MARKET_DISTANCES = {
    "coimbatore": 15,
    "mettupalayam": 38,
    "pollachi": 42,
    "tiruppur": 55,
    "erode": 95,
    "dindigul": 150,
    "ottanchatram": 140,
    "salem": 165,
    "theni": 180,
    "tiruchirappalli": 215,
    "trichy": 215,
    "udhagamandalam": 85,
    "ooty": 85,
    "kolar": 360,
    "krishnagiri": 250,
    "dharmapuri": 220,
    "nashik": 1150,
    "lasalgaon": 1180
}

class MarketService:
    """
    Core business service providing official mandi price intelligence and quality-adjusted predictions.
    """

    def __init__(self, provider: Optional[DataGovProvider] = None, cache: Optional[MarketCache] = None):
        self.cache = cache or MarketCache()
        self.provider = provider or DataGovProvider()
def normalize_grade(quality_grade: Any, quality_score: float = 100.0, shelf_life_days: Optional[float] = None) -> str:
    g_str = str(quality_grade or "").upper().strip()
    if "REJECT" in g_str or "QUARANTINE" in g_str or quality_score <= 10:
        return "REJECT"
    if "GRADE_A" in g_str or "GRADE A" in g_str or g_str in ["A", "PREMIUM"]:
        return "A"
    if "GRADE_B" in g_str or "GRADE B" in g_str or g_str in ["B", "STANDARD"]:
        return "B"
    if "GRADE_C" in g_str or "GRADE C" in g_str or g_str in ["C", "COMMERCIAL"]:
        return "C"
    if quality_score >= 90:
        return "A"
    if quality_score >= 60:
        return "B"
    if quality_score >= 40:
        return "C"
    return "REJECT"

class MarketService:
    """
    Core business service providing official mandi price intelligence and quality-adjusted predictions.
    """

    def __init__(self, provider: Optional[DataGovProvider] = None, cache: Optional[MarketCache] = None):
        self.cache = cache or MarketCache()
        self.provider = provider or DataGovProvider()
        self.max_age_hours = int(os.environ.get("MARKET_CACHE_MAX_AGE_HOURS", "36"))

    def get_market_analysis(
        self,
        crop_name: str,
        quality_grade: str,
        quality_score: float,
        shelf_life_days: Optional[float] = None,
        user_state: str = "Tamil Nadu",
        user_district: str = "Coimbatore",
        user_market: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end market analysis, quality-adjusted price prediction, and market recommendation.
        Guarantees that official Government Mandi prices are NEVER overwritten with ₹0 or quarantine strings.
        """
        crop_key, display_name = CommodityMapper.normalize_official_commodity(crop_name)
        if not crop_key:
            crop_key = str(crop_name).strip().lower().replace("-", "_").replace(" ", "_")
            display_name = crop_name.title()

        grade_clean = normalize_grade(quality_grade, quality_score, shelf_life_days)

        # 1. Retrieve Official Mandi Records from Cache & Provider FIRST
        cached_records = self.cache.query_market_prices(
            commodity_key=crop_key,
            state=user_state,
            district=user_district,
            market=user_market,
            limit=25
        )

        records_to_use = cached_records
        if not records_to_use:
            records_to_use = self.cache.query_market_prices(
                commodity_key=crop_key,
                state=user_state,
                limit=25
            )

        if not records_to_use:
            unavailable_official = {
                "available": False,
                "source": "data.gov.in",
                "source_name": "Government of India Open Government Data",
                "status": "PRICE_DATA_UNAVAILABLE",
                "freshness": "PRICE_DATA_UNAVAILABLE",
                "reason": f"No official government mandi price records found for {display_name} in {user_state}."
            }
            return {
                "official_market_price": unavailable_official,
                "market_price": unavailable_official,
                "price_prediction": {
                    "status": "PRICE_DATA_UNAVAILABLE",
                    "quality_grade": grade_clean,
                    "quality_score": quality_score,
                    "available": False,
                    "recommended_price_range": None,
                    "estimated_low": 0.0,
                    "estimated_high": 0.0,
                    "confidence": 0.0,
                    "price_explanation": "Market reference data is currently unavailable for this crop and location."
                },
                "ai_price_prediction": {
                    "estimated_low": 0.0,
                    "estimated_high": 0.0,
                    "unit": "INR/kg"
                },
                "market_action": {
                    "action": "MONITOR",
                    "listing_allowed": False,
                    "reason": "Market price reference data is currently unavailable. Monitor regional mandi bulletins."
                },
                "market_recommendation": {
                    "action": "MONITOR",
                    "recommended_market": None,
                    "reason": "Market price reference data is currently unavailable. Monitor regional mandi bulletins.",
                    "confidence": 0.50
                },
                "market_comparison": [],
                "data_freshness": "PRICE_DATA_UNAVAILABLE",
                "safety_disclaimer": "This analysis provides a visual commercial quality assessment only, not a food-safety or chemical hygiene certification."
            }

        # Check data freshness vs current date
        latest_record_date_str = records_to_use[0]["arrival_date"]
        try:
            rec_date = datetime.strptime(latest_record_date_str, "%Y-%m-%d").date()
            days_old = (date.today() - rec_date).days
            freshness = "STALE" if days_old > 2 else "FRESH"
        except Exception:
            freshness = "FRESH"

        # 2. Build Official Mandi Reference Object (Independent of quality grade!)
        primary_ref = records_to_use[0]
        official_market_price = {
            "available": True,
            "source": "data.gov.in",
            "source_name": "Government of India Open Government Data",
            "arrival_date": primary_ref["arrival_date"],
            "data_date": primary_ref["arrival_date"],
            "market": primary_ref["market_name"],
            "district": primary_ref["district"],
            "state": primary_ref["state"],
            "min_price": primary_ref["min_price"],
            "modal_price": primary_ref["modal_price"],
            "max_price": primary_ref["max_price"],
            "unit": "INR/kg",
            "official_price": primary_ref.get("official_modal_price", primary_ref["modal_price"] * 100),
            "official_unit": primary_ref.get("official_unit", "INR/quintal"),
            "freshness": freshness,
            "fetched_at": datetime.now().isoformat()
        }

        # 3. Handle REJECT Grade vs Valid Grades
        if grade_clean == "REJECT":
            market_comparisons = []
            for r in records_to_use:
                m_name = r["market_name"]
                m_dist = r["district"]
                dist_km = self._estimate_distance(m_name, m_dist, user_district)
                market_comparisons.append({
                    "market": m_name,
                    "district": m_dist,
                    "state": r["state"],
                    "distance_km": dist_km,
                    "modal_price": r["modal_price"],
                    "min_price": r["min_price"],
                    "max_price": r["max_price"],
                    "unit": "INR/kg",
                    "official_price": r.get("official_modal_price", r["modal_price"] * 100),
                    "official_unit": r.get("official_unit", "INR/quintal"),
                    "predicted_low": 0.0,
                    "predicted_high": 0.0,
                    "net_realization": 0.0,
                    "arrival_date": r["arrival_date"],
                    "freshness": freshness,
                    "score": 0.0,
                    "is_recommended": False,
                    "market_action": "REJECT"
                })

            ai_prediction_obj = {
                "estimated_low": 0.0,
                "estimated_high": 0.0,
                "unit": "INR/kg"
            }
            action_obj = {
                "action": "REJECT",
                "listing_allowed": False,
                "reason": "Produce is unmarketable due to severe visible deterioration."
            }

            return {
                "official_market_price": official_market_price,
                "market_price": official_market_price,
                "price_prediction": {
                    "status": "REJECTED",
                    "quality_grade": "REJECT",
                    "quality_score": 0,
                    "recommended_price_range": {"low": 0.0, "high": 0.0, "unit": "INR/kg"},
                    "estimated_low": 0.0,
                    "estimated_high": 0.0,
                    "unit": "INR/kg",
                    "reference_price": {
                        "market": primary_ref["market_name"],
                        "modal_price": primary_ref["modal_price"],
                        "unit": "INR/kg"
                    },
                    "trend": "N/A",
                    "confidence": 1.0,
                    "price_explanation": "Produce is classified as REJECT with ₹0 commercial selling value due to severe quality deterioration."
                },
                "ai_price_prediction": ai_prediction_obj,
                "market_action": action_obj,
                "market_recommendation": {
                    "action": "REJECT",
                    "recommended_market": None,
                    "reason": "Produce is unmarketable due to severe visible deterioration.",
                    "confidence": 1.0
                },
                "market_comparison": market_comparisons,
                "data_freshness": freshness,
                "safety_disclaimer": "This analysis provides a visual commercial quality assessment only, not a food-safety or chemical hygiene certification."
            }

        # For valid Grade A, B, C produce:
        if grade_clean == "A":
            mult_low, mult_high = 0.95, 1.10
            quality_expl = "Premium Grade A quality (100% baseline, +5% to +10% premium over standard modal reference)"
        elif grade_clean == "B":
            mult_low, mult_high = 0.85, 0.95
            quality_expl = "Standard Grade B commercial quality (90% multiplier of modal reference)"
        else: # C
            mult_low, mult_high = 0.66, 0.75
            quality_expl = "Commercial discount Grade C quality (75% multiplier due to surface browning & overripening)"

        market_comparisons = []
        best_market = None
        best_score = -1.0

        for r in records_to_use:
            m_name = r["market_name"]
            m_district = r["district"]
            modal_p = r["modal_price"]

            pred_low = round(modal_p * mult_low, 2)
            pred_high = round(modal_p * mult_high, 2)
            dist_km = self._estimate_distance(m_name, m_district, user_district)

            shelf_days = shelf_life_days if shelf_life_days is not None else 5.0
            if shelf_days <= 1.5:
                transport_penalty = (dist_km / 25.0) * 15.0
                urgency_bonus = 20.0 if dist_km <= 35 else -25.0
            elif shelf_days <= 3.0:
                transport_penalty = (dist_km / 50.0) * 8.0
                urgency_bonus = 10.0 if dist_km <= 80 else -10.0
            else:
                transport_penalty = (dist_km / 120.0) * 3.0
                urgency_bonus = 0.0

            realization_score = modal_p * 2.0
            composite_score = realization_score - transport_penalty + urgency_bonus

            market_obj = {
                "market": m_name,
                "district": m_district,
                "state": r["state"],
                "distance_km": dist_km,
                "modal_price": modal_p,
                "min_price": r["min_price"],
                "max_price": r["max_price"],
                "unit": "INR/kg",
                "official_price": r.get("official_modal_price", modal_p * 100),
                "official_unit": r.get("official_unit", "INR/quintal"),
                "predicted_low": pred_low,
                "predicted_high": pred_high,
                "arrival_date": r["arrival_date"],
                "freshness": freshness,
                "score": round(composite_score, 2),
                "market_action": "SELL_NOW"
            }
            market_comparisons.append(market_obj)

            if composite_score > best_score:
                best_score = composite_score
                best_market = market_obj

        for m in market_comparisons:
            m["is_recommended"] = (best_market and m["market"] == best_market["market"])

        history = self.cache.get_price_history(crop_key, market_name=best_market["market"] if best_market else None)
        trend = self._calculate_trend(history)

        shelf_days = shelf_life_days if shelf_life_days is not None else 5.0
        if shelf_days <= 1.5:
            rec_action = "SELL_NOW"
            rec_reason = (
                f"Urgent harvest liquidation required (Remaining shelf life: {shelf_days:.0f} day). "
                f"Recommended nearby {best_market['market']} ({best_market['district']}, {best_market['distance_km']} km) "
                f"to minimize transport spoilage risk while securing ₹{best_market['predicted_low']}–₹{best_market['predicted_high']}/kg."
            )
        elif grade_clean == "A" and trend == "RISING" and shelf_days >= 4:
            rec_action = "HOLD / MONITOR"
            rec_reason = (
                f"High-quality Grade A produce with robust shelf life ({shelf_days:.0f} days) and rising mandi price trend. "
                f"Farmer may hold briefly or list on {best_market['market']} for maximum realization."
            )
        else:
            rec_action = "SELL_NOW"
            rec_reason = (
                f"Grade {grade_clean} produce well-suited for immediate listing at {best_market['market']} "
                f"({best_market['district']}) with strong modal liquidity at ₹{best_market['modal_price']}/kg "
                f"(Predicted realization: ₹{best_market['predicted_low']}–₹{best_market['predicted_high']}/kg)."
            )

        primary_ref = best_market if best_market else market_comparisons[0]

        ai_prediction_obj = {
            "estimated_low": primary_ref["predicted_low"],
            "estimated_high": primary_ref["predicted_high"],
            "unit": "INR/kg"
        }
        action_obj = {
            "action": rec_action,
            "listing_allowed": True,
            "reason": rec_reason
        }

        return {
            "official_market_price": official_market_price,
            "market_price": official_market_price,
            "price_prediction": {
                "status": "SUCCESS",
                "quality_grade": grade_clean,
                "quality_score": quality_score,
                "reference_price": {
                    "market": primary_ref["market"],
                    "modal_price": primary_ref["modal_price"],
                    "unit": "INR/kg"
                },
                "recommended_price_range": {
                    "low": primary_ref["predicted_low"],
                    "high": primary_ref["predicted_high"],
                    "unit": "INR/kg"
                },
                "estimated_low": primary_ref["predicted_low"],
                "estimated_high": primary_ref["predicted_high"],
                "unit": "INR/kg",
                "trend": trend,
                "confidence": 0.88,
                "price_explanation": quality_expl
            },
            "ai_price_prediction": ai_prediction_obj,
            "market_action": action_obj,
            "market_recommendation": {
                "action": rec_action,
                "recommended_market": primary_ref["market"],
                "district": primary_ref["district"],
                "reason": rec_reason,
                "confidence": 0.88
            },
            "market_comparison": market_comparisons,
            "data_freshness": freshness,
            "safety_disclaimer": "This analysis provides a visual commercial quality assessment only, not a food-safety or chemical hygiene certification."
        }

    def get_recommendations_v1(
        self,
        crop_name: str,
        quality_grade: str = "Grade A",
        quality_score: float = 90.0,
        shelf_life_days: Optional[float] = 5.0,
        quantity_kg: float = 1000.0,
        user_state: str = "Tamil Nadu",
        user_district: str = "Coimbatore",
        sort_mode: str = "BEST_NET_REALIZATION",
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generates full multi-market recommendation payload conforming to AgriGrade API Spec Section 18.
        """
        crop_key, display_name = CommodityMapper.normalize_official_commodity(crop_name)
        if not crop_key:
            crop_key = str(crop_name).strip().lower().replace("-", "_").replace(" ", "_")
            display_name = crop_name.title()

        grade_clean = normalize_grade(quality_grade, quality_score, shelf_life_days)
        if grade_clean == "A":
            mult_low, mult_high, mult_mid = 0.95, 1.10, 1.025
        elif grade_clean == "B":
            mult_low, mult_high, mult_mid = 0.80, 0.95, 0.875
        elif grade_clean == "C":
            mult_low, mult_high, mult_mid = 0.60, 0.80, 0.70
        else: # REJECT
            mult_low, mult_high, mult_mid = 0.0, 0.0, 0.0

        # Query cached records
        records = self.cache.query_market_prices(
            commodity_key=crop_key,
            state=user_state,
            district=user_district,
            limit=25
        )

        if not records or len(records) < 3:
            records = self.cache.query_market_prices(
                commodity_key=crop_key,
                state=user_state,
                limit=25
            )

        if not records:
            return {
                "status": "PRICE_DATA_UNAVAILABLE",
                "crop": display_name.lower(),
                "source": "data.gov.in",
                "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
                "data_freshness": "PRICE_DATA_UNAVAILABLE",
                "market_data_date": datetime.now().strftime("%Y-%m-%d"),
                "predicted_price_range": {
                    "low": 0.0,
                    "high": 0.0
                },
                "markets": [],
                "recommended_market": None,
                "reason": f"No current government mandi price data found for {display_name}."
            }

        # Freshness evaluation
        latest_date_str = records[0]["arrival_date"]
        try:
            rec_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date()
            days_old = (date.today() - rec_date).days
            freshness = "STALE" if days_old > 2 else "FRESH"
        except Exception:
            freshness = "FRESH"

        modal_prices = [r["modal_price"] for r in records if r.get("modal_price")]
        min_prices = [r["min_price"] for r in records if r.get("min_price")]
        max_prices = [r["max_price"] for r in records if r.get("max_price")]

        ref_modal = round(sum(modal_prices) / len(modal_prices), 2) if modal_prices else 0.0
        ref_min = min(min_prices) if min_prices else 0.0
        ref_max = max(max_prices) if max_prices else 0.0

        qty = float(quantity_kg) if quantity_kg and quantity_kg > 0 else 1000.0
        shelf_days = shelf_life_days if shelf_life_days is not None else 5.0

        market_list = []
        for r in records:
            m_name = r["market_name"]
            m_dist = r["district"]
            m_state = r["state"]
            m_modal = r["modal_price"]
            arr_date = r["arrival_date"]

            pred_low = round(m_modal * mult_low, 2)
            pred_high = round(m_modal * mult_high, 2)
            pred_mid = round(m_modal * mult_mid, 2)

            dist_km = float(self._estimate_distance(m_name, m_dist, user_district))

            gross_rev = round(pred_mid * qty, 2)
            est_logistics = round((dist_km * 8.0) + (qty * 0.15), 2) if grade_clean != "REJECT" else 0.0
            net_realization = round(max(0.0, gross_rev - est_logistics), 2) if grade_clean != "REJECT" else 0.0

            # Score calculation
            real_score = (net_realization / gross_rev * 50.0) if gross_rev > 0 else 0.0
            dist_score = max(0.0, 20.0 - (dist_km / 15.0))
            
            if shelf_days <= 1.5:
                shelf_score = 15.0 if dist_km <= 35.0 else 5.0
            elif shelf_days <= 3.0:
                shelf_score = 15.0 if dist_km <= 80.0 else 8.0
            else:
                shelf_score = 15.0

            price_score = min(10.0, (m_modal / 30.0) * 10.0)
            fresh_score = 5.0 if freshness == "FRESH" else 2.5

            rec_score = round(min(99.0, max(40.0, real_score + dist_score + shelf_score + price_score + fresh_score)), 1) if grade_clean != "REJECT" else 0.0

            # History trend
            hist = self.cache.get_price_history(crop_key, market_name=m_name)
            m_trend = self._calculate_trend(hist)

            market_list.append({
                "market_name": m_name,
                "district": m_dist,
                "state": m_state,
                "arrival_date": arr_date,
                "modal_price_per_kg": m_modal,
                "min_price_per_kg": r["min_price"],
                "max_price_per_kg": r["max_price"],
                "predicted_price_range": {
                    "low": pred_low,
                    "high": pred_high
                },
                "distance_km": dist_km,
                "estimated_logistics_cost": est_logistics,
                "gross_revenue": gross_rev,
                "net_realization": net_realization,
                "recommendation_score": rec_score,
                "trend": m_trend,
                "freshness": freshness,
                "source": "data.gov.in",
                "market_action": "REJECT" if grade_clean == "REJECT" else "SELL_NOW"
            })

        # Apply sorting mode
        clean_sort = str(sort_mode).upper().strip()
        if clean_sort == "NEAREST":
            market_list.sort(key=lambda x: x["distance_km"])
        elif clean_sort == "HIGHEST_PRICE":
            market_list.sort(key=lambda x: x["modal_price_per_kg"], reverse=True)
        else: # BEST_NET_REALIZATION
            market_list.sort(key=lambda x: x["net_realization"], reverse=True)

        top_market = market_list[0] if market_list and grade_clean != "REJECT" else None

        if grade_clean == "REJECT":
            return {
                "status": "REJECTED",
                "crop": display_name.lower(),
                "source": "data.gov.in",
                "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
                "data_freshness": freshness,
                "market_data_date": latest_date_str,
                "reference_price": {
                    "modal_price_per_kg": ref_modal,
                    "min_price_per_kg": ref_min,
                    "max_price_per_kg": ref_max
                },
                "predicted_price_range": {
                    "low": 0.0,
                    "high": 0.0
                },
                "markets": market_list,
                "recommended_market": None,
                "action": "REJECT",
                "reason": "Severe fungal rot or active decay. Crop is unsuitable for commercial sale."
            }

        return {
            "status": "SUCCESS",
            "crop": display_name.lower(),
            "source": "data.gov.in",
            "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
            "data_freshness": freshness,
            "market_data_date": latest_date_str,
            "reference_price": {
                "modal_price_per_kg": ref_modal,
                "min_price_per_kg": ref_min,
                "max_price_per_kg": ref_max
            },
            "markets": market_list,
            "recommended_market": {
                "market_name": top_market["market_name"] if top_market else None,
                "district": top_market["district"] if top_market else None,
                "reason": (
                    f"Highest expected net realization (₹{top_market['net_realization']:,.2f}) "
                    f"with suitable distance ({top_market['distance_km']} km) and fresh mandi data."
                ) if top_market else "No market recommendation available."
            }
        }

        # Query cached records
        records = self.cache.query_market_prices(
            commodity_key=crop_key,
            state=user_state,
            district=user_district,
            limit=25
        )

        if not records or len(records) < 3:
            records = self.cache.query_market_prices(
                commodity_key=crop_key,
                state=user_state,
                limit=25
            )

        if not records:
            return {
                "status": "PRICE_DATA_UNAVAILABLE",
                "crop": display_name.lower(),
                "source": "data.gov.in",
                "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
                "data_freshness": "PRICE_DATA_UNAVAILABLE",
                "market_data_date": datetime.now().strftime("%Y-%m-%d"),
                "predicted_price_range": {
                    "low": 0.0,
                    "high": 0.0
                },
                "markets": [],
                "recommended_market": None,
                "reason": f"No current government mandi price data found for {display_name}."
            }

        # Freshness evaluation
        latest_date_str = records[0]["arrival_date"]
        try:
            rec_date = datetime.strptime(latest_date_str, "%Y-%m-%d").date()
            days_old = (date.today() - rec_date).days
            freshness = "STALE" if days_old > 2 else "FRESH"
        except Exception:
            freshness = "FRESH"

        modal_prices = [r["modal_price"] for r in records if r.get("modal_price")]
        min_prices = [r["min_price"] for r in records if r.get("min_price")]
        max_prices = [r["max_price"] for r in records if r.get("max_price")]

        ref_modal = round(sum(modal_prices) / len(modal_prices), 2) if modal_prices else 0.0
        ref_min = min(min_prices) if min_prices else 0.0
        ref_max = max(max_prices) if max_prices else 0.0

        qty = float(quantity_kg) if quantity_kg and quantity_kg > 0 else 1000.0
        shelf_days = shelf_life_days if shelf_life_days is not None else 5.0

        market_list = []
        for r in records:
            m_name = r["market_name"]
            m_dist = r["district"]
            m_state = r["state"]
            m_modal = r["modal_price"]
            arr_date = r["arrival_date"]

            pred_low = round(m_modal * mult_low, 2)
            pred_high = round(m_modal * mult_high, 2)
            pred_mid = round(m_modal * mult_mid, 2)

            dist_km = float(self._estimate_distance(m_name, m_dist, user_district))

            gross_rev = round(pred_mid * qty, 2)
            est_logistics = round((dist_km * 8.0) + (qty * 0.15), 2)
            net_realization = round(max(0.0, gross_rev - est_logistics), 2)

            # Score calculation
            real_score = (net_realization / gross_rev * 50.0) if gross_rev > 0 else 0.0
            dist_score = max(0.0, 20.0 - (dist_km / 15.0))
            
            if shelf_days <= 1.5:
                shelf_score = 15.0 if dist_km <= 35.0 else 5.0
            elif shelf_days <= 3.0:
                shelf_score = 15.0 if dist_km <= 80.0 else 8.0
            else:
                shelf_score = 15.0

            price_score = min(10.0, (m_modal / 30.0) * 10.0)
            fresh_score = 5.0 if freshness == "FRESH" else 2.5

            rec_score = round(min(99.0, max(40.0, real_score + dist_score + shelf_score + price_score + fresh_score)), 1)

            # History trend
            hist = self.cache.get_price_history(crop_key, market_name=m_name)
            m_trend = self._calculate_trend(hist)

            market_list.append({
                "market_name": m_name,
                "district": m_dist,
                "state": m_state,
                "arrival_date": arr_date,
                "modal_price_per_kg": m_modal,
                "predicted_price_range": {
                    "low": pred_low,
                    "high": pred_high
                },
                "distance_km": dist_km,
                "estimated_logistics_cost": est_logistics,
                "gross_revenue": gross_rev,
                "net_realization": net_realization,
                "recommendation_score": rec_score,
                "trend": m_trend,
                "freshness": freshness,
                "source": "data.gov.in"
            })

        # Apply sorting mode
        clean_sort = str(sort_mode).upper().strip()
        if clean_sort == "NEAREST":
            market_list.sort(key=lambda x: x["distance_km"])
        elif clean_sort == "HIGHEST_PRICE":
            market_list.sort(key=lambda x: x["modal_price_per_kg"], reverse=True)
        else: # BEST_NET_REALIZATION
            market_list.sort(key=lambda x: x["net_realization"], reverse=True)

        top_market = market_list[0] if market_list else None

        return {
            "status": "SUCCESS",
            "crop": display_name.lower(),
            "source": "data.gov.in",
            "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
            "data_freshness": freshness,
            "market_data_date": latest_date_str,
            "reference_price": {
                "modal_price_per_kg": ref_modal,
                "min_price_per_kg": ref_min,
                "max_price_per_kg": ref_max
            },
            "markets": market_list,
            "recommended_market": {
                "market_name": top_market["market_name"] if top_market else None,
                "district": top_market["district"] if top_market else None,
                "reason": (
                    f"Highest expected net realization (₹{top_market['net_realization']:,.2f}) "
                    f"with suitable distance ({top_market['distance_km']} km) and fresh mandi data."
                ) if top_market else "No market recommendation available."
            }
        }

    def _estimate_distance(self, market_name: str, district: str, user_district: str) -> int:
        """
        Calculates realistic transit distance from the farmer's hub.
        """
        m_lower = market_name.lower()
        d_lower = district.lower()

        for key, dist in MARKET_DISTANCES.items():
            if key in m_lower or key in d_lower:
                return dist

        if d_lower == user_district.lower():
            return 25
        return 120

    def _calculate_trend(self, history: List[Dict[str, Any]]) -> str:
        """
        Evaluates recent historical price movement.
        """
        if not history or len(history) < 2:
            return "INSUFFICIENT_DATA"

        try:
            recent_modal = float(history[0]["modal_price"])
            prev_modal = float(history[1]["modal_price"])
            diff = recent_modal - prev_modal

            if diff > 0.5:
                return "RISING"
            elif diff < -0.5:
                return "FALLING"
            else:
                return "STABLE"
        except Exception:
            return "INSUFFICIENT_DATA"

    def refresh_daily_data(self) -> Dict[str, Any]:
        """
        Executes daily synchronization from data.gov.in into local database cache.
        """
        started_at = datetime.now().isoformat()
        refresh_id = f"rf-{int(datetime.now().timestamp())}"

        logger.info(f"[MARKET_REFRESH] Starting daily government mandi synchronization (Job ID: {refresh_id})")

        res = self.provider.get_market_prices(limit=500)
        completed_at = datetime.now().isoformat()

        if res.get("status") == "SUCCESS" and res.get("records"):
            upsert_stats = self.cache.upsert_market_records(res["records"], source="data.gov.in")
            self.cache.log_refresh_audit(
                refresh_id=refresh_id,
                source="data.gov.in",
                started_at=started_at,
                completed_at=completed_at,
                received=len(res["records"]),
                inserted=upsert_stats["inserted"],
                updated=upsert_stats["updated"],
                rejected=upsert_stats["rejected"],
                status="SUCCESS",
                error_msg=None
            )
            return {
                "status": "SUCCESS",
                "refresh_id": refresh_id,
                "source": "data.gov.in",
                "records_received": len(res["records"]),
                "records_inserted": upsert_stats["inserted"],
                "records_updated": upsert_stats["updated"],
                "records_rejected": upsert_stats["rejected"],
                "completed_at": completed_at
            }
        else:
            err_msg = res.get("reason") or res.get("error_message") or "No records returned from data.gov.in"
            self.cache.log_refresh_audit(
                refresh_id=refresh_id,
                source="data.gov.in",
                started_at=started_at,
                completed_at=completed_at,
                received=0,
                inserted=0,
                updated=0,
                rejected=0,
                status="PARTIAL_SUCCESS" if self.cache.get_status()["total_records"] > 0 else "FAILED",
                error_msg=err_msg
            )
            return {
                "status": "PARTIAL_SUCCESS" if self.cache.get_status()["total_records"] > 0 else "FAILED",
                "refresh_id": refresh_id,
                "source": "data.gov.in",
                "reason": err_msg,
                "cache_status": self.cache.get_status()["status"],
                "completed_at": completed_at
            }
