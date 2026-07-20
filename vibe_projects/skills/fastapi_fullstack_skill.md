# FastAPI Beginner Project Initialization

## Metadata

ID: fastapi.beginner.init

Description:
Initialize a minimal FastAPI full-stack web application for beginners. Generate only the project foundation. Do not create business-specific code until explicitly requested.

---

## Triggers

- Create FastAPI project
- Initialize FastAPI app
- New FastAPI web app
- Start FastAPI project
- Create full-stack project

---

## Instructions

### Step 1. Generate Project Structure

Always create this structure:

```
project/
│
├── app.py
├── database.py
├── requirements.txt
├── .env.example
├── README.md
│
├── templates/
│   └── index.html
│
└── static/
    └── style.css
```

Do not create additional folders or files unless requested.

---

### Step 2. Framework

Use:

- FastAPI
- Jinja2
- SQLAlchemy
- psycopg
- python-dotenv

Do not use:

- React
- Vue
- Angular
- Tailwind CSS
- Bootstrap (unless requested)

---

### Step 3. Application

Generate a working application that:

- Starts successfully with Uvicorn.
- Displays a simple "Hello World" or welcome page.
- Uses one HTML template.
- Uses one external CSS file.
- Includes comments suitable for beginners.

---

### Step 4. Database

Configure PostgreSQL for future use.

Generate only:

- Database connection configuration
- Environment variable loading
- SQLAlchemy engine and session setup

Do NOT generate:

- Database tables
- SQL scripts
- SQLAlchemy models
- Pydantic schemas
- CRUD functions
- Seed data
- Sample business entities (Contacts, Products, Orders, etc.)

Wait until the user explicitly requests a business domain before generating any database objects.

---

### Step 5. Code Style

Keep the code simple and educational.

- Use descriptive variable names.
- Add beginner-friendly comments.
- Keep each file concise.
- Avoid unnecessary abstractions.

---

### Step 6. User Interface

Create a clean interface with:

- White background
- Centered content
- Responsive layout
- One heading
- One short welcome message

No navigation menu unless requested.

---

### Step 7. README

Include:

- Project overview
- Folder structure
- Required software
- Installation steps
- Environment variable setup
- How to run the application
- Brief explanation of each file

---

## Future Expansion Rules

Only generate the following after the user explicitly requests them:

- Database tables
- SQLAlchemy models
- Pydantic schemas
- CRUD operations
- Forms
- Authentication
- Business logic
- Additional pages
- REST APIs
- Admin features

Never invent a business domain. Wait for the user's instruction.