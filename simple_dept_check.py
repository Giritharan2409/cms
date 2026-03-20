import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client["College_db"]
    
    pipeline = [{"$group": {"_id": "$departmentId", "count": {"$sum": 1}}}]
    departments = []
    async for doc in db["students"].aggregate(pipeline):
        departments.append(doc)
        print(f"{doc['_id']}: {doc['count']}")
    
    await client.close()

asyncio.run(check())
