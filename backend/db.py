import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, Union

from dotenv import load_dotenv
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlsplit

# Always load .env from the backend folder, independent of process CWD.
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

# Use Atlas connection string from environment; fallback to local Mongo for development.
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb://localhost:27017/College_db"

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


@asynccontextmanager
async def lifespan(app):
    global client, db

    uris_to_try = [
        MONGODB_URI,
        "mongodb://localhost:27017/College_db"
    ]

    for uri in uris_to_try:
        masked_uri = mask_mongodb_uri(uri)
        print(f"DEBUG: Attempting to connect to MongoDB at {masked_uri}...")
        try:
            # Increase timeout to 5000ms for more reliable Atlas connection
            temp_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            await temp_client.admin.command("ping")
            
            client = temp_client
            try:
                if "mongodb.net" in str(uri):
                    db = client["College_db"]
                else:
                    db = client.get_database()
                    if db.name == "test":
                        db = client["College_db"]
            except Exception as e:
                print(f"DEBUG: Setting DB name failed: {e}")
                db = client["College_db"]

            print(f"SUCCESS: Connected to MongoDB (Database: {db.name})")
            break # Success!
        except Exception as error:
            print(f"ERROR: FAILED to connect to {masked_uri}: {error}")
            db = None

    if db is None:
        print("CRITICAL: All MongoDB connection attempts failed. FALLING BACK TO DEV_STORE.")

    yield

    if client:
        client.close()
        print("Disconnected from MongoDB.")


def get_db():
    if db is None:
        raise HTTPException(status_code=503, detail="Database is not available")
    return db
