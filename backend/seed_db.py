import os
from urllib.parse import urlsplit

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

DEFAULT_MONGODB_URI = "mongodb://localhost:27017/College_db"
MONGODB_URI = os.getenv("MONGODB_URI", DEFAULT_MONGODB_URI)


def mask_mongodb_uri(uri: str | None) -> str:
    if not uri:
        return "<not configured>"

    try:
        parts = urlsplit(uri)
        host = parts.hostname or "unknown-host"
        scheme = parts.scheme or "mongodb"
        return f"{scheme}://{host}"
    except Exception:
        return "<configured>"


def resolve_database_name(uri: str | None) -> str:
    try:
        parts = urlsplit(uri or "")
        db_name = (parts.path or "").lstrip("/")
        if db_name:
            return db_name
    except Exception:
        pass

    return "College_db"


def get_database(client: MongoClient):
    try:
        db = client.get_default_database()
        if db.name != "test":
            return db
    except Exception:
        pass

    return client[resolve_database_name(MONGODB_URI)]


def seed():
    print(f"Connecting to {mask_mongodb_uri(MONGODB_URI)}...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=30000)
    db = get_database(client)

    try:
        print(f"Using database: {db.name}")
        print("Retrieving staff_details from MongoDB...")
        staff_details = list(db.staff_details.find())
        print(f"Retrieved {len(staff_details)} staff from staff_details collection.")

        payroll_entries = []
        for staff in staff_details:
            payroll_entries.append(
                {
                    "staffId": staff.get("staffId"),
                    "staffName": staff.get("staffName"),
                    "designation": staff.get("designation"),
                    "department": staff.get("department"),
                    "category": staff.get("category"),
                    "salary": 0,
                    "createdAt": "2026-03-16",
                }
            )

        if payroll_entries:
            db.payroll.insert_many(payroll_entries)
            print(f"SUCCESS: Seeded {len(payroll_entries)} payroll entries into payroll collection.")
        else:
            print("No staff found to create payroll entries.")

        print("Database seeded successfully!")
    finally:
        client.close()

if __name__ == "__main__":
    seed()
