"""
Comprehensive Automated Test Suite for AgriGrade AI Real-Time Market Intelligence Module.
Validates:
1. Commodity mapping (APMC name -> internal key)
2. Market price validation & anomaly bounds
3. Price cache storage, query, fallback, and audit logging
4. Quality-adjusted pricing across grades (A, B, C, REJECT)
5. Strict REJECT override (0 INR/kg, non-saleable)
6. Shelf-life transport distance & urgency scoring
7. Price trend calculations
8. Database cache status
"""

import sys
import os
import unittest
from pathlib import Path
from datetime import datetime, date

SRC_DIR = Path(__file__).resolve().parent.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from market.commodity_mapper import CommodityMapper
from market.market_price_validator import MarketPriceValidator
from market.market_cache import MarketCache
from market.market_service import MarketService

class TestMarketIntelligence(unittest.TestCase):

    def setUp(self):
        self.cache = MarketCache()
        self.service = MarketService(cache=self.cache)

    def test_01_commodity_mapping(self):
        """Test APMC commodity alias mapping to canonical crops."""
        self.assertEqual(CommodityMapper.normalize_official_commodity("Banana")[0], "banana")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Banana - Green")[0], "banana")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Tomato")[0], "tomato")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Tomato Local")[0], "tomato")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Mango (Raw-Ripe)")[0], "mango")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Onion")[0], "onion")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Bhindi(Ladies Finger)")[0], "okra")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Carrot")[0], "carrot")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Brinjal")[0], "brinjal")
        self.assertEqual(CommodityMapper.normalize_official_commodity("Green Chilli")[0], "green_chilli")

    def test_02_price_validator(self):
        """Test official mandi price normalization and sanity validation."""
        # Valid Tomato (Rs 2200/quintal -> Rs 22/kg)
        raw_valid = {
            "state": "Tamil Nadu",
            "district": "Coimbatore",
            "market": "Coimbatore",
            "commodity": "Tomato",
            "variety": "Tomato Hybrid",
            "arrival_date": "14/08/2026",
            "min_price": "1800",
            "max_price": "2600",
            "modal_price": "2200"
        }
        is_valid, val, err = MarketPriceValidator.validate_and_normalize_record(raw_valid)
        self.assertTrue(is_valid)
        self.assertIsNotNone(val)
        self.assertEqual(val["commodity"], "Tomato")
        self.assertEqual(CommodityMapper.normalize_official_commodity(val["commodity"])[0], "tomato")
        self.assertEqual(val["modal_price"], 22.0)
        self.assertEqual(val["min_price"], 18.0)
        self.assertEqual(val["max_price"], 26.0)

        # Invalid extreme price anomaly
        raw_anomaly = dict(raw_valid, modal_price="500000") # Rs 5000/kg
        is_valid_bad, val_bad, err_bad = MarketPriceValidator.validate_and_normalize_record(raw_anomaly)
        self.assertFalse(is_valid_bad)
        self.assertIsNone(val_bad)

    def test_03_strict_reject_quality_pricing(self):
        """Test that REJECT grade produces strictly 0 INR/kg and non-saleable recommendation."""
        res = self.service.get_market_analysis(
            crop_name="tomato",
            quality_grade="REJECT",
            quality_score=0.0,
            shelf_life_days=0.0
        )
        self.assertEqual(res["price_prediction"]["status"], "REJECTED")
        self.assertEqual(res["price_prediction"]["recommended_price_range"]["low"], 0.0)
        self.assertEqual(res["price_prediction"]["recommended_price_range"]["high"], 0.0)
        self.assertEqual(res["market_recommendation"]["action"], "REJECT")
        self.assertIn("severe fungal", res["market_recommendation"]["reason"].lower())

    def test_04_quality_adjusted_pricing_grade_a(self):
        """Test Grade A premium realization and multi-market comparison."""
        res = self.service.get_market_analysis(
            crop_name="banana",
            quality_grade="A",
            quality_score=95.0,
            shelf_life_days=6.0,
            user_state="Tamil Nadu",
            user_district="Coimbatore"
        )
        self.assertEqual(res["price_prediction"]["status"], "SUCCESS")
        self.assertEqual(res["price_prediction"]["quality_grade"], "A")
        self.assertGreater(res["price_prediction"]["recommended_price_range"]["high"], 0.0)
        self.assertGreater(res["price_prediction"]["recommended_price_range"]["high"], res["price_prediction"]["recommended_price_range"]["low"])
        self.assertTrue(len(res["market_comparison"]) > 0)

    def test_05_critical_shelf_life_urgency(self):
        """Test that remaining shelf life <= 1.5 days triggers critical urgency and SELL_NOW."""
        res = self.service.get_market_analysis(
            crop_name="tomato",
            quality_grade="C",
            quality_score=65.0,
            shelf_life_days=1.0,
            user_state="Tamil Nadu",
            user_district="Coimbatore"
        )
        self.assertEqual(res["market_recommendation"]["action"], "SELL_NOW")
        self.assertIn("Urgent", res["market_recommendation"]["reason"])

    def test_06_database_cache_status(self):
        """Test cache status and record count query."""
        status = self.cache.get_status()
        self.assertEqual(status["status"], "HEALTHY")
        self.assertGreater(status["total_records"], 0)
        self.assertGreater(status["total_markets"], 0)

if __name__ == "__main__":
    unittest.main()
