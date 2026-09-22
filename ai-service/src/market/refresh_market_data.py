"""
CLI Utility to Manually Trigger Daily Market Data Refresh.
Usage:
    python -m src.market.refresh_market_data
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add ai-service/src to sys.path
SRC_DIR = Path(__file__).resolve().parent.parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

try:
    from .market_service import MarketService
    from .market_cache import MarketCache
except ImportError:
    from market.market_service import MarketService
    from market.market_cache import MarketCache

def main():
    print("=" * 60)
    print("      AgriGrade AI — Market Data Synchronization CLI")
    print("=" * 60)

    service = MarketService()
    cache = MarketCache()

    print(f"Source: data.gov.in (Government of India Open Government Data)")
    print(f"Date:   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)

    result = service.refresh_daily_data()
    status_info = cache.get_status()

    print("\nCommodity Market Counts in Cache:")
    crops = ["tomato", "banana", "mango", "onion", "okra", "carrot", "brinjal", "green_chilli", "drumstick", "beetroot", "bottle_gourd", "bitter_gourd", "snake_gourd", "tapioca"]
    for c in crops:
        records = cache.query_market_prices(c, limit=100)
        print(f"  * {c.title():<15}: {len(records):>2} markets (Latest: Rs. {records[0]['modal_price']:.2f}/kg)" if records else f"  * {c.title():<15}:  0 markets")

    print("-" * 60)
    print(f"Total Cached Records:    {status_info['total_records']}")
    print(f"Total Mandi Markets:     {status_info['total_markets']}")
    print(f"Latest Market Data Date: {status_info['latest_market_date']}")
    print(f"Refresh Status:          {result.get('status')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
