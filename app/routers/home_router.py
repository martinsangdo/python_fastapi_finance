from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from app.services.user_service import user_service

router = APIRouter(prefix="/home")
templates = Jinja2Templates(directory="app/templates")

@router.get("/csv")
async def show_csv(request: Request):
    content = {"request": request}
    content['username'] = "Diego Maradona"
    users = await user_service.get_all_users()
    content['user_list'] = users
    return templates.TemplateResponse("csv_analysis.html", content)
