from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import user_router, home_router
from prometheus_fastapi_instrumentator import Instrumentator
from motor.motor_asyncio import AsyncIOMotorClient
from telemetry import setup_telemetry

app = FastAPI(title="FastAPI MVC MongoDB Project")

setup_telemetry(app)
Instrumentator().instrument(app).expose(app)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow everything
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {"message": "Welcome to the FastAPI MVC MongoDB Project"}
