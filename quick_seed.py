from pymongo import MongoClient
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

def seed():
    uri = "mongodb+srv://giritharand3_db_user:cms@cms.sufjn3m.mongodb.net/?appName=CMS"
    print(f"Connecting to Atlas...")
    client = MongoClient(uri, serverSelectionTimeoutMS=30000)
    db = client["cms"]
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
