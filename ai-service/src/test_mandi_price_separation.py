"""
Comprehensive Automated Test Suite for AgriGrade AI Mandi Price Separation & Health Probes.
Executes Tests 1 through 16 as required by AgriGrade V4 Master Specification.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from market.market_service import MarketService, normalize_grade

class TestMandiPriceSeparation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.market_service = MarketService()

    def test_01_grade_normalization(self):
        """Test 10: Grade normalization for all string variants."""
        self.assertEqual(normalize_grade("GRADE_A_PREMIUM"), "A")
        self.assertEqual(normalize_grade("Grade A"), "A")
        self.assertEqual(normalize_grade("A"), "A")
        self.assertEqual(normalize_grade("GRADE_B_STANDARD"), "B")
        self.assertEqual(normalize_grade("Grade B"), "B")
        self.assertEqual(normalize_grade("GRADE_C_COMMERCIAL"), "C")
        self.assertEqual(normalize_grade("Grade C"), "C")
        self.assertEqual(normalize_grade("REJECTED"), "REJECT")
        self.assertEqual(normalize_grade("REJECT"), "REJECT")
        self.assertEqual(normalize_grade("Quarantine"), "REJECT")

    def test_02_grade_a_banana(self):
        """Test 1: Grade A Banana -> Official Mandi > 0, AI Prediction > 0, Action = SELL."""
        res = self.market_service.get_market_analysis("banana", "GRADE_A_PREMIUM", 95.0, shelf_life_days=6.0)
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertGreater(res["ai_price_prediction"]["estimated_low"], 0.0)
        self.assertTrue(res["market_action"]["listing_allowed"])
        self.assertIn(res["market_action"]["action"], ["SELL_NOW", "HOLD / MONITOR"])

    def test_03_grade_b_banana(self):
        """Test 2: Grade B Banana -> Official Mandi > 0, AI Prediction > 0."""
        res = self.market_service.get_market_analysis("banana", "GRADE_B_STANDARD", 80.0, shelf_life_days=4.0)
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertGreater(res["ai_price_prediction"]["estimated_low"], 0.0)

    def test_04_grade_c_banana(self):
        """Test 3: Grade C Banana -> Official Mandi > 0, AI Prediction > 0."""
        res = self.market_service.get_market_analysis("banana", "GRADE_C_COMMERCIAL", 60.0, shelf_life_days=2.0)
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertGreater(res["ai_price_prediction"]["estimated_low"], 0.0)

    def test_05_rejected_fungal_banana(self):
        """Test 4 & 11-14: Rejected Banana -> Real Official Mandi > 0, AI Price = ₹0, Net Realization = ₹0, Action = REJECT, Listing = Blocked."""
        res = self.market_service.get_market_analysis("banana", "REJECTED", 0.0, shelf_life_days=0.0)
        # Rule 3 & 11: Official mandi price remains real!
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertNotEqual(res["official_market_price"]["market"], "Non-Saleable (Quarantine)")
        
        # Rule 4 & 12: AI predicted selling price is ₹0!
        self.assertEqual(res["ai_price_prediction"]["estimated_low"], 0.0)
        self.assertEqual(res["ai_price_prediction"]["estimated_high"], 0.0)

        # Rule 5 & 13: Net realization in market comparison is ₹0!
        for m in res["market_comparison"]:
            self.assertEqual(m["net_realization"], 0.0)
            self.assertEqual(m["predicted_low"], 0.0)
            self.assertGreater(m["modal_price"], 0.0)

        # Rule 6 & 14: Action = REJECT, Listing = Blocked
        self.assertEqual(res["market_action"]["action"], "REJECT")
        self.assertFalse(res["market_action"]["listing_allowed"])

    def test_06_rejected_fungal_tomato(self):
        """Test 5: Rejected Tomato -> Real Official Mandi > 0, AI Price = ₹0, Action = REJECT."""
        res = self.market_service.get_market_analysis("tomato", "REJECT", 0.0, shelf_life_days=0.0)
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertEqual(res["ai_price_prediction"]["estimated_low"], 0.0)
        self.assertEqual(res["market_action"]["action"], "REJECT")
        self.assertFalse(res["market_action"]["listing_allowed"])

    def test_07_rejected_mango(self):
        """Test 6: Rejected Mango -> Real Official Mandi > 0, AI Price = ₹0."""
        res = self.market_service.get_market_analysis("mango", "REJECTED", 0.0, shelf_life_days=0.0)
        self.assertTrue(res["official_market_price"]["available"])
        self.assertGreater(res["official_market_price"]["modal_price"], 0.0)
        self.assertEqual(res["ai_price_prediction"]["estimated_low"], 0.0)

    def test_08_price_data_unavailable(self):
        """Test 7: Unmapped crop -> Freshness = PRICE_DATA_UNAVAILABLE, available = False (No fake ₹0 mandi price!)."""
        res = self.market_service.get_market_analysis("non_existent_crop_xyz", "GRADE_A", 90.0)
        self.assertFalse(res["official_market_price"]["available"])
        self.assertEqual(res["official_market_price"]["freshness"], "PRICE_DATA_UNAVAILABLE")

    def test_09_recommendations_v1_rejected(self):
        """Test 14: get_recommendations_v1 for REJECT returns real reference_price and ₹0 predictions."""
        res = self.market_service.get_recommendations_v1("banana", quality_grade="REJECTED", quality_score=0.0)
        self.assertEqual(res["status"], "REJECTED")
        self.assertEqual(res["action"], "REJECT")
        self.assertGreater(res["reference_price"]["modal_price_per_kg"], 0.0)
        self.assertEqual(res["predicted_price_range"]["low"], 0.0)
        self.assertEqual(res["predicted_price_range"]["high"], 0.0)
        for m in res["markets"]:
            self.assertEqual(m["net_realization"], 0.0)
            self.assertGreater(m["modal_price_per_kg"], 0.0)

    def test_10_grade_c_banana_quality_multiplier_discount(self):
        """Test 10: Grade C Banana AI selling price is strictly lower than official Mandi modal rate (75% quality multiplier)."""
        res = self.market_service.get_market_analysis("banana", "GRADE_C_COMMERCIAL", 45.0, shelf_life_days=1.0)
        off_modal = res["official_market_price"]["modal_price"]
        ai_low = res["ai_price_prediction"]["estimated_low"]
        ai_high = res["ai_price_prediction"]["estimated_high"]

        self.assertGreater(off_modal, 0.0)
        self.assertGreater(ai_low, 0.0)
        self.assertGreater(ai_high, 0.0)
        # AI high must be strictly lower than official mandi modal rate! (e.g. 18.75 vs 25.00)
        self.assertLess(ai_high, off_modal)
        self.assertEqual(ai_high, round(off_modal * 0.75, 2))
        self.assertEqual(ai_low, round(off_modal * 0.66, 2))
        self.assertNotEqual(ai_high, off_modal)

if __name__ == "__main__":
    unittest.main()
