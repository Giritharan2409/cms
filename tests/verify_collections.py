import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

MONGODB_URI = 'mongodb+srv://priyadharshini:Ezhilithaya@cluster0.crvutrr.mongodb.net/'

async def verify_collections():
    client = AsyncIOMotorClient(MONGODB_URI)
    
    print("=" * 70)
    print("VERIFYING COLLEGE_DB DATABASE")
    print("=" * 70)
    
    db = client['College_db']
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"\nCollections found: {collections}")
    
    # Verify students collection
    print("\n" + "-" * 70)
    print("STUDENTS COLLECTION")
    print("-" * 70)
    student_count = await db.students.count_documents({})
    print(f"Count: {student_count}")
    if student_count > 0:
        student = await db.students.find_one()
        print(f"Sample document:")
        for key, value in student.items():
            print(f"  {key}: {value}")
    
    # Verify staff_Details collection  
    print("\n" + "-" * 70)
    print("STAFF_DETAILS COLLECTION")
    print("-" * 70)
    staff_count = await db.staff_Details.count_documents({})
    print(f"Count: {staff_count}")
    if staff_count > 0:
        staff = await db.staff_Details.find_one()
        print(f"Sample document:")
        for key, value in staff.items():
            print(f"  {key}: {value}")
    
    # Verify exams collection
    print("\n" + "-" * 70)
    print("EXAMS COLLECTION")
    print("-" * 70)
    exam_count = await db.exams.count_documents({})
    print(f"Count: {exam_count}")
    if exam_count > 0:
        exam = await db.exams.find_one()
        print(f"Sample document:")
        for key, value in exam.items():
            print(f"  {key}: {value}")
    
    # Verify academic_timetables
    print("\n" + "-" * 70)
    print("ACADEMIC_TIMETABLES COLLECTION")
    print("-" * 70)
    tt_count = await db.academic_timetables.count_documents({})
    print(f"Count: {tt_count}")
    
    print("\n" + "=" * 70)
    print("VERIFYING CMS DATABASE")
    print("=" * 70)
    
    db2 = client['cms']
    
    # List all collections in cms
    collections2 = await db2.list_collection_names()
    print(f"\nCollections found: {collections2}")
    
    # Verify academic_attendance
    print("\n" + "-" * 70)
    print("ACADEMIC_ATTENDANCE COLLECTION (in cms)")
    print("-" * 70)
    att_count = await db2.academic_attendance.count_documents({})
    print(f"Count: {att_count}")
    if att_count > 0:
        att = await db2.academic_attendance.find_one()
        print(f"Sample document:")
        for key, value in att.items():
            print(f"  {key}: {value}")
    
    # Verify academic_attendance_weekly
    print("\n" + "-" * 70)
    print("ACADEMIC_ATTENDANCE_WEEKLY COLLECTION (in cms)")
    print("-" * 70)
    weekly_count = await db2.academic_attendance_weekly.count_documents({})
    print(f"Count: {weekly_count}")
    if weekly_count > 0:
        weekly = await db2.academic_attendance_weekly.find_one()
        print(f"Sample document:")
        for key, value in weekly.items():
            print(f"  {key}: {value}")
    
    client.close()
    print("\n" + "=" * 70)
    print("VERIFICATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(verify_collections())
