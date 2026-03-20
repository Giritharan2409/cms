import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = 'mongodb+srv://priyadharshini:Ezhilithaya@cluster0.crvutrr.mongodb.net/College_db'

async def debug():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client['College_db']
    
    # Count students
    count = await db.students.count_documents({})
    print(f'Total students: {count}')
    
    # Check one student
    student = await db.students.find_one()
    if student:
        print(f'Sample student fields: {list(student.keys())}')
        print(f'departmentId: {student.get("departmentId")}')
    
    # Aggregate by departmentId
    pipeline = [{'$group': {'_id': '$departmentId', 'count': {'$sum': 1}}}]
    results = []
    async for doc in db.students.aggregate(pipeline):
        results.append(doc)
    print(f'Department aggregation: {results}')
    
    client.close()

asyncio.run(debug())
