from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_instance = Database()


async def connect_db():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=10000,  # 10 second timeout
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
    )
    db_instance.db = db_instance.client[settings.DATABASE_NAME]

    # Test connection without blocking too long
    try:
        await db_instance.client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB ping failed: {e} — continuing anyway")

    # Create indexes in background
    try:
        await create_indexes()
    except Exception as e:
        logger.warning(f"Index creation failed: {e} — continuing")


async def close_db():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    db = db_instance.db
    await db.metrics.create_index([("service_id", 1), ("timestamp", -1)])
    await db.metrics.create_index([("timestamp", -1)])
    await db.logs.create_index([("service_id", 1), ("timestamp", -1)])
    await db.logs.create_index([("level", 1), ("timestamp", -1)])
    await db.logs.create_index([("timestamp", -1)])
    await db.services.create_index([("team_id", 1)])
    await db.incidents.create_index([("status", 1)])
    logger.info("Database indexes created")


def get_db():
    return db_instance.db
