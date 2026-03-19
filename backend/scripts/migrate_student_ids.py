import os
import random
from pymongo import MongoClient
import certifi
from bson import ObjectId

# Connection String
MONGODB_URI = "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"

def migrate():
    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
    db = client["College_db"]
    students_col = db["students"]

    updated_count = 0
    all_students = list(students_col.find())
    
    print(f"Scanning {len(all_students)} student records...")

    for student in all_students:
        obj_id = student["_id"]
        current_id = student.get("id")
        current_roll = student.get("rollNumber")
        
        needs_update = False
        
        # Check if ID is missing or looks like a hex ObjectId
        if not current_id or (len(str(current_id)) == 24 and all(c in '0123456789abcdefABCDEF' for c in str(current_id))):
            needs_update = True
            
        # Check if RollNumber is missing or looks like a hex ObjectId
        if not current_roll or (len(str(current_roll)) == 24 and all(c in '0123456789abcdefABCDEF' for c in str(current_roll))):
            needs_update = True

        if needs_update:
            # Generate new ID: STU-[YEAR]-[RANDOM]
            # Use 2025 as default year for legacy migration
            new_id = f"STU-2025-{random.randint(1000, 9999)}"
            
            # Ensure uniqueness (simple check)
            while students_col.find_one({"$or": [{"id": new_id}, {"rollNumber": new_id}]}):
                new_id = f"STU-2025-{random.randint(1000, 9999)}"
            
            print(f"Updating Student {student.get('name', 'Unknown')} (Old ID: {current_id or 'None'}) -> {new_id}")
            
            students_col.update_one(
                {"_id": obj_id},
                {"$set": {"id": new_id, "rollNumber": new_id}}
            )
            updated_count += 1

    print(f"Migration complete! Updated {updated_count} records.")
    client.close()

if __name__ == "__main__":
    migrate()
