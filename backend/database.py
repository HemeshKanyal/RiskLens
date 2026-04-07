from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
# Create a global client instance
client = None

async def connect_to_mongo():
    global client
    client = AsyncIOMotorClient(MONGODB_URL)
    print(f"✅ Connected to MongoDB at {MONGODB_URL}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ Closed MongoDB connection")

def get_db():
    # Returns the RiskLens database instance
    return client["risklens"]

def get_users_collection():
    return get_db()["users"]

def get_portfolios_collection():
    return get_db()["portfolios"]
