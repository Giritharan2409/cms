import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

MONGODB_URI = os.getenv("MONGODB_URI")

dept_codes = {
    'Computer Science': 'CSE',
    'Mechanical Eng.': 'MECH',
    'Electrical Eng.': 'EE',
    'Civil Engineering': 'CIV',
    'Automobile Eng.': 'AUTO',
    'Electronics Eng.': 'ECE'
}

async def migrate_ids():
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.get_database()
    if not db.name or db.name == "test":
        db = client["College_db"]
    
    students_coll = db["students"]
    
    print("Fetching all students...")
    students = await students_coll.find().to_list(length=1000)
    print(f"Found {len(students)} students.")

    # Group students by dept and year to handle sequential numbering
    groups = {} # key: (dept_code, year), value: list of students

    for student in students:
        dept = student.get('department', 'Computer Science')
        code = dept_codes.get(dept, 'STU')
        
        # Extract year from enrollDate or default to current year
        enroll_date = student.get('enrollDate', '2026-01-01')
        try:
            year = enroll_date.split('-')[0]
        except:
            year = "2026"
            
        key = (code, year)
        if key not in groups:
            groups[key] = []
        groups[key].append(student)

    # Update each student with new ID
    updates_count = 0
    for key, group in groups.items():
        code, year = key
        # Sort group by their current ID or name to keep some order if possible
        group.sort(key=lambda s: s.get('name', ''))
        
        for i, student in enumerate(group, 1):
            new_id = f"{code}-{year}-{str(i).padStart(3, '0') if hasattr(str(i), 'padStart') else str(i).zfill(3)}"
            old_id = student.get('id')
            
            if old_id != new_id:
                print(f"Updating {student.get('name')}: {old_id} -> {new_id}")
                await students_coll.update_one(
                    {'_id': student['_id']},
                    {'$set': {'id': new_id}}
                )
                updates_count += 1

    print(f"Successfully updated {updates_count} student IDs.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_ids())
