# itatorrents-seeding

CLI + Web UI per preparare upload su ItaTorrents:
- verifica tracce audio italiane
- rinomina secondo nomenclatura ItaTorrents
- crea hardlink in `~/seedings`
- avvia upload con `unit3dup`

## Cosa fa

- Supporta film, episodi singoli e serie
- Usa TMDB per titolo/anno ufficiali (con ID manuale o ricerca da web UI)
- Tiene storico upload in file JSON (no sqlite)
- Espone interfaccia web FastAPI + Jinja2 + SSE

## Requisiti

- Python 3.10+
- `unit3dup` disponibile nel PATH
- media organizzati sotto `~/media/{movies,series,anime}`
- hardlink possibili tra sorgente media e `~/seedings` (stesso filesystem)

## Installazione

```bash
pip install -e .
```

Per generare hash password e secret:

```bash
python generate_hash.py
```

## Uso CLI

Film/episodio singolo:

```bash
itatorrents -u /path/al/file.mkv
```

Serie/cartella:

```bash
itatorrents -f /path/alla/cartella
```

Mappatura upload:
- `movie` e `episode` -> `unit3dup -u`
- `series` -> `unit3dup -f`

## Uso Web

Avvio server:

```bash
itatorrents-web
```

Default bind:
- host `127.0.0.1`
- porta `8765`

## Variabili ambiente

Minime per uso web:

- `ITA_PASSWORD_HASH` (obbligatoria)
- `ITA_SECRET` (obbligatoria)
- `ITA_PORT` (obbligatoria)

Opzionali utili:

- `TMDB_API_KEY` (ricerca/metadati TMDB)
- `ITA_HOST` (default `127.0.0.1`)
- `ITA_ROOT_PATH` (se app dietro sottopercorso nginx)
- `ITA_HTTPS_ONLY=1` (cookie session sicuri)
- `ITA_TMDB_LANG` (default `it-IT`)
- `ITA_DB_PATH`, `ITA_TMDB_CACHE_PATH`, `ITA_LANG_CACHE_PATH` (override path cache/db)

## Nomenclatura

Regole naming ItaTorrents in:

- `itatorrents-nomenclatura.md`

## Verifica rapida dopo modifiche

Controllo Python:

```bash
python -m compileall itatorrents
```

Controllo parsing template Jinja:

```bash
python -c "from pathlib import Path; from itatorrents.web.templates_env import templates; base=Path('itatorrents/web/templates'); [templates.get_template(str(p.relative_to(base)).replace('\\\\','/')) for p in base.rglob('*.html')]; print('ok')"
```
