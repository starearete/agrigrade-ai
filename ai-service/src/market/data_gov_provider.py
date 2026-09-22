"""
Official Government of India Open Government Data (data.gov.in) Market Data Provider.
Dataset: "Current Daily Price of Various Commodities from Various Markets (Mandi)"
Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
"""

import os
import ssl
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    from .market_data_provider import MarketDataProvider
    from .market_price_validator import MarketPriceValidator
except ImportError:
    from market.market_data_provider import MarketDataProvider
    from market.market_price_validator import MarketPriceValidator

logger = logging.getLogger("AgriGradeDataGovProvider")

DEFAULT_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_API_URL = "https://api.data.gov.in/resource"

class DataGovProvider(MarketDataProvider):
    """
    Client for fetching verified daily agricultural mandi records from data.gov.in API.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        resource_id: Optional[str] = None,
        timeout: int = 15,
        max_retries: int = 3
    ):
        self.api_key = api_key or os.environ.get("DATA_GOV_API_KEY") or os.environ.get("MARKET_DATA_API_KEY")
        self.resource_id = resource_id or os.environ.get("DATA_GOV_RESOURCE_ID") or DEFAULT_RESOURCE_ID
        self.timeout = int(os.environ.get("MARKET_REQUEST_TIMEOUT_SECONDS", str(timeout)))
        self.max_retries = int(os.environ.get("MARKET_REQUEST_RETRIES", str(max_retries)))

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
        Executes a targeted query against the official data.gov.in mandi dataset.
        """
        if not self.api_key:
            logger.info("[DATA_GOV] No DATA_GOV_API_KEY configured. Live query will defer to local authenticated cache.")
            return {
                "status": "PRICE_DATA_UNAVAILABLE",
                "source": "data.gov.in",
                "available": False,
                "reason": "DATA_GOV_API_KEY is not configured in environment.",
                "records": [],
                "total_records": 0,
                "fetched_at": datetime.now().isoformat()
            }

        params = {
            "api-key": self.api_key,
            "format": "json",
            "offset": 0,
            "limit": limit
        }

        if state:
            params["filters[state]"] = state
        if district:
            params["filters[district]"] = district
        if market:
            params["filters[market]"] = market
        if commodity:
            params["filters[commodity]"] = commodity
        if date:
            params["filters[arrival_date]"] = date

        query_string = urllib.parse.urlencode(params)
        endpoint = f"{BASE_API_URL}/{self.resource_id}?{query_string}"

        return self._execute_request_with_retry(endpoint)

    def fetch_all_daily_records(
        self,
        date: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Fetches all available mandi records for batch daily cache refresh.
        """
        res = self.get_market_prices(date=date, limit=limit)
        return res.get("records", [])

    def _execute_request_with_retry(self, url: str) -> Dict[str, Any]:
        """
        Executes HTTP GET with exponential backoff, SSL handling, and JSON parsing.
        """
        headers = {
            "User-Agent": "AgriGrade-AI-Platform/2.0 (Agricultural Mandi Price Sync)",
            "Accept": "application/json"
        }

        ctx = ssl.create_default_context()
        # Ensure resilience across diverse network gateways
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(url, headers=headers, method="GET")

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                start_t = time.time()
                with urllib.request.urlopen(req, context=ctx, timeout=self.timeout) as response:
                    elapsed = time.time() - start_t
                    if response.status == 200:
                        raw_bytes = response.read()
                        data = json.loads(raw_bytes.decode("utf-8"))
                        
                        raw_records = data.get("records", [])
                        valid_records = []
                        rejected_count = 0

                        for r in raw_records:
                            r["source"] = "data.gov.in"
                            is_valid, norm_rec, reason = MarketPriceValidator.validate_and_normalize_record(r)
                            if is_valid and norm_rec:
                                valid_records.append(norm_rec)
                            else:
                                rejected_count += 1

                        logger.info(
                            f"[DATA_GOV] Fetched {len(raw_records)} raw records in {elapsed:.2f}s "
                            f"(Accepted: {len(valid_records)}, Rejected: {rejected_count})"
                        )

                        return {
                            "status": "SUCCESS",
                            "source": "data.gov.in",
                            "source_name": "Government of India Open Government Data",
                            "available": len(valid_records) > 0,
                            "records": valid_records,
                            "total_records": len(valid_records),
                            "raw_count": len(raw_records),
                            "rejected_count": rejected_count,
                            "fetched_at": datetime.now().isoformat(),
                            "response_time_sec": round(elapsed, 3)
                        }
                    else:
                        last_error = f"HTTP Error {response.status}"

            except urllib.error.HTTPError as e:
                last_error = f"HTTP {e.code}: {e.reason}"
                logger.warning(f"[DATA_GOV Attempt {attempt}/{self.max_retries}] {last_error}")
            except urllib.error.URLError as e:
                last_error = f"URLError: {e.reason}"
                logger.warning(f"[DATA_GOV Attempt {attempt}/{self.max_retries}] {last_error}")
            except Exception as e:
                last_error = f"Unexpected Exception: {str(e)}"
                logger.warning(f"[DATA_GOV Attempt {attempt}/{self.max_retries}] {last_error}")

            if attempt < self.max_retries:
                backoff = 0.5 * (2 ** (attempt - 1))
                time.sleep(backoff)

        return {
            "status": "PRICE_DATA_UNAVAILABLE",
            "source": "data.gov.in",
            "available": False,
            "reason": f"Government API request failed after {self.max_retries} attempts: {last_error}",
            "records": [],
            "total_records": 0,
            "fetched_at": datetime.now().isoformat(),
            "error_message": last_error
        }
