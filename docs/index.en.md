# itatorrents-seeding

**Web UI + CLI to prepare and automate uploads to [ItaTorrents.xyz](https://itatorrents.xyz).**

Checks for Italian audio tracks, renames files according to the ItaTorrents naming convention, hardlinks them into `~/seedings/`, and launches `unit3dup` to perform the upload. Works from a terminal or from a browser.

!!! tip "Two usage modes"
    - **CLI** — interactive flow for a single file or an entire season. Ideal over SSH.
    - **Web UI** — React SPA served by FastAPI. Guided wizard, upload queue, history, settings, real-time logs.

---

## What it does

1. **Scans** your library (`~/media/{movies,series,anime}` or custom folders).
2. **Checks** for Italian audio tracks via `pymediainfo`.
3. **Fetches** official metadata from TMDB (by manual ID or via search).
4. **Builds** the final filename per the [ItaTorrents naming convention](nomenclatura.md).
5. **Hardlinks** the renamed file into `~/seedings/` (same filesystem required).
6. **Launches** `unit3dup -b -u` or `unit3dup -b -f` to upload it.
7. **Records** the exit code into the history (JSON) and exposes it in the Web UI.

---

## Quick start

```bash
# 1. Install the package
pip install -e .

# 2. Generate password hash + session secret
python generate_hash.py

# 3. Export the variables (or put them into ~/.bashrc)
export ITA_PASSWORD_HASH="..."
export ITA_SECRET="..."
export TMDB_API_KEY="..."
export ITA_PORT="8765"

# 4. Start the Web UI
itatorrents-web
```

Open <http://127.0.0.1:8765> and enter the password.

For full details see [Installation](installazione.md) and [Configuration](configurazione.md).

---

## Deployment guides

- [**VPS with sudo / Docker**](deploy-vps.md) — generic Linux server using systemd, nginx + Let's Encrypt.
- [**Ultra.cc**](deploy-ultracc.md) — Ultra.cc seedbox with reserved port, user-level systemd unit, and nginx user-proxy.

---

## Tech stack

| Component | Technology |
|---|---|
| Backend | FastAPI + uvicorn + Starlette |
| SSE | sse-starlette |
| Auth | bcrypt + itsdangerous (session cookies) |
| Frontend | React 18 + Vite + TypeScript + lucide-react |
| Filename parsing | guessit |
| MediaInfo | pymediainfo (requires `libmediainfo`) |
| Metadata | TMDB API v3 |
| Upload | `unit3dup` (external CLI) |
| Persistence | JSON files (no SQLite — `_sqlite3` broken on pyenv Python 3.13) |

---

## Useful links

- Repo: <https://github.com/davidesidoti/itatorrents-seeding>
- ItaTorrents: <https://itatorrents.xyz>
- TMDB API: <https://www.themoviedb.org/settings/api>
- `unit3dup`: <https://pypi.org/project/unit3dup/>
