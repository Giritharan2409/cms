import asyncio
import sys
sys.path.insert(0, 'd:/htdocs/CMS')

from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"

async def check_collections():
    client = AsyncIOMotorClient(MONGODB_URI)
    
    # Check College_db
    print("=" * 60)
    print("College_db DATABASE")
    print("=" * 60)
    db = client["College_db"]
    
    collections_to_check = [
        "academic_attendance",
        "academic_attendance_weekly",
        "academic_facilities", 
        "academic_facility_bookings",
        "academic_placements",
        "academic_timetables",
        "exams",
        "students",
        "staff_detail",
        "staff_Details"
    ]
    
    for coll_name in collections_to_check:
        try:
            count = await db[coll_name].count_documents({})
            print(f"{coll_name}: {count} documents")
            
            if count > 0:
                sample = await db[coll_name].find_one()
                print(f"  Fields: {list(sample.keys())}")
        except Exception as e:
            print(f"{coll_name}: Error - {e}")
    
    # Also check cms database
    print("\n" + "=" * 60)
    print("cms DATABASE")
    print("=" * 60)
    db2 = client["cms"]
    
    for coll_name in collections_to_check:
        try:
            count = await db2[coll_name].count_documents({})
            print(f"{coll_name}: {count} documents")
        except Exception as e:
            print(f"{coll_name}: Error - {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_collections())
