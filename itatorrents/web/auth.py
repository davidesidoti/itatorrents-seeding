"""Auth helpers: bcrypt password check, session management."""
import os

import bcrypt
from fastapi import Request
from starlette.responses import RedirectResponse

PASSWORD_HASH = os.environ.get("ITA_PASSWORD_HASH", "")
SECRET_KEY = os.environ.get("ITA_SECRET", "changeme-set-ITA_SECRET")
SESSION_ID_KEY = "session_id"
AUTH_KEY = "authenticated"


def verify_password(plain: str) -> bool:
    if not PASSWORD_HASH:
        return False
    try:
        return bcrypt.checkpw(plain.encode(), PASSWORD_HASH.encode())
    except Exception:
        return False


def login_session(request: Request, session_id: str):
    request.session[AUTH_KEY] = True
    request.session[SESSION_ID_KEY] = session_id


def logout_session(request: Request):
    request.session.clear()


def is_authenticated(request: Request) -> bool:
    return bool(request.session.get(AUTH_KEY))


def get_session_id(request: Request) -> str:
    return request.session.get(SESSION_ID_KEY, "")


def redirect_to_login(next_url: str = "/") -> RedirectResponse:
    return RedirectResponse(f"/login?next={next_url}", status_code=303)
