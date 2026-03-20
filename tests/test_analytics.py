import requests

r = requests.get('http://localhost:5000/api/analytics/dashboard')
d = r.json()

print('Real data?', d['data']['summaryData'].get('totalStudents') != 2690)
print('Total Students:', d['data']['summaryData'].get('totalStudents'))
print('Faculty:', d['data']['summaryData'].get('faculty'))
print('Departments:', len(d['data']['departmentData']))
print()
print('Department breakdown:')
for dept in d['data']['departmentData']:
    print(f"  {dept['name']}: {dept['students']} students, {dept['faculty']} faculty, CGPA {dept['cgpa']}")
