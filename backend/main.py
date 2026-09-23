import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from config import settings
from database import engine, Base, SessionLocal
import models
import sockets
from generate import live_loop
from seed import seed_database

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cat_main")

# Import all API routers
from routers import (
    auth, operators, machines, zones, shifts, tasks,
    weather, alerts, incidents, copilot, eta, training,
    performance, reports, admin, admin_api
)

simulator_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing CAT Safety Copilot backend...")
    
    # Check if database has machines; if not, auto-seed!
    # Wait for tables to be created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        m_count = db.query(models.Machine).count()
        if m_count == 0:
            logger.info("No machines found. Running initial database seed...")
            seed_database()
        else:
            logger.info(f"Database ready with {m_count} registered machines.")
            
        # Add new columns to avoid sqlite OperationalError for existing rows
        try:
            db.execute("ALTER TABLE operators ADD COLUMN employee_id VARCHAR(50);")
            db.execute("ALTER TABLE operators ADD COLUMN license_type VARCHAR(50);")
            db.execute("ALTER TABLE operators ADD COLUMN status VARCHAR(50) DEFAULT 'active';")
            db.execute("ALTER TABLE machines ADD COLUMN created_at DATETIME;")
            db.commit()
            logger.info("Added new columns to existing schema")
        except Exception:
            pass # Columns already exist or error
            
    except Exception as e:
        logger.warning(f"Error checking DB seed status: {e}")
    finally:
        db.close()

    # Start the continuous machine simulator background task (2-second GPS & Telemetry loop)
    global simulator_task
    if settings.SIMULATOR_ENABLED:
        simulator_task = asyncio.create_task(live_loop(speed_multiplier=1.0, scenario_rate=0.35, seed=42))
        logger.info("Continuous Machine Simulator background task started successfully.")

    yield

    # Shutdown actions
    if simulator_task:
        logger.info("Cancelling simulator background task...")
        simulator_task.cancel()
        try:
            await simulator_task
        except asyncio.CancelledError:
            pass
    logger.info("CAT Safety Copilot backend shutdown complete.")

# Initialize FastAPI application
fastapi_app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Closed-loop heavy equipment safety, telemetry sync, and AI copilot platform",
    lifespan=lifespan
)

# CORS configuration
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers under /api or root
api_prefix = settings.API_V1_STR
fastapi_app.include_router(auth.router, prefix=api_prefix)
fastapi_app.include_router(operators.router, prefix=api_prefix)
fastapi_app.include_router(machines.router, prefix=api_prefix)
fastapi_app.include_router(zones.router, prefix=api_prefix)
fastapi_app.include_router(shifts.router, prefix=api_prefix)
fastapi_app.include_router(tasks.router, prefix=api_prefix)
fastapi_app.include_router(weather.router, prefix=api_prefix)
fastapi_app.include_router(alerts.router, prefix=api_prefix)
fastapi_app.include_router(incidents.router, prefix=api_prefix)
fastapi_app.include_router(copilot.router, prefix=api_prefix)
fastapi_app.include_router(eta.router, prefix=api_prefix)
fastapi_app.include_router(training.router, prefix=api_prefix)
fastapi_app.include_router(performance.router, prefix=api_prefix)
fastapi_app.include_router(reports.router, prefix=api_prefix)
fastapi_app.include_router(admin.router, prefix=api_prefix)
fastapi_app.include_router(admin_api.router, prefix=api_prefix)

# Health endpoint
@fastapi_app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "simulator_active": simulator_task is not None and not simulator_task.done()
    }

# Wrap FastAPI with python-socketio ASGI App so Socket.IO and REST share port 8000
app = socketio.ASGIApp(sockets.sio, other_asgi_app=fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
