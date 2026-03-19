import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def test_conn():
    uri = "mongodb://localhost:27017"
    print(f"Testing connection to {uri}")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print("Ping successful!")
        
        db = client["College_db"]
        count = await db["students"].count_documents({})
        print(f"Students count: {count}")
        
        async for s in db["students"].find().limit(5):
            print(f"Found student: {s.get('name')} ({s.get('rollNumber')})")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
