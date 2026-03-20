import requests
url = 'http://localhost:5000/api/analytics/dashboard'
resp = requests.get(url)
data = resp.json()
print('Department Data:')
for dept in data.get('data', {}).get('departmentData', []):
    print(f"  {dept.get('name')}: {dept.get('students')} students, {dept.get('faculty')} faculty, CGPA {dept.get('cgpa')}, Attendance {dept.get('avgAttendance')}%")
