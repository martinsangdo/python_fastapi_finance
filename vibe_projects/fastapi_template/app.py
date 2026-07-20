"""Main application file.

This is the entry point of the web app. Run it with:

    uvicorn app:app --reload
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Create the FastAPI application.
# The title shows up in the auto-generated API docs at http://127.0.0.1:8000/docs
app = FastAPI(title="FastAPI Starter")

# Make everything inside the "static" folder available under the /static URL.
# Example: static/style.css  ->  http://127.0.0.1:8000/static/style.css
app.mount("/static", StaticFiles(directory="static"), name="static")

# Tell Jinja2 where the HTML files live.
templates = Jinja2Templates(directory="templates")


@app.get("/")
def home(request: Request):
    """Show the welcome page.

    FastAPI gives us the `request` object, and Jinja2 needs it to build URLs
    (for example the link to our CSS file inside index.html).
    """
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"message": "Your FastAPI app is running."},
    )


@app.get("/health")
def health():
    """A tiny endpoint you can call to check the app is alive."""
    return {"status": "ok"}
