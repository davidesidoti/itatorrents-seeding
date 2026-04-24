"""Quick upload (UploadModal flow) — wraps unit3dup without the full wizard.

Takes a path + mode (u|f|scan), invokes unit3dup directly, streams logs via SSE.
No audio check, no hardlink: for power users who already staged files in
their seeding path. DB record is created on start; exit code updated on done.
"""
from __future__ import annotations

import asyncio
import json
import secrets
import time
from pathlib import Path
from typing import Any, AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from ...i18n import get_request_lang, t
from ...upload import stream_unit3dup
from ..db import record_upload, update_exit_code
from ..logbuf import emit as log_emit
from ..logclass import classify as classify_unit3dup

router = APIRouter(prefix="/api", tags=["quickupload"])

_jobs: dict[str, dict[str, Any]] = {}
_created: dict[str, float] = {}
_TTL = 3600


def _cleanup():
    now = time.time()
    for j in [j for j, ct in _created.items() if now - ct > _TTL]:
        _jobs.pop(j, None)
        _created.pop(j, None)


class QuickBody(BaseModel):
    path: str
    mode: str = "u"            # u|f|scan
    tracker: str = "ITT"
    tmdb_id: str = ""
    skip_tmdb: bool = False
    skip_youtube: bool = False
    anon: bool = False
    webp: bool = False
    screenshots: bool = True


@router.post("/upload/quick")
async def create(request: Request, body: QuickBody):
    lang = get_request_lang(request)
    p = Path(body.path).resolve()
    if not p.exists():
        raise HTTPException(404, t("err.path_not_found", lang))
    if body.mode not in {"u", "f", "scan"}:
        raise HTTPException(400, t("err.invalid_mode", lang))
    args = ["-b"]
    flag = {"u": "-u", "f": "-f", "scan": "-scan"}[body.mode]
    args += [flag, str(p)]
    _cleanup()
    job_id = secrets.token_urlsafe(16)
    _jobs[job_id] = {"args": args, "path": str(p), "tmdb_id": body.tmdb_id}
    _created[job_id] = time.time()
    return JSONResponse({"job": job_id})


@router.get("/upload/{job}/stream")
async def stream(request: Request, job: str):
    state = _jobs.get(job)
    if state is None:
        raise HTTPException(404, t("err.job_not_found", get_request_lang(request)))
    args: list[str] = state["args"]
    tmdb_id: str = state.get("tmdb_id", "")
    q: asyncio.Queue = asyncio.Queue()
    state["stdin_queue"] = q

    async def gen() -> AsyncGenerator[dict, None]:
        async for ev in stream_unit3dup(args, input_queue=q, tmdb_id=tmdb_id):
            et = ev["type"]
            if et == "log":
                kind, event = classify_unit3dup(ev["data"])
                log_emit(kind, ev["data"], "unit3dup", source="unit3dup", event=event)
                yield {"event": "log", "data": ev["data"]}
            elif et == "progress":
                yield {"event": "progress", "data": ev["data"]}
            elif et == "input_needed":
                yield {
                    "event": "input_needed",
                    "data": json.dumps({"text": ev["data"], "kind": ev.get("kind", "tmdb")}),
                }
            elif et == "error":
                log_emit("error", ev["data"], "unit3dup")
                yield {"event": "error", "data": ev["data"]}
            elif et == "done":
                code = ev.get("exit_code", -1)
                state["exit_code"] = code
                state.pop("stdin_queue", None)
                await update_exit_code(state["path"], code)
                log_emit(
                    "ok" if code == 0 else "error",
                    f"unit3dup exit {code}", "quickupload",
                )
                yield {"event": "done", "data": json.dumps({"exit_code": code})}

    return EventSourceResponse(gen())


class StdinBody(BaseModel):
    value: str = "0"


@router.post("/upload/{job}/stdin")
async def stdin(request: Request, job: str, body: StdinBody):
    lang = get_request_lang(request)
    state = _jobs.get(job)
    if state is None:
        raise HTTPException(404, t("err.job_not_found", lang))
    q: asyncio.Queue | None = state.get("stdin_queue")
    if q is None:
        raise HTTPException(400, t("err.no_active_process", lang))
    await q.put((body.value or "0").strip() or "0")
    return JSONResponse({"ok": True})
