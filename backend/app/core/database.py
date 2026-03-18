from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db = None


# Global db instance
db_instance = Database()


async def connect_db():
    """Called on app startup — creates the Motor client."""
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]

    # Create indexes for performance
    await create_indexes()
    logger.info(f"Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_db():
    """Called on app shutdown — closes the Motor client."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create MongoDB indexes for fast queries."""
    db = db_instance.db

    # Metrics — most queried by service_id + timestamp
    await db.metrics.create_index([("service_id", 1), ("timestamp", -1)])
    await db.metrics.create_index([("timestamp", -1)])

    # Logs — queried by service + level + timestamp
    await db.logs.create_index([("service_id", 1), ("timestamp", -1)])
    await db.logs.create_index([("level", 1), ("timestamp", -1)])
    await db.logs.create_index([("timestamp", -1)])

    # Services — queried by team
    await db.services.create_index([("team_id", 1)])

    # Incidents — queried by status + service
    await db.incidents.create_index([("status", 1)])
    await db.incidents.create_index([("service_id", 1)])

    logger.info("Database indexes created")


def get_db():
    """Dependency injected into FastAPI route handlers."""
    return db_instance.db
