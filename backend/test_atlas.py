import asyncio
import motor.motor_asyncio

async def test():
    uri = "mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/College_db"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
    try:
        await client.admin.command('ping')
        print("SUCCESS")
        db = client["College_db"]
        count = await db.students.count_documents({})
        print(f"Students count: {count}")
    except Exception as e:
        print(f"FAIL: {e}")

if __name__ == "__main__":
    asyncio.run(test())
