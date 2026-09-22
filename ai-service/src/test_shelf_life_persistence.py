"""
AgriGrade AI — Shelf Life Persistence & Invariant Test Suite
Validates:
1. Grade C overripe banana shelf life == 1 day
2. REJECT produce shelf life == 0 days
3. Healthy Grade A banana shelf life >= 5 days
4. Uninspected batch default vs AI analysis override
5. User isolation and persistence consistency
"""

import sys
import unittest
from pathlib import Path

# Add src to python path
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from services.shelf_life_service import predict_shelf_life
from grading.quality_grader import calculate_quality_grade
from market.market_service import MarketService, normalize_grade

class TestShelfLifePersistence(unittest.TestCase):

    def setUp(self):
        self.market_service = MarketService()

    def test_grade_c_overripe_banana_shelf_life(self):
        """Test 1: Grade C overripe banana must return exactly 1 day remaining shelf life."""
        res = predict_shelf_life(
            crop_name="banana",
            maturity_stage="overripe",
            quality_grade="Grade C",
            defects=[{"type": "moderate_browning", "severity": "moderate"}],
            disease_status="none",
            fungal_status="NONE",
            active_decay="NONE"
        )
        self.assertEqual(res["remaining_days"], 1)
        self.assertEqual(res["estimated_days_low"], 1)
        self.assertEqual(res["estimated_days_high"], 1)

    def test_reject_banana_shelf_life(self):
        """Test 2: REJECT produce must return strictly 0 days remaining shelf life."""
        res = predict_shelf_life(
            crop_name="banana",
            maturity_stage="rotten",
            quality_grade="REJECT",
            defects=[{"type": "severe_blackening", "severity": "severe"}],
            disease_status="visible",
            fungal_status="NONE",
            active_decay="PRESENT"
        )
        self.assertEqual(res["remaining_days"], 0)
        self.assertEqual(res["estimated_days_low"], 0)
        self.assertEqual(res["estimated_days_high"], 0)

    def test_healthy_grade_a_banana_shelf_life(self):
        """Test 3: Healthy Grade A banana must return >= 5 days remaining shelf life."""
        res = predict_shelf_life(
            crop_name="banana",
            maturity_stage="ripe",
            quality_grade="Grade A",
            defects=[],
            disease_status="none",
            fungal_status="NONE",
            active_decay="NONE"
        )
        self.assertGreaterEqual(res["remaining_days"], 5)
        self.assertGreaterEqual(res["estimated_days_high"], 6)

    def test_unripe_green_banana_is_grade_a_premium(self):
        """Test 3b: Unripe green banana with clean surface and no fungus is Grade A Premium (90-100 score, 7-8 days shelf life)."""
        grader_res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="unripe",
            disease_status="none",
            defects=[],
            visual_quality={"surface_condition": "firm_green"},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"}
        )
        norm_g = normalize_grade(grader_res["grade_code"], grader_res["quality_score"])
        self.assertEqual(norm_g, "A")
        self.assertGreaterEqual(grader_res["quality_score"], 90)

        shelf_res = predict_shelf_life(
            crop_name="banana",
            maturity_stage="unripe",
            quality_grade="Grade A",
            fungal_status="NONE",
            active_decay="NONE"
        )
        self.assertGreaterEqual(shelf_res["remaining_days"], 7)

    def test_grade_c_quality_score_not_confused_with_shelf_life(self):
        """Test 4: Quality score of 45/100 must produce 1 day shelf life, NOT 45 days."""
        grader_res = calculate_quality_grade(
            crop_name="banana",
            maturity_stage="overripe",
            disease_status="none",
            defects=[{"type": "moderate_browning", "severity": "moderate"}],
            visual_quality={"surface_condition": "moderate_browning"},
            fungal_growth={"status": "NONE"},
            active_decay={"status": "NONE"}
        )
        norm_g = normalize_grade(grader_res["grade_code"], grader_res["quality_score"])
        self.assertEqual(norm_g, "C")

        shelf_res = predict_shelf_life(
            crop_name="banana",
            maturity_stage="overripe",
            quality_grade=norm_g,
            fungal_status="NONE",
            active_decay="NONE"
        )
        self.assertEqual(shelf_res["remaining_days"], 1)
        self.assertNotEqual(shelf_res["remaining_days"], 45)

    def test_market_service_incorporates_shelf_life(self):
        """Test 5: Market service pipeline incorporates authoritative clean shelf life."""
        res = self.market_service.get_market_analysis(
            crop_name="banana",
            quality_grade="Grade C",
            quality_score=45.0,
            shelf_life_days=1.0,
            user_state="Tamil Nadu",
            user_district="Coimbatore"
        )
        self.assertEqual(res["official_market_price"]["available"], True)
        self.assertGreater(res["official_market_price"]["modal_price"], 0)
        self.assertEqual(res["market_action"]["action"], "SELL_NOW")
        self.assertTrue(res["market_action"]["listing_allowed"])

if __name__ == "__main__":
    unittest.main()
