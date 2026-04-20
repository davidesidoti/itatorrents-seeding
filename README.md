# itatorrents-seeding

Web UI + CLI per preparare e automatizzare upload su [ItaTorrents.xyz](https://itatorrents.xyz).
Verifica tracce audio italiane, rinomina secondo la nomenclatura ItaTorrents, crea hardlink in `~/seedings/` e lancia `unit3dup` per l'upload.

**Documentazione completa → <https://davidesidoti.github.io/itatorrents-seeding/>**

---

## Quick start

```bash
pip install -e .
python generate_hash.py      # genera ITA_PASSWORD_HASH + ITA_SECRET
itatorrents-web              # avvia la Web UI
```

Variabili d'ambiente minime: `ITA_PASSWORD_HASH`, `ITA_SECRET`, `TMDB_API_KEY`, `ITA_PORT`.
Dettagli completi nella [guida Installazione](https://davidesidoti.github.io/itatorrents-seeding/installazione/).

---

## Guide

- [Installazione](https://davidesidoti.github.io/itatorrents-seeding/installazione/)
- [Configurazione](https://davidesidoti.github.io/itatorrents-seeding/configurazione/)
- [Uso › CLI](https://davidesidoti.github.io/itatorrents-seeding/uso-cli/)
- [Uso › Web UI](https://davidesidoti.github.io/itatorrents-seeding/uso-web/)
- [Deploy › VPS (sudo/Docker)](https://davidesidoti.github.io/itatorrents-seeding/deploy-vps/)
- [Deploy › Ultra.cc](https://davidesidoti.github.io/itatorrents-seeding/deploy-ultracc/)
- [Nomenclatura](https://davidesidoti.github.io/itatorrents-seeding/nomenclatura/)
- [Troubleshooting](https://davidesidoti.github.io/itatorrents-seeding/troubleshooting/)

English mirror: aggiungi `/en/` al path (es. `/en/installation/`).

---

## Documentazione locale

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

Poi apri <http://127.0.0.1:8000>.

---

## Link

- Repo: <https://github.com/davidesidoti/itatorrents-seeding>
- Tracker: <https://itatorrents.xyz>
- Nomenclatura (legacy markdown): [`itatorrents-nomenclatura.md`](itatorrents-nomenclatura.md)
