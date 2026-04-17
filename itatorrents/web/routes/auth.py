"""Login / logout routes."""
import secrets

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from ..auth import login_session, logout_session, verify_password

router = APIRouter()
templates = Jinja2Templates(directory=str(__import__("pathlib").Path(__file__).parent.parent / "templates"))


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, next: str = "/"):
    return templates.TemplateResponse("login.html", {"request": request, "next": next, "error": ""})


@router.post("/login")
async def login_submit(
    request: Request,
    password: str = Form(...),
    next: str = Form("/"),
):
    if verify_password(password):
        login_session(request, secrets.token_urlsafe(16))
        return RedirectResponse(next or "/", status_code=303)
    return templates.TemplateResponse(
        "login.html",
        {"request": request, "next": next, "error": "Password errata."},
        status_code=401,
    )


@router.post("/logout")
async def logout(request: Request):
    logout_session(request)
    return RedirectResponse("/login", status_code=303)
