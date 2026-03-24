import requests
import json

def test_chart_data():
    """Test the specific data structure needed for Department Comparison chart"""
    try:
        print("Testing Department Chart Data Structure...")
        
        response = requests.get("http://localhost:5000/api/analytics/dashboard")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and data.get('data'):
                analytics_data = data['data']
                
                # Check department data structure
                dept_data = analytics_data.get('departmentData', [])
                print(f"\n📊 Department Data Structure:")
                print(f"   Total departments: {len(dept_data)}")
                
                for i, dept in enumerate(dept_data):
                    print(f"\n   Department {i+1}:")
                    print(f"     Name: '{dept.get('name', 'N/A')}'")
                    print(f"     Students: {dept.get('students', 'N/A')}")
                    print(f"     Faculty: {dept.get('faculty', 'N/A')}")
                    print(f"     Avg Attendance: {dept.get('avgAttendance', 'N/A')}")
                    print(f"     CGPA: {dept.get('cgpa', 'N/A')}")
                    
                    # Check if required fields exist for BarChart
                    required_fields = ['name', 'students', 'faculty']
                    missing_fields = [field for field in required_fields if field not in dept]
                    if missing_fields:
                        print(f"     ❌ Missing fields: {missing_fields}")
                    else:
                        print(f"     ✅ All required fields present")
                
                # Test filtering logic
                print(f"\n🔍 Testing Filter Logic:")
                
                # Test "All Departments" filter
                all_depts = dept_data  # Should return all departments
                print(f"   All Departments filter: {len(all_depts)} departments")
                
                # Test specific department filter
                if dept_data:
                    specific_dept = [d for d in dept_data if d.get('name') == dept_data[0].get('name')]
                    print(f"   Specific department filter ({dept_data[0].get('name')}): {len(specific_dept)} departments")
                
                # Simulate the data structure expected by BarChart
                print(f"\n📋 BarChart Data Format:")
                for dept in dept_data:
                    chart_data = {
                        'name': dept.get('name'),
                        'students': dept.get('students'),
                        'faculty': dept.get('faculty')
                    }
                    print(f"   {chart_data}")
                
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
    test_chart_data()
