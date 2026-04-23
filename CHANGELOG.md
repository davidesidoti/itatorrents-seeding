# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Sistema di versionamento app: polling ogni 15 min su `/api/version/info` che confronta versione installata con GitHub Releases (app) e PyPI (unit3dup)
- Banner "Update available" in basso a sinistra nella Sidebar, sopra la lista tracker, con bottone separato per app e unit3dup
- Update unit3dup via SSE stream (`pip install --upgrade unit3dup`) con log live nel modal
- Update app via SSE stream con pre-check systemd + restart detached via `systemctl --user restart`
- Supporto a entrambe le modalità di installazione per l'update app: **git checkout** (`git pull` + `pip install -e .`) e **pip-from-git** (`pip install --upgrade --force-reinstall git+URL@vX`) — rilevate automaticamente dalla presenza di `.git` nella repo root
- Countdown "Refresh automatico in 5…1" dopo update completato con reload automatico
- Modal changelog post-reload: mostra release body da GitHub per la versione appena installata
- Versione app nella Sidebar (header) ora letta dinamicamente dall'API invece di essere hardcoded
- Endpoint `GET /api/version/changelog?v=X` per ottenere il body Markdown di una release GitHub
- Auto-detect systemd: update app disabilitato automaticamente se il systemd user unit non è disponibile (dev locale)

### Fixed
- Check systemd troppo stretto: `systemctl --user is-enabled` restituisce rc≠0 per unit in stato `linked` (symlink, molto comune su Ultra.cc) o `static` → pulsante "Update app" erroneamente disabilitato. Passato a `systemctl --user cat UNIT` che ritorna 0 iff il file unit esiste, indipendentemente dallo stato di abilitazione.

---

## [0.3.0] - 2026-04-23

### Added
- Web UI React SPA (Vite + TypeScript) con FastAPI backend, servita via systemd user service su Ultra.cc
- Wizard multi-step: audio check → TMDB lookup → rinomina → hardlink → unit3dup PTY stream
- Quick Upload modal per power users (senza wizard)
- Libreria media con categorie dinamiche da `W_MEDIA_ROOT`
- Queue torrent via qBittorrent client con filtro per nome
- Upload History con stati e exit code
- Logs tab con filtri source/kind persistiti in localStorage; classificazione automatica log unit3dup
- Settings runtime `ITA_*` / `W_*` via env o `Unit3Dbot.json` (no restart necessario)
- Auth con sessione + bcrypt; OpenAPI/Swagger protetto
- Mobile responsive: sidebar drawer, overlay panel dettaglio, layout a 1 colonna
- Runtime-configurable media root e seedings dir
- Documentazione MkDocs su GitHub Pages
- Check compatibilità filesystem per hardlink
- Tracker sidebar con badge Online/Offline/Not set (inclusi tracker non configurati)
