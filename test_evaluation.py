import requests
import json

url = "http://localhost:8000/api/faculty/69c143bf9b331499195a9dba/evaluations"
payload = {
    "semester": "Semester 1",
    "academic_year": "2025",
    "evaluator_id": "ADMIN001",
    "course_content": 4.5,
    "teaching_methodology": 4.0,
    "student_engagement": 4.5,
    "feedback_responsiveness": 4.0,
    "research_output": 3.5,
    "publication_quality": 3.0,
    "research_collaboration": 4.0,
    "meeting_attendance": 5.0,
    "committee_participation": 4.5,
    "documentation": 4.0,
    "student_satisfaction": 4.5,
    "course_effectiveness": 4.5,
    "availability": 4.0,
    "strengths": "Excellent teaching skills",
    "areas_for_improvement": "More publications",
    "recommendations": "Encourage research"
}

print("Testing POST to add evaluation...")
response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

print("\nTesting GET to retrieve evaluations...")
response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Evaluations: {json.dumps(response.json(), indent=2)}")
