"""
Self-healing MongoDB connection manager.

Features:
  - Attempts Atlas → localhost on startup.
  - Runs a background asyncio task that:
      • Retries connection every few seconds when disconnected.
      • Periodically health-checks an existing connection (ping).
      • Automatically reconnects if a health-check fails.
  - Exposes `get_db()` which raises 503 only while truly disconnected
    (the background loop ensures this window is as short as possible).
  - Exposes `get_client()` for callers that need the raw client (e.g. analytics).
  - Exposes `is_connected()` for health endpoints.
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlsplit

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

MONGODB_URI = (
    os.getenv("MONGODB_URI")
    or "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"
)

# Reconnection tuning knobs
INITIAL_RETRY_SECONDS = 5          # First retry delay after failure
MAX_RETRY_SECONDS = 60             # Cap for exponential back-off
HEALTH_CHECK_INTERVAL_SECONDS = 30 # How often to ping a live connection
CONNECT_TIMEOUT_MS = 5000          # MongoDB driver server-selection timeout

logger = logging.getLogger("cms.db")

# ---------------------------------------------------------------------------
# Internal state (module-level singletons)
# ---------------------------------------------------------------------------
_client: Optional[AsyncIOMotorClient] = None
_db = None
_connected = False
_reconnect_task: Optional[asyncio.Task] = None

# Keep the legacy names importable for backwards-compat (analytics.py imports `client`)
client: Optional[AsyncIOMotorClient] = None
db = None


def mask_mongodb_uri(uri: Optional[str]) -> str:
    if not uri:
        return "<not configured>"
    try:
        parts = urlsplit(uri)
        host = parts.hostname or "unknown-host"
        scheme = parts.scheme or "mongodb"
        return f"{scheme}://{host}"
    except Exception:
        return "<configured>"


def _resolve_database(motor_client: AsyncIOMotorClient, uri: str):
    """Pick the right database name from a client + URI."""
    if "mongodb.net" in str(uri):
        return motor_client["College_db"]
    database = motor_client.get_database()
    if database.name == "test":
        return motor_client["College_db"]
    return database


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------
async def _try_connect() -> bool:
    """
    Try each URI in order.  On success update module-level state and
    return True.  On total failure return False (state stays disconnected).
    """
    global _client, _db, _connected, client, db

    uris_to_try = [MONGODB_URI, "mongodb://localhost:27017/College_db"]

    for uri in uris_to_try:
        masked = mask_mongodb_uri(uri)
        try:
            temp_client = AsyncIOMotorClient(
                uri, serverSelectionTimeoutMS=CONNECT_TIMEOUT_MS
            )
            # Verify the connection is alive
            await asyncio.wait_for(
                temp_client.admin.command("ping"), timeout=CONNECT_TIMEOUT_MS / 1000 + 2
            )

            database = _resolve_database(temp_client, uri)

            # Close old client if we had one
            if _client and _client is not temp_client:
                try:
                    _client.close()
                except Exception:
                    pass

            # Update internal state
            _client = temp_client
            _db = database
            _connected = True

            # Update legacy module-level names for backwards-compat
            client = _client
            db = _db

            print(f"✅ MongoDB CONNECTED at {masked} (Database: {database.name})")
            logger.info("MongoDB connected at %s (db=%s)", masked, database.name)
            return True

        except Exception as exc:
            print(f"❌ MongoDB connect FAILED for {masked}: {exc}")
            logger.warning("MongoDB connect failed for %s: %s", masked, exc)

    return False


async def _mark_disconnected():
    """Set state to disconnected so get_db() raises 503 until reconnected."""
    global _client, _db, _connected, client, db
    _connected = False
    _db = None
    _client = None
    client = None
    db = None


# ---------------------------------------------------------------------------
# Background reconnection / health-check loop
# ---------------------------------------------------------------------------
async def _reconnect_loop():
    """
    Runs as a long-lived background task for the entire server lifetime.

    • When disconnected: retries with exponential back-off.
    • When connected: pings periodically; marks disconnected on failure
      so the next iteration retries.
    """
    retry_delay = INITIAL_RETRY_SECONDS

    while True:
        try:
            if not _connected or _db is None:
                # ---------- DISCONNECTED: attempt reconnect ----------
                await asyncio.sleep(retry_delay)
                print(f"🔄 MongoDB reconnecting (retry in {retry_delay}s)…")
                success = await _try_connect()
                if success:
                    retry_delay = INITIAL_RETRY_SECONDS  # reset back-off
                else:
                    retry_delay = min(retry_delay * 1.5, MAX_RETRY_SECONDS)
            else:
                # ---------- CONNECTED: periodic health-check ----------
                await asyncio.sleep(HEALTH_CHECK_INTERVAL_SECONDS)
                try:
                    await asyncio.wait_for(
                        _client.admin.command("ping"),
                        timeout=CONNECT_TIMEOUT_MS / 1000 + 2,
                    )
                except Exception as exc:
                    print(f"⚠️  MongoDB health-check FAILED: {exc}")
                    logger.warning("Health-check failed: %s", exc)
                    await _mark_disconnected()
                    retry_delay = INITIAL_RETRY_SECONDS  # start retrying immediately
        except asyncio.CancelledError:
            break
        except Exception as exc:
            # Safety net — never let the loop die from an unexpected error
            logger.exception("Unexpected error in reconnect loop: %s", exc)
            await asyncio.sleep(INITIAL_RETRY_SECONDS)


# ---------------------------------------------------------------------------
# FastAPI lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app):
    global _reconnect_task

    # Attempt initial connection (synchronously, before taking requests)
    success = await _try_connect()
    if not success:
        print(
            "⚠️  INITIAL MongoDB connection failed. "
            "Background reconnection is ACTIVE — will keep retrying."
        )

    # Kick off the background health-check / reconnect loop
    _reconnect_task = asyncio.create_task(_reconnect_loop())

    yield  # ---- server is running ----

    # Shutdown: cancel background task and close client
    if _reconnect_task:
        _reconnect_task.cancel()
        try:
            await _reconnect_task
        except asyncio.CancelledError:
            pass

    if _client:
        _client.close()
        print("Disconnected from MongoDB.")


# ---------------------------------------------------------------------------
# Public API used by route handlers
# ---------------------------------------------------------------------------
def get_db():
    """
    Return the current database handle.
    Raises HTTP 503 if no connection is available *right now*
    (the background loop is already working on reconnecting).
    """
    if _db is None:
        raise HTTPException(
            status_code=503,
            detail="Database is temporarily unavailable — reconnecting automatically…",
        )
    return _db


def get_client() -> AsyncIOMotorClient:
    """Return the raw Motor client (needed by analytics for cross-db queries)."""
    if _client is None:
        raise HTTPException(
            status_code=503,
            detail="Database client is temporarily unavailable — reconnecting automatically…",
        )
    return _client


def is_connected() -> bool:
    """Quick boolean for health-check endpoints."""
    return _connected and _db is not None
