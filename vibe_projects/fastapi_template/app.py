"""Main application file.

This is the entry point of the web app. Run it with:

    uvicorn app:app --reload
"""

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Product

# Create the FastAPI application.
# The title shows up in the auto-generated API docs at http://127.0.0.1:8000/docs
app = FastAPI(title="FastAPI Starter")

# The fe_ecommerce front end is served from its own port, which makes its
# requests "cross-origin". Browsers block those unless the API says otherwise,
# so list the origins allowed to call us. Keep this an explicit list rather
# than "*" — it is the only thing standing between this API and any website
# the user happens to have open.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_methods=["GET"],
)

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


@app.get("/products")
def list_products(request: Request, db: Session = Depends(get_db)):
    """Show every row from the "products" table.

    `Depends(get_db)` asks FastAPI to open a database session before this
    function runs, and to close it afterwards. We never open it by hand.
    """
    # SELECT * FROM products LEFT JOIN categories ... ORDER BY name
    # joinedload pulls each product's category in the same query, instead of
    # firing one extra query per row when the template reads it.
    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .order_by(Product.name)
        .all()
    )

    return templates.TemplateResponse(
        request=request,
        name="products.html",
        context={"products": products},
    )


class ProductOut(BaseModel):
    """The shape of a product in the JSON API.

    Declaring it explicitly means adding a column to the table does not
    silently start publishing that column, and it shows up in the docs at
    /docs. `from_attributes` lets FastAPI read a SQLAlchemy object directly.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    # The column is Numeric, which Python reads as Decimal. Declaring float
    # here makes it a plain JSON number instead of a quoted string.
    price: float


@app.get("/api/products", response_model=list[ProductOut])
def api_list_products(db: Session = Depends(get_db)):
    """Return every product as JSON, for the fe_ecommerce front end.

    Same query as /products above, but rendered as JSON instead of HTML. The
    category is not joined here because the API response does not include it.
    """
    return db.query(Product).order_by(Product.name).all()


@app.get("/health")
def health():
    """A tiny endpoint you can call to check the app is alive."""
    return {"status": "ok"}
