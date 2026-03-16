from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Path to the .env file in the backend directory
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

def check_db():
    uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {uri}")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        # Explicitly use 'cms' if not in URI
        db = client["cms"]
        print(f"Database name: {db.name}")
        
        collections = db.list_collection_names()
        print(f"Collections: {collections}")
        
        for coll_name in collections:
            count = db[coll_name].count_documents({})
            print(f"Collection '{coll_name}' has {count} documents.")
            if count > 0:
                # Use a string representation to avoid issues with ObjectId in print
                docs = list(db[coll_name].find().limit(2))
                print(f"Sample from '{coll_name}': {docs}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
