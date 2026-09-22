"""
Regression Test Suite for AgriGrade AI — Banana Severe Deterioration REJECT Grade & Mandi Price Separation
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from grading.quality_grader import calculate_quality_grade
from market.market_service import MarketService, normalize_grade

class TestBananaSeverityRegression(unittest.TestCase):

    def setUp(self):
        self.market_service = MarketService()

    def test_1_severely_browned_rotten_banana_returns_reject(self):
        """Test 1: Severely browned/rotten banana without fungal rot MUST return REJECT (score = 0)."""
        res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="rotten",
            visual_quality={"surface_condition": "severely_deteriorated", "severe_visual_deterioration": True},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"},
            defects=[{"type": "severe_blackening", "severity": "severe"}]
        )
        self.assertEqual(res["grade_code"], "REJECT")
        self.assertEqual(res["quality_score"], 0)

    def test_2_rotten_banana_without_fungal_growth_reject(self):
        """Test 2: Rotten banana without fungal growth returns REJECT without false fungal claims."""
        res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="rotten",
            visual_quality={"surface_condition": "severely_deteriorated", "severe_visual_deterioration": True},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"}
        )
        self.assertEqual(res["grade_code"], "REJECT")
        self.assertEqual(res["quality_score"], 0)

    def test_3_moderate_deterioration_returns_grade_c(self):
        """Test 3: Moderate overripeneing/browning returns Grade C with valid score."""
        res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="overripe",
            visual_quality={"surface_condition": "moderate_browning"},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"}
        )
        self.assertEqual(res["grade_code"], "C")
        self.assertGreaterEqual(res["quality_score"], 40)

    def test_4_healthy_ripe_banana_returns_grade_a(self):
        """Test 4: Healthy ripe banana returns Grade A."""
        res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="ripe",
            visual_quality={"surface_condition": "clean"},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"}
        )
        self.assertEqual(res["grade_code"], "A")
        self.assertGreaterEqual(res["quality_score"], 90)

    def test_5_severe_fungal_banana_returns_reject(self):
        """Test 5: Severe fungal mold returns REJECT."""
        res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="rotten",
            visual_quality={"surface_condition": "severely_deteriorated"},
            fungal_growth={"status": "SEVERE"},
            active_decay={"status": "PRESENT"}
        )
        self.assertEqual(res["grade_code"], "REJECT")
        self.assertEqual(res["quality_score"], 0)

    def test_6_reject_preserves_official_mandi_price(self):
        """Test 6: REJECT grade preserves official Mandi price while setting AI price to 0."""
        m_analysis = self.market_service.get_market_analysis(
            crop_name="banana",
            quality_grade="REJECT",
            quality_score=0,
            shelf_life_days=0,
            user_state="Tamil Nadu",
            user_district="Coimbatore"
        )
        off_price = m_analysis["official_market_price"]
        ai_price = m_analysis["ai_price_prediction"]
        mkt_act = m_analysis["market_action"]

        self.assertTrue(off_price["available"])
        self.assertGreater(off_price["modal_price"], 0)
        self.assertEqual(ai_price["estimated_low"], 0.0)
        self.assertEqual(ai_price["estimated_high"], 0.0)
        self.assertEqual(mkt_act["action"], "REJECT")
        self.assertFalse(mkt_act["listing_allowed"])

    def test_7_missing_mandi_data_freshness_price_data_unavailable(self):
        """Test 7: Missing Mandi data sets freshness = PRICE_DATA_UNAVAILABLE instead of fake 0."""
        m_analysis = self.market_service.get_market_analysis(
            crop_name="non_existent_crop_xyz",
            quality_grade="A",
            quality_score=95,
            shelf_life_days=5
        )
        off_price = m_analysis["official_market_price"]
        self.assertFalse(off_price["available"])
        self.assertEqual(off_price["freshness"], "PRICE_DATA_UNAVAILABLE")

    def test_8_grade_c_price_discount(self):
        """Test 8: Grade C price is discounted (approx 75% of modal rate)."""
        m_analysis = self.market_service.get_market_analysis(
            crop_name="banana",
            quality_grade="C",
            quality_score=50,
            shelf_life_days=2,
            user_state="Tamil Nadu",
            user_district="Coimbatore"
        )
        modal_rate = m_analysis["official_market_price"]["modal_price"]
        ai_high = m_analysis["ai_price_prediction"]["estimated_high"]
        self.assertLess(ai_high, modal_rate)
        self.assertGreater(ai_high, 0)

if __name__ == "__main__":
    unittest.main()
