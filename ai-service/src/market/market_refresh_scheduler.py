"""
Background Scheduled Refresh Daemon for AgriGrade AI Market Data.
Executes daily synchronization at configured hour/minute (Default: 06:00 Asia/Kolkata).
"""

import os
import time
import threading
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

try:
    from .market_service import MarketService
except ImportError:
    from market.market_service import MarketService

logger = logging.getLogger("AgriGradeMarketScheduler")

class MarketRefreshScheduler:
    """
    Background worker that triggers daily mandi market data sync.
    """

    def __init__(self, market_service: Optional[MarketService] = None):
        self.market_service = market_service or MarketService()
        self.refresh_hour = int(os.environ.get("MARKET_REFRESH_HOUR", "6"))
        self.refresh_minute = int(os.environ.get("MARKET_REFRESH_MINUTE", "0"))
        self.enabled = os.environ.get("MARKET_REFRESH_ENABLED", "true").lower() in ["true", "1", "yes"]
        self._thread: Optional[threading.Thread] = None
        self._running = False

    def start(self):
        """
        Starts the background scheduler thread.
        """
        if not self.enabled:
            logger.info("[MARKET_SCHEDULER] Daily market refresh is disabled by configuration.")
            return

        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="MarketRefreshDaemon")
        self._thread.start()
        logger.info(f"[MARKET_SCHEDULER] Scheduled daily refresh initialized (Target: {self.refresh_hour:02d}:{self.refresh_minute:02d} IST).")

    def stop(self):
        """
        Stops the scheduler thread.
        """
        self._running = False

    def _run_loop(self):
        last_refresh_date = None
        while self._running:
            try:
                # India Standard Time (UTC+5:30)
                ist_now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
                current_date = ist_now.date()

                if (
                    ist_now.hour == self.refresh_hour
                    and ist_now.minute == self.refresh_minute
                    and last_refresh_date != current_date
                ):
                    logger.info(f"[MARKET_SCHEDULER] Triggering scheduled daily mandi sync for {current_date} at {ist_now.strftime('%H:%M:%S')} IST")
                    self.market_service.refresh_daily_data()
                    last_refresh_date = current_date

                time.sleep(45) # Check every 45 seconds
            except Exception as e:
                logger.error(f"[MARKET_SCHEDULER] Error in scheduler loop: {e}")
                time.sleep(60)
