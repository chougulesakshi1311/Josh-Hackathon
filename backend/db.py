"""
MongoDB connection and CRUD operations for Credit Scoring Platform.
Configure via environment variables: MONGODB_URI (default: mongodb://localhost:27017)
"""
from datetime import datetime
from typing import Optional, Dict, List, Any
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "credit_scoring")

client = None
db = None

def init_mongodb():
    """Initialize MongoDB connection"""
    global client, db
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[DB_NAME]
        
        # Create collections and indexes
        _setup_collections()
        print(f"✓ Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        print("  Falling back to in-memory mode")
        db = None

def _setup_collections():
    """Create collections with indexes"""
    collections = db.list_collection_names()
    
    # Users collection
    if "users" not in collections:
        db.create_collection("users")
    db["users"].create_index("email", unique=True, sparse=True)
    
    # Applications collection
    if "applications" not in collections:
        db.create_collection("applications")
    db["applications"].create_index("user_email")
    db["applications"].create_index("created_at")
    
    # Audit results collection
    if "audit_results" not in collections:
        db.create_collection("audit_results")
    db["audit_results"].create_index("timestamp")

def close_mongodb():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✓ MongoDB connection closed")

# ========== USERS ==========

def create_user(email: str, password_hash: str) -> Dict[str, Any]:
    """Create a new user"""
    if db is None:
        return {"email": email, "password_hash": password_hash, "created_at": datetime.utcnow().isoformat()}
    
    try:
        user = {
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.utcnow(),
            "login_count": 0,
            "last_login": None
        }
        result = db["users"].insert_one(user)
        return {"_id": str(result.inserted_id), **user}
    except DuplicateKeyError:
        raise ValueError(f"User {email} already exists")

def get_user(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    if db is None:
        return None
    
    user = db["users"].find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    return user

def update_user_login(email: str) -> None:
    """Update last login timestamp"""
    if db is None:
        return
    
    db["users"].update_one(
        {"email": email},
        {
            "$set": {"last_login": datetime.utcnow()},
            "$inc": {"login_count": 1}
        }
    )

# ========== APPLICATIONS ==========

def save_application(user_email: str, input_data: Dict[str, Any], prediction: Dict[str, Any]) -> str:
    """Save an application (prediction record)"""
    if db is None:
        return "in-memory"
    
    app_record = {
        "user_email": user_email,
        "input": input_data,
        "prediction": prediction,
        "created_at": datetime.utcnow(),
    }
    result = db["applications"].insert_one(app_record)
    return str(result.inserted_id)

def get_user_applications(user_email: str) -> List[Dict[str, Any]]:
    """Get all applications for a user"""
    if db is None:
        return []
    
    apps = list(db["applications"].find(
        {"user_email": user_email}
    ).sort("created_at", -1).limit(100))
    
    for app in apps:
        app["_id"] = str(app["_id"])
        app["created_at"] = app["created_at"].isoformat()
    
    return apps

def get_all_applications(limit: int = 1000) -> List[Dict[str, Any]]:
    """Get all applications (for dashboard/analytics)"""
    if db is None:
        return []
    
    apps = list(db["applications"].find().sort("created_at", -1).limit(limit))
    
    for app in apps:
        app["_id"] = str(app["_id"])
        app["created_at"] = app["created_at"].isoformat()
    
    return apps

# ========== FEEDBACK ==========

def save_feedback(user_email: str, application_id: str, field: str, comment: str) -> str:
    """Save a user bias/error feedback report."""
    if db is None:
        return "in-memory"
    record = {
        "user_email": user_email,
        "application_id": application_id,
        "field": field,
        "comment": comment,
        "created_at": datetime.utcnow(),
    }
    result = db["feedback"].insert_one(record)
    return str(result.inserted_id)


# ========== AUDIT RESULTS ==========

def save_audit_result(audit_data: Dict[str, Any]) -> str:
    """Save fairness audit results"""
    if db is None:
        return "in-memory"
    
    audit_record = {
        **audit_data,
        "timestamp": datetime.utcnow(),
    }
    result = db["audit_results"].insert_one(audit_record)
    return str(result.inserted_id)

def get_latest_audit() -> Optional[Dict[str, Any]]:
    """Get the most recent audit results"""
    if db is None:
        return None
    
    audit = db["audit_results"].find_one(sort=[("timestamp", -1)])
    if audit:
        audit["_id"] = str(audit["_id"])
        audit["timestamp"] = audit["timestamp"].isoformat()
    
    return audit

def get_audit_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Get audit history"""
    if db is None:
        return []
    
    audits = list(db["audit_results"].find().sort("timestamp", -1).limit(limit))
    
    for audit in audits:
        audit["_id"] = str(audit["_id"])
        audit["timestamp"] = audit["timestamp"].isoformat()
    
    return audits
