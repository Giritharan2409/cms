from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://priyadharshini:Ezhilithaya@cluster0.crvutrr.mongodb.net/")

def check_collections():
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        db = client["cms"]
        
        print("=" * 60)
        print("CHECKING CMS DATABASE COLLECTIONS")
        print("=" * 60)
        
        collections = [
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
        
        for coll_name in collections:
            count = db[coll_name].count_documents({})
            print(f"\n{coll_name}: {count} documents")
            
            if count > 0:
                # Show sample document
                sample = db[coll_name].find_one()
                print(f"  Sample fields: {list(sample.keys())}")
                print(f"  Sample data: {str(sample)[:200]}...")
        
        print("\n" + "=" * 60)
        
        # Also check College_db if it exists
        db2 = client["College_db"]
        print("\nCHECKING College_db DATABASE")
        print("=" * 60)
        
        for coll_name in collections:
            try:
                count = db2[coll_name].count_documents({})
                if count > 0:
                    print(f"\n{coll_name}: {count} documents")
                    sample = db2[coll_name].find_one()
                    print(f"  Sample fields: {list(sample.keys())}")
            except:
                pass
        
        client.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_collections()
