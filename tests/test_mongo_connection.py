import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"

async def test_connection():
    try:
        print("Testing MongoDB connection...")
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        
        # Test the connection
        await client.admin.command("ping")
        print("✅ MongoDB connection successful!")
        
        # Test database access
        db = client["College_db"]
        collections = await db.list_collection_names()
        print(f"✅ Collections found: {collections}")
        
        # Test sample data from students collection
        if "students" in collections:
            student_count = await db["students"].count_documents({})
            print(f"✅ Students collection has {student_count} documents")
            
            # Get a sample student
            sample_student = await db["students"].find_one()
            print(f"✅ Sample student fields: {list(sample_student.keys()) if sample_student else 'None'}")
        
        # Test staff collection
        if "staff_Details" in collections:
            staff_count = await db["staff_Details"].count_documents({})
            print(f"✅ Staff collection has {staff_count} documents")
            
        # Test exams collection
        if "exams" in collections:
            exam_count = await db["exams"].count_documents({})
            print(f"✅ Exams collection has {exam_count} documents")
            
        # Test cms database for attendance
        try:
            cms_db = client["cms"]
            cms_collections = await cms_db.list_collection_names()
            print(f"✅ CMS database collections: {cms_collections}")
            
            if "academic_attendance" in cms_collections:
                attendance_count = await cms_db["academic_attendance"].count_documents({})
                print(f"✅ Attendance collection has {attendance_count} documents")
        except Exception as e:
            print(f"⚠️  Could not access CMS database: {e}")
        
        client.close()
        return True
        
    except Exception as error:
        print(f"❌ MongoDB connection failed: {error}")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())
