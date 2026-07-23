# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Setup (the default `python3` on this machine cannot create venvs — use `python3.13`):

```bash
python3.13 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

Run the dev server (or use the `fastapi-dev` config in `.claude/launch.json` via the preview tools — never `uvicorn` under Bash):

```bash
uvicorn app:app --reload
```

`cp .env.example .env` and set `DATABASE_URL` before starting: `database.py` raises at import time if it is missing, and `app.py` imports it, so the app will not boot without a reachable Postgres.

There is no test suite, linter, or migration tool configured. Verify changes by hitting `/health`, `/docs`, and the affected route in the browser preview.

## Architecture

Four modules, flat, no packages:

- `database.py` — reads `DATABASE_URL`, builds the SQLAlchemy `engine`, `SessionLocal`, and `Base`. Exposes `get_db()`, the only way routes should obtain a session (`db: Session = Depends(get_db)`).
- `models.py` — `Product` and `Category` map to **pre-existing** tables. The app is read-only against the database: nothing calls `Base.metadata.create_all()`, and there are no migrations. Changing a model means the real table must already match. Each mapped class needs a `primary_key` column even if the real table's key is named differently — fix the column name in `models.py` rather than working around it.
- `app.py` — the FastAPI app, CORS, `/static` mount, Jinja2 setup, and every route. Routes live here; there is no router split.
- `templates/` + `static/` — server-rendered Jinja2. `templates/index.html` and `products.html` use `static/style.css`; `templates/homepage.html` (generated from a Figma design) uses its own `static/homepage.css` and does not share the base stylesheet.

Two consumers, two response shapes:

- HTML routes (`/`, `/homepage`, `/products`) return `templates.TemplateResponse(request=request, name=..., context=...)` — the FastAPI style where `request` is a named argument, not the first positional one.
- `/api/products` serves the sibling `../fe_ecommerce` front end and returns `ProductOut`, a Pydantic model declared in `app.py` with `from_attributes=True`. It is a deliberate allowlist: adding a column to `Product` does not publish it. `price` is declared `float` so the `Numeric` column serialises as a JSON number rather than a quoted `Decimal`.

Because `fe_ecommerce` is served on its own port, `app.py` adds `CORSMiddleware` with an explicit origin list (currently `localhost:8001` / `127.0.0.1:8001`, `GET` only). Serving that front end elsewhere means adding the origin — do not replace the list with `"*"`. The README's mention of port 5500 is stale; the code is the source of truth.

When a template needs a related row, eager-load it (`joinedload(Product.category)` in `/products`) — the templates read `product.category.name`, which otherwise fires one query per row.

## Style

The existing code is written for a beginner audience: docstrings on every route and module, and comments that explain *why* a line exists. Match that density when adding code here — it is intentional, not leftover scaffolding.
