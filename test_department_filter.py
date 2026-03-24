import requests
import json
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
        
        # Get unique departments
        dept_pipeline = [
            {"$group": {"_id": "$departmentId", "count": {"$sum": 1}}},
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

def test_department_data():
    """Test the actual structure of department data from API"""
    try:
        print("Testing Department Data Structure...")
        
        response = requests.get("http://localhost:5000/api/analytics/dashboard")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('data'):
                analytics_data = data['data']
                
                # Check department data structure
                dept_data = analytics_data.get('departmentData', [])
                
                print(f"\n📊 Department Data Structure:")
                print(f"   Type: {type(dept_data)}")
                print(f"   Length: {len(dept_data)}")
                print(f"   Data: {dept_data}")
                
                if dept_data:
                    print(f"\n🔍 First Department:")
                    first_dept = dept_data[0]
                    print(f"   Keys: {list(first_dept.keys())}")
                    print(f"   Name: '{first_dept.get('name')}'")
                    print(f"   Students: {first_dept.get('students')}")
                    print(f"   Faculty: {first_dept.get('faculty')}")
                    
                    # Test filtering logic
                    print(f"\n🧪 Testing Filter Logic:")
                    test_dept = "CS"
                    filtered = [dept for dept in dept_data if dept.get('name') == test_dept]
                    print(f"   Exact match filter: {len(filtered)} results")
                    
                    filtered_case = [dept for dept in dept_data if 
                        dept.get('name') and 
                        dept.get('name').lower().strip() == test_dept.lower().strip()
                    ]
                    print(f"   Case-insensitive filter: {len(filtered_case)} results")
                    
                    # Check available department names
                    print(f"\n📋 Available Department Names:")
                    for dept in dept_data:
                        name = dept.get('name', 'Unknown')
                        print(f"   '{name}'")
                
                return True
            else:
                print("❌ Invalid response format")
                return False
                
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_department_data()
