import urllib.request
import json

try:
    with urllib.request.urlopen("http://localhost:8000/api/students") as response:
        if response.getcode() == 200:
            data = json.loads(response.read().decode())
            print(f"SUCCESS: Retrieved {len(data)} students from live API.")
        else:
            print(f"FAIL: Status code {response.getcode()}")
except Exception as e:
    print(f"FAIL: {e}")
