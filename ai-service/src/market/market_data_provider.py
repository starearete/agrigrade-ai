"""
Abstract Market Data Provider Interface for AgriGrade AI.
Provides a standard extensible interface for fetching official agricultural mandi market prices.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class MarketDataProvider(ABC):
    """
    Abstract Base Class for Agricultural Market Data Providers.
    Allows swappable providers (data.gov.in, AGMARKNET direct, e-NAM, State APMC portals)
    without altering grading or downstream pipeline logic.
    """

    @abstractmethod
    def get_market_prices(
        self,
        commodity: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        market: Optional[str] = None,
        date: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Fetch market prices matching specified criteria.
        
        Returns:
            Dict containing:
                - status: str ("SUCCESS", "PRICE_DATA_UNAVAILABLE", "ERROR")
                - source: str (provider identifier)
                - records: List[Dict] (standardized mandi records)
                - total_records: int
                - fetched_at: str (ISO timestamp)
                - error_message: Optional[str]
        """
        pass

    @abstractmethod
    def fetch_all_daily_records(
        self,
        date: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Fetch all available daily mandi records for batch daily cache refresh.
        """
        pass
