"""Database connection setup.

This file only prepares the connection to PostgreSQL.
It does NOT create any tables or models yet.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Read the .env file and load its values into the environment.
load_dotenv()

# The connection string, for example:
# postgresql+psycopg://user:password@host:5432/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing. Copy .env.example to .env and fill it in."
    )

# The engine manages the actual connections to PostgreSQL.
# pool_pre_ping=True checks a connection is still alive before using it,
# which matters for hosted databases like Supabase that close idle connections.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# A session is one "conversation" with the database.
# SessionLocal() creates a new session whenever we need one.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Future SQLAlchemy models will inherit from this class.
Base = declarative_base()


def get_db():
    """Give a database session to a route, then close it when the route ends.

    Use it later like this:

        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
