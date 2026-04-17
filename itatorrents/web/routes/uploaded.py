"""Caricati — seedings tracker."""
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ...media import scan_seedings
from ..db import list_uploads

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


@router.get("/uploaded", response_class=HTMLResponse)
async def uploaded_page(request: Request):
    seedings = scan_seedings()
    db_records = await list_uploads()
    db_by_path = {r["seeding_path"]: r for r in db_records}

    items = []
    seeding_paths_on_fs = set()
    for p in seedings:
        key = str(p)
        seeding_paths_on_fs.add(key)
        record = db_by_path.get(key)
        items.append({
            "path": p,
            "name": p.name,
            "is_dir": p.is_dir(),
            "title": record["title"] if record else "",
            "year": record["year"] if record else "",
            "category": record["category"] if record else "",
            "kind": record["kind"] if record else "",
            "uploaded_at": record["uploaded_at"] if record else "",
            "exit_code": record["unit3dup_exit_code"] if record else None,
            "in_db": record is not None,
        })

    # DB records whose file is gone
    orphaned = [
        r for r in db_records
        if r["seeding_path"] not in seeding_paths_on_fs
    ]

    return templates.TemplateResponse("uploaded.html", {
        "request": request,
        "items": items,
        "orphaned": orphaned,
        "active": "uploaded",
    })
