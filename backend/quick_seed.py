from pymongo import MongoClient
import os
from dotenv import load_dotenv
from urllib.parse import urlsplit

dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

DEFAULT_MONGODB_URI = "mongodb://localhost:27017/College_db"


def resolve_database_name(uri: str) -> str:
    try:
        parts = urlsplit(uri)
        db_name = (parts.path or '').lstrip('/')
        if db_name:
            return db_name
    except Exception:
        pass

    return 'College_db'


def get_database(client: MongoClient, uri: str):
    try:
        db = client.get_default_database()
        if db.name != 'test':
            return db
    except Exception:
        pass

    return client[resolve_database_name(uri)]

def seed():
    uri = os.getenv('MONGODB_URI', DEFAULT_MONGODB_URI)
    print(f"Connecting to Atlas...")
    client = MongoClient(uri, serverSelectionTimeoutMS=30000)
    db = get_database(client, uri)
    try:
        # Test connection and retrieval
        sample_staff = db.staff_details.find_one()
        if sample_staff:
            print("Sample staff document:", sample_staff)
        else:
            print("No staff documents found in staff_details collection.")
        # ...existing code...
        staff_details = list(db.staff_details.find())
        print(f"Retrieved {len(staff_details)} staff from staff_details collection.")
        payroll_entries = []
        for staff in staff_details:
            payroll_entry = {
                "staffId": staff.get("staffId"),
                "staffName": staff.get("staffName"),
                "designation": staff.get("designation"),
                "department": staff.get("department"),
                "category": staff.get("category"),
                "salary": 0,
                "createdAt": "2026-03-16"
            }
            payroll_entries.append(payroll_entry)
        if payroll_entries:
            db.payroll.insert_many(payroll_entries)
            print(f"SUCCESS: Seeded {len(payroll_entries)} payroll entries into payroll collection.")
        else:
            print("No staff found to create payroll entries.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    seed()
