from fastapi import APIRouter, Query

router = APIRouter(prefix="/courses", tags=["Courses"])

COURSES_BY_CATEGORY: dict[str, list[dict[str, str]]] = {
    "Engineering": [
        {"code": "CSE", "name": "Computer Science Engineering"},
        {"code": "ECE", "name": "Electronics and Communication Engineering"},
        {"code": "MECH", "name": "Mechanical Engineering"},
        {"code": "CIVIL", "name": "Civil Engineering"},
        {"code": "IT", "name": "Information Technology"},
    ],
}


@router.get("")
async def list_courses(category: str = Query(default="Engineering")):
    return {"category": category, "data": COURSES_BY_CATEGORY.get(category, [])}
