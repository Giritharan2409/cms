import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"

async def check_students():
    """Check what's actually in the students collection"""
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        await client.admin.command('ping')
        db = client["College_db"]
        
        print("🔍 Checking Students Collection...")
        
        # Get all students to see their structure
        cursor = db["students"].find({}).limit(10)
        students = []
        async for student in cursor:
            students.append(student)
        
        print(f"\n📊 Found {len(students)} students:")
        for i, student in enumerate(students[:5]):
            print(f"  {i+1}. ID: {student.get('_id')}")
            print(f"     Name: {student.get('name', 'N/A')}")
            print(f"     Department: {student.get('department', 'N/A')}")
            print(f"     DepartmentId: {student.get('departmentId', 'N/A')}")
            print(f"     CGPA: {student.get('cgpa', 'N/A')}")
            print(f"     ---")
        
        # Get unique departments
        dept_pipeline = [
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        departments = []
        async for doc in db["students"].aggregate(dept_pipeline):
            departments.append(doc)
        
        print(f"\n🏢 Departments in students collection:")
        for dept in departments:
            print(f"  - {dept['_id']}: {dept['count']} students")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_students())
