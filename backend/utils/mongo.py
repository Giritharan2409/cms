from bson import ObjectId
from fastapi import HTTPException


def parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Invalid ID format") from error


def serialize_doc(document: dict | None) -> dict | None:
    if not document:
        return document

    if "_id" in document:
        # Only populate 'id' from '_id' if no 'id' already exists
        if "id" not in document:
            document["id"] = str(document["_id"])
        else:
            # Optionally keep the mongo_id as a separate field if needed
            document["_mongo_id"] = str(document["_id"])
        del document["_id"]

    return document
