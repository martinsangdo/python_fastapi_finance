from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/home")
templates = Jinja2Templates(directory="app/templates")

@router.get("/csv")
async def show_csv(request: Request):
    return templates.TemplateResponse("csv_analysis.html", {"request": request})
