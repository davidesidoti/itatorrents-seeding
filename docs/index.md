# itatorrents-seeding

**Web UI + CLI per preparare e automatizzare upload su [ItaTorrents.xyz](https://itatorrents.xyz).**

Verifica tracce audio italiane, rinomina i file secondo la nomenclatura ItaTorrents, crea hardlink in `~/seedings/` e lancia `unit3dup` per l'upload finale. Funziona da terminale o da browser.

!!! tip "Due modalità di utilizzo"
    - **CLI** — flusso interattivo per un singolo file o un'intera stagione. Ideale via SSH.
    - **Web UI** — React SPA servita da FastAPI. Wizard guidato, coda upload, storico, settings, log in tempo reale.

---

## Cosa fa

1. **Scansiona** la tua libreria (`~/media/{movies,series,anime}` o cartelle custom).
2. **Verifica** la presenza di tracce audio italiane tramite `pymediainfo`.
3. **Recupera** i metadati ufficiali da TMDB (inserendo l'ID manualmente o via ricerca).
4. **Costruisce** il nome finale secondo la [nomenclatura ItaTorrents](nomenclatura.md).
5. **Hardlinka** il file rinominato in `~/seedings/` (stesso filesystem richiesto).
6. **Lancia** `unit3dup -b -u` o `unit3dup -b -f` per caricarlo sul tracker.
7. **Registra** l'esito nello storico (JSON) e lo espone nella Web UI.

---

## Avvio rapido

```bash
# 1. Installa il pacchetto
pip install -e .

# 2. Genera hash password + secret sessione
python generate_hash.py

# 3. Esporta le variabili (o scrivile in ~/.bashrc)
export ITA_PASSWORD_HASH="..."
export ITA_SECRET="..."
export TMDB_API_KEY="..."
export ITA_PORT="8765"

# 4. Avvia la Web UI
itatorrents-web
```

Apri <http://127.0.0.1:8765> e inserisci la password.

Per i dettagli completi vedi [Installazione](installazione.md) e [Configurazione](configurazione.md).

---

## Guide di deploy

- [**VPS con sudo / Docker**](deploy-vps.md) — server Linux generico con systemd, nginx + Let's Encrypt.
- [**Ultra.cc**](deploy-ultracc.md) — seedbox Ultra.cc con porta riservata, systemd user unit e nginx user-proxy.

---

## Stack tecnico

| Componente | Tecnologia |
|---|---|
| Backend | FastAPI + uvicorn + Starlette |
| SSE | sse-starlette |
| Auth | bcrypt + itsdangerous (cookie sessioni) |
| Frontend | React 18 + Vite + TypeScript + lucide-react |
| Parsing filename | guessit |
| MediaInfo | pymediainfo (richiede `libmediainfo`) |
| Metadata | TMDB API v3 |
| Upload | `unit3dup` (CLI esterna) |
| Persistenza | file JSON (no SQLite — `_sqlite3` rotto su pyenv Python 3.13) |

---

## Link utili

- Repo: <https://github.com/davidesidoti/itatorrents-seeding>
- ItaTorrents: <https://itatorrents.xyz>
- TMDB API: <https://www.themoviedb.org/settings/api>
- `unit3dup`: <https://pypi.org/project/unit3dup/>
