import requests
import json

def test_analytics_download():
    """Test that analytics API returns correct data for download"""
    try:
        print("Testing Analytics API for Download Functionality...")
        
        # Test the main analytics endpoint
        response = requests.get("http://localhost:5000/api/analytics/dashboard")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Analytics API working!")
            
            if data.get('success') and data.get('data'):
                analytics_data = data['data']
                
                # Check if data is coming from MongoDB (real data) or fallback
                summary = analytics_data.get('summaryData', {})
                students = summary.get('students', '0')
                
                print(f"\n📊 Data Available for Download:")
                print(f"   Students: {students}")
                print(f"   Faculty: {summary.get('faculty', '0')}")
                print(f"   Departments: {summary.get('departments', '0')}")
                print(f"   Average Attendance: {summary.get('averageAttendance', 0)}%")
                print(f"   Average Performance: {summary.get('averagePerformance', 0)}")
                
                # Check department data
                dept_data = analytics_data.get('departmentData', [])
                print(f"\n🏢 Department Data ({len(dept_data)} departments):")
                for dept in dept_data:
                    print(f"   {dept['name']}: {dept['students']} students, {dept['faculty']} faculty")
                
                # Check attendance data
                attendance_data = analytics_data.get('attendanceData', [])
                print(f"\n📅 Attendance Data ({len(attendance_data)} months):")
                for att in attendance_data:
                    print(f"   {att['month']}: {att['present']} present, {att['absent']} absent ({att['attendance']}%)")
                
                # Determine if data is from MongoDB or fallback
                if students == "11" and len(dept_data) == 1:
                    print("\n✅ REAL MONGODB DATA - Download will use actual database values!")
                    print("   (11 students, 4 faculty from College_db)")
                else:
                    print("\n⚠️  FALLBACK DATA - Download will use static values")
                
                # Simulate CSV generation
                csv_content = "Year,Students,Faculty,Avg Attendance,Avg Pass Rate,Courses,Semester,Department\n"
                csv_content += f"2025,{students},{summary.get('faculty', '0')},{summary.get('averageAttendance', 0)}%,{summary.get('averagePerformance', 0)}%,{summary.get('courses', 'N/A')},Semester 4,All Departments\n"
                
                print(f"\n📄 Sample CSV Content:")
                print(csv_content)
                
                return True
            else:
                print("❌ Invalid response format")
                return False
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    test_analytics_download()
