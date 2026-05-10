from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import user_router, home_router
from prometheus_fastapi_instrumentator import Instrumentator
from motor.motor_asyncio import AsyncIOMotorClient
from telemetry import setup_telemetry

app = FastAPI(title="FastAPI MVC MongoDB Project")

setup_telemetry(app)
Instrumentator().instrument(app).expose(app)    #middleware of prometheus to create the GET endpoint /metrics

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow everything
    allow_methods=["*"],
    allow_headers=["*"],
)
##### config Promtail
import logging
import os
# 1. Define the exact path you put in your Promtail yaml
LOG_FILE_PATH = "/Users/sangdo/Documents/tmp/promtail/fastapi_app.log"
# 2. Ensure the directory exists (to avoid errors)
os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
# 3. Setup the logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH), # Writes to the file for Promtail
        logging.StreamHandler()            # Still prints to terminal for you
    ]
)

logger = logging.getLogger("fastapi-server")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(user_router.router)
app.include_router(home_router.router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
async def root():
    logger.info(f"Beginning of the homepage")
    return {"message": "Welcome to the FastAPI MVC MongoDB Project"}
