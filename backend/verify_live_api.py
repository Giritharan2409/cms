import requests

try:
    response = requests.get("http://localhost:8000/api/students", timeout=10)
    if response.status_code == 200:
        students = response.json()
        print(f"SUCCESS: Retrieved {len(students)} students from live API.")
        if len(students) > 11:
            print("Verified: Real data is being served.")
        else:
            print("Failed: Still seeing mock data or empty database.")
    else:
        print(f"FAIL: API returned status code {response.status_code}")
except Exception as e:
    print(f"FAIL: Could not reach API. {e}")
