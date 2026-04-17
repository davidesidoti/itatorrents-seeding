"""SQLite upload history via aiosqlite."""
import os
from pathlib import Path

import aiosqlite

DB_PATH = Path(os.environ.get("ITA_DB_PATH", str(Path.home() / ".itatorrents.db")))

CREATE_SQL = """
CREATE TABLE IF NOT EXISTS uploads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category        TEXT NOT NULL,
    kind            TEXT NOT NULL,
    source_path     TEXT NOT NULL,
    seeding_path    TEXT NOT NULL UNIQUE,
    tmdb_id         TEXT,
    title           TEXT,
    year            TEXT,
    final_name      TEXT,
    uploaded_at     TEXT NOT NULL DEFAULT (datetime('now')),
    unit3dup_exit_code INTEGER
);
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_SQL)
        await db.commit()


async def record_upload(
    *,
    category: str,
    kind: str,
    source_path: str,
    seeding_path: str,
    tmdb_id: str = "",
    title: str = "",
    year: str = "",
    final_name: str = "",
    exit_code: int | None = None,
):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO uploads
                (category, kind, source_path, seeding_path, tmdb_id,
                 title, year, final_name, unit3dup_exit_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(seeding_path) DO UPDATE SET
                unit3dup_exit_code = excluded.unit3dup_exit_code,
                uploaded_at = datetime('now')
            """,
            (category, kind, source_path, seeding_path,
             tmdb_id, title, year, final_name, exit_code),
        )
        await db.commit()


async def update_exit_code(seeding_path: str, exit_code: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE uploads SET unit3dup_exit_code = ? WHERE seeding_path = ?",
            (exit_code, seeding_path),
        )
        await db.commit()


async def list_uploads() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM uploads ORDER BY uploaded_at DESC"
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def get_upload_by_seeding_path(seeding_path: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM uploads WHERE seeding_path = ?", (seeding_path,)
        ) as cur:
            row = await cur.fetchone()
    return dict(row) if row else None
