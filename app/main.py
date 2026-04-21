from fastapi import FastAPI
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import user_router

app = FastAPI(title="FastAPI MVC MongoDB Project")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(user_router.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI MVC MongoDB Project"}
