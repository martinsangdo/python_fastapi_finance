# FastAPI Starter

A minimal full-stack web application built with FastAPI, Jinja2 templates, and
plain HTML/CSS. PostgreSQL (Supabase compatible) is configured and ready, but no
tables, models, or business logic exist yet — that comes later.

## Folder structure

```
fastapi_template/
│
├── app.py              # The application and its routes
├── database.py         # PostgreSQL connection setup
├── requirements.txt    # Python packages this project needs
├── .env.example        # Template for your own .env file
├── README.md           # This file
│
├── templates/
│   └── index.html      # The welcome page
│
└── static/
    └── style.css       # Page styling
```

## What each file does

| File | Purpose |
| --- | --- |
| `app.py` | Creates the FastAPI app, serves `/static`, and defines the `/` and `/health` routes. |
| `database.py` | Reads `DATABASE_URL` from `.env` and builds the SQLAlchemy engine, session, and `Base` class. Nothing imports it yet. |
| `templates/index.html` | The HTML page. `{{ message }}` is filled in by `app.py`. |
| `static/style.css` | Centered, responsive layout on a white background. |
| `.env.example` | Shows which environment variables you need. Copy it to `.env`. |
| `requirements.txt` | The package list for `pip install`. |

## Required software

- Python 3.10 or newer
- A PostgreSQL database (local, or a free [Supabase](https://supabase.com) project)

## Installation

From inside the project folder:

```bash
# 1. Create a virtual environment (keeps packages separate from your system Python)
python3 -m venv .venv

# 2. Activate it
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# 3. Install the packages
pip install -r requirements.txt
```

## Environment variables

Copy the example file and edit it:

```bash
cp .env.example .env
```

Then set `DATABASE_URL` to your own connection string:

```
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname
```

For Supabase, copy the URI from **Project Settings → Database → Connection
string**, use the **Session pooler** host on port `5432`, and change the
`postgresql://` prefix to `postgresql+psycopg://` so SQLAlchemy uses psycopg 3.

Never commit your real `.env` file — it holds your database password.

## Running the application

```bash
uvicorn app:app --reload
```

Then open <http://127.0.0.1:8000> in your browser. You should see the "Hello,
World!" page.

`--reload` restarts the server automatically whenever you save a file, which is
handy while developing.

Other useful URLs:

- <http://127.0.0.1:8000/health> — returns `{"status": "ok"}`
- <http://127.0.0.1:8000/docs> — auto-generated API documentation

The welcome page works even without a database, because `app.py` does not import
`database.py` yet. The connection is only used once you start adding tables.

## Next steps

When you are ready to add a real feature, ask for it explicitly — for example
models, forms, or CRUD pages. Nothing business-specific is generated up front.
