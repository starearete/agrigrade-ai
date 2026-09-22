"""
Market Price Validation & Unit Normalization Engine for AgriGrade AI.
Ensures only clean, verified, and mathematically sound market data enters the caching and pricing pipeline.
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("AgriGradeMarketValidator")

class MarketPriceValidator:
    """
    Validates official agricultural market records against physical & economic sanity rules.
    """

    @staticmethod
    def validate_and_normalize_record(raw_record: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Validates an incoming market record and standardizes price units to INR/kg.
        
        Rules enforced:
        1. Required fields: commodity, market, state, arrival_date
        2. Prices must be non-negative numeric floats
        3. min_price <= modal_price <= max_price (if min & max are provided)
        4. Valid date string
        5. Unit conversion (1 Quintal = 100 kg)
        
        Returns:
            (is_valid: bool, normalized_record: Optional[Dict], rejection_reason: Optional[str])
        """
        if not isinstance(raw_record, dict):
            return False, None, "Record is not a valid JSON dictionary"

        # Extract core fields supporting both data.gov.in and AGMARKNET keys
        state = raw_record.get("state") or raw_record.get("State")
        district = raw_record.get("district") or raw_record.get("District") or state
        market = raw_record.get("market") or raw_record.get("Market") or raw_record.get("market_name")
        commodity = raw_record.get("commodity") or raw_record.get("Commodity")
        variety = raw_record.get("variety") or raw_record.get("Variety") or "Common / Local"
        grade = raw_record.get("grade") or raw_record.get("Grade") or "FAQ"
        arrival_date = raw_record.get("arrival_date") or raw_record.get("Arrival_Date") or raw_record.get("market_date")

        if not commodity or not str(commodity).strip():
            return False, None, "Missing or blank commodity field"
        if not market or not str(market).strip():
            return False, None, "Missing or blank market field"
        if not state or not str(state).strip():
            return False, None, "Missing or blank state field"
        if not arrival_date or not str(arrival_date).strip():
            return False, None, "Missing or blank arrival_date field"

        # Standardize arrival date format (DD/MM/YYYY or YYYY-MM-DD -> YYYY-MM-DD)
        date_str = str(arrival_date).strip()
        clean_date = MarketPriceValidator._standardize_date(date_str)
        if not clean_date:
            return False, None, f"Invalid arrival_date format: {date_str}"

        # Extract prices
        raw_min = raw_record.get("min_price") or raw_record.get("Min_Price") or raw_record.get("min_price_per_kg")
        raw_max = raw_record.get("max_price") or raw_record.get("Max_Price") or raw_record.get("max_price_per_kg")
        raw_modal = raw_record.get("modal_price") or raw_record.get("Modal_Price") or raw_record.get("modal_price_per_kg")

        try:
            modal_price = float(raw_modal) if raw_modal is not None else None
        except (ValueError, TypeError):
            return False, None, f"Non-numeric modal_price: {raw_modal}"

        if modal_price is None or modal_price < 0:
            return False, None, f"Modal price is missing or negative: {modal_price}"

        try:
            min_price = float(raw_min) if raw_min is not None else modal_price
            max_price = float(raw_max) if raw_max is not None else modal_price
        except (ValueError, TypeError):
            min_price = modal_price
            max_price = modal_price

        # Sanity Bounds Check
        if min_price < 0 or max_price < 0:
            return False, None, f"Negative price values: min={min_price}, max={max_price}, modal={modal_price}"

        # Fix minor inversion or enforce bounds
        if min_price > max_price:
            return False, None, f"min_price ({min_price}) cannot exceed max_price ({max_price})"

        if modal_price < min_price or modal_price > max_price:
            # Tolerant bounds adjustment if within 2% margin or invalid
            if modal_price < min_price * 0.98 or modal_price > max_price * 1.02:
                return False, None, f"modal_price ({modal_price}) outside [min_price ({min_price}), max_price ({max_price})]"
            min_price = min(min_price, modal_price)
            max_price = max(max_price, modal_price)

        # Unit Detection and Conversion to INR/kg
        raw_unit = str(raw_record.get("unit") or raw_record.get("Unit") or "INR/quintal").strip()
        is_quintal = any(q in raw_unit.lower() for q in ["quintal", "qtl", "rs./quintal", "inr/quintal", "100 kg"])
        is_ton = any(t in raw_unit.lower() for t in ["ton", "tonne", "mt"])
        
        # In Government OGD mandi feeds, prices > 300 for common vegetables (Tomato, Banana, etc.) are in Rs./Quintal
        if is_quintal or (modal_price > 300.0 and not is_ton):
            conversion_factor = 100.0
            official_unit = "INR/quintal"
        elif is_ton:
            conversion_factor = 1000.0
            official_unit = "INR/tonne"
        else:
            conversion_factor = 1.0
            official_unit = "INR/kg"

        norm_min_kg = round(min_price / conversion_factor, 2)
        norm_max_kg = round(max_price / conversion_factor, 2)
        norm_modal_kg = round(modal_price / conversion_factor, 2)

        # Check realistic per-kg price limits (e.g. ₹0.50 to ₹800.00 / kg)
        if norm_modal_kg < 0.20 or norm_modal_kg > 1500.0:
            return False, None, f"Unrealistic normalized price per kg: ₹{norm_modal_kg}/kg"

        normalized = {
            "commodity": str(commodity).strip(),
            "state": str(state).strip(),
            "district": str(district).strip(),
            "market_name": str(market).strip(),
            "variety": str(variety).strip(),
            "grade": str(grade).strip(),
            "arrival_date": clean_date,
            "min_price": norm_min_kg,
            "max_price": norm_max_kg,
            "modal_price": norm_modal_kg,
            "unit": "INR/kg",
            "official_min_price": min_price,
            "official_max_price": max_price,
            "official_modal_price": modal_price,
            "official_unit": official_unit,
            "source": raw_record.get("source", "data.gov.in")
        }

        return True, normalized, None

    @staticmethod
    def _standardize_date(date_str: str) -> Optional[str]:
        """
        Converts dates like '14/08/2026', '14-08-2026', '2026-08-14' to ISO 'YYYY-MM-DD'.
        """
        if not date_str:
            return None
        date_str = date_str.strip()
        
        # Match YYYY-MM-DD
        if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
            return date_str
            
        # Match DD/MM/YYYY or DD-MM-YYYY
        m = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$", date_str)
        if m:
            day, month, year = m.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"
            
        return None
