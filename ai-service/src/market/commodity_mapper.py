"""
Centralized Crop and Commodity Mapper for AgriGrade AI.
Maps internal crop keys, scientific terms, vernacular Indian names, and regional aliases
to official Government of India (AGMARKNET / data.gov.in) commodity standards.
"""

from typing import Dict, List, Optional, Tuple

COMMODITY_DEFINITIONS = {
    "banana": {
        "official_commodity": "Banana",
        "display_name": "Banana",
        "aliases": ["Banana", "Banana - Ripe", "Banana - Green", "Kela", "Vazhaipazham", "Robusta", "Poovan", "Nendran", "Rasthali", "Grand Naine"],
        "default_variety": "Robusta / Poovan"
    },
    "tomato": {
        "official_commodity": "Tomato",
        "display_name": "Tomato",
        "aliases": ["Tomato", "Tomato Local", "Tomato Hybrid", "Tamatar", "Thakkali", "Nattu Thakkali", "Hybrid Tomato"],
        "default_variety": "Hybrid / Local"
    },
    "mango": {
        "official_commodity": "Mango",
        "display_name": "Mango",
        "aliases": ["Mango", "Mango (Raw-Ripe)", "Aam", "Mambazham", "Alphonso", "Banganapalli", "Totapuri", "Neelam", "Malgova", "Imam Pasand"],
        "default_variety": "Banganapalli / Totapuri"
    },
    "onion": {
        "official_commodity": "Onion",
        "display_name": "Onion",
        "aliases": ["Onion", "Onion Small", "Onion Big", "Pyaz", "Vengayam", "Chinna Vengayam", "Bellary Onion", "Shallot"],
        "default_variety": "Red / Bellary"
    },
    "okra": {
        "official_commodity": "Bhindi(Ladies Finger)",
        "display_name": "Okra (Bhindi)",
        "aliases": ["Bhindi(Ladies Finger)", "Bhindi", "Okra", "Ladies Finger", "Lady Finger", "Vendakkai", "Bhendi"],
        "default_variety": "Local / Hybrid"
    },
    "carrot": {
        "official_commodity": "Carrot",
        "display_name": "Carrot",
        "aliases": ["Carrot", "Gajar", "Ooty Carrot", "Orange Carrot", "Red Carrot"],
        "default_variety": "Ooty / Local"
    },
    "brinjal": {
        "official_commodity": "Brinjal",
        "display_name": "Brinjal (Eggplant)",
        "aliases": ["Brinjal", "Eggplant", "Aubergine", "Baingan", "Kathirikai", "Barni Brinjal", "Round Brinjal"],
        "default_variety": "Local / Hybrid"
    },
    "green_chilli": {
        "official_commodity": "Green Chilli",
        "display_name": "Green Chilli",
        "aliases": ["Green Chilli", "Chilli Green", "Chilli", "Mirchi", "Hari Mirch", "Pachai Milagai"],
        "default_variety": "Guntur / Local"
    },
    "drumstick": {
        "official_commodity": "Drumstick",
        "display_name": "Drumstick (Moringa)",
        "aliases": ["Drumstick", "Moringa", "Murungaikai", "Sahjan", "Saijan"],
        "default_variety": "Local"
    },
    "beetroot": {
        "official_commodity": "Beetroot",
        "display_name": "Beetroot",
        "aliases": ["Beetroot", "Beet", "Chukandar"],
        "default_variety": "Local"
    },
    "bottle_gourd": {
        "official_commodity": "Bottle Gourd",
        "display_name": "Bottle Gourd",
        "aliases": ["Bottle Gourd", "Lauki", "Surakkai", "Ghiya", "Doodhi"],
        "default_variety": "Local"
    },
    "bitter_gourd": {
        "official_commodity": "Bitter Gourd",
        "display_name": "Bitter Gourd",
        "aliases": ["Bitter Gourd", "Karela", "Pavakkai", "Karavila"],
        "default_variety": "Local"
    },
    "snake_gourd": {
        "official_commodity": "Snake Gourd",
        "display_name": "Snake Gourd",
        "aliases": ["Snake Gourd", "Chichinda", "Pudalangai"],
        "default_variety": "Local"
    },
    "tapioca": {
        "official_commodity": "Tapioca",
        "display_name": "Tapioca (Cassava)",
        "aliases": ["Tapioca", "Cassava", "Maravalli Kizhangu", "Kappa", "Simla"],
        "default_variety": "Local / Industrial"
    }
}

class CommodityMapper:
    """
    Standardizes commodity names between internal crop identifiers and external official market records.
    """

    @staticmethod
    def get_official_commodity(crop_name: str) -> Optional[str]:
        """
        Returns the official primary commodity string used by data.gov.in / AGMARKNET.
        """
        if not crop_name:
            return None
        k = crop_name.strip().lower().replace("-", "_").replace(" ", "_")
        if k in COMMODITY_DEFINITIONS:
            return COMMODITY_DEFINITIONS[k]["official_commodity"]
        
        # Search aliases
        for def_k, def_val in COMMODITY_DEFINITIONS.items():
            for alias in def_val["aliases"]:
                if alias.lower() == crop_name.strip().lower():
                    return def_val["official_commodity"]
        return None

    @staticmethod
    def get_all_aliases(crop_name: str) -> List[str]:
        """
        Returns all matching commodity aliases for a given crop name.
        """
        if not crop_name:
            return []
        k = crop_name.strip().lower().replace("-", "_").replace(" ", "_")
        if k in COMMODITY_DEFINITIONS:
            return COMMODITY_DEFINITIONS[k]["aliases"]
        
        for def_k, def_val in COMMODITY_DEFINITIONS.items():
            for alias in def_val["aliases"]:
                if alias.lower() == crop_name.strip().lower():
                    return def_val["aliases"]
        return [crop_name.title()]

    @staticmethod
    def normalize_official_commodity(api_commodity_str: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Maps an incoming official commodity string (from data.gov.in or AGMARKNET) back to:
        (canonical_crop_key, display_name)
        Example: "Bhindi(Ladies Finger)" -> ("okra", "Okra (Bhindi)")
        """
        if not api_commodity_str:
            return None, None
        
        raw_lower = api_commodity_str.strip().lower()

        for crop_key, meta in COMMODITY_DEFINITIONS.items():
            if meta["official_commodity"].lower() == raw_lower:
                return crop_key, meta["display_name"]
            for alias in meta["aliases"]:
                if alias.lower() in raw_lower or raw_lower in alias.lower():
                    return crop_key, meta["display_name"]

        return None, None
