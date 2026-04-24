# Changelog

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/).

## [Unreleased]

---

## [0.6.3] - 2026-04-24

### Changed
- **Media Library — Pannello dettaglio serie: stagioni come accordion + episodi in lista**. Le stagioni ora sono collassabili (prima stagione non caricata aperta di default) e gli episodi, invece che piccoli badge troncati, appaiono in una lista verticale con il numero episodio (`E01`) prima del titolo, pulito da prefisso serie ed etichette di release (`1080p`, codec, gruppo, ecc.). Il nome completo resta leggibile; hover+click sulla riga avvia comunque il wizard upload, il chip "Segna come caricato" funziona senza chiudere la sezione.

### Fixed
- **Media Library: film non nascosto dopo upload con skip duplicato**. Se il record in upload history aveva `source_path` vuoto (per upsert su record stantio), il film restava visibile anche con "nascondi caricati" attivo. Doppia correzione: (1) l'upsert in DB ora aggiorna `source_path` (e altri campi arricchiti) se il nuovo valore è non vuoto; (2) la Media Library usa un fallback inode-based — se un video file dell'item condivide l'inode con un file in seedings nel DB, l'item viene marcato come caricato anche quando `source_path` è vuoto.

---

## [0.6.2] - 2026-04-24

### Fixed
- **Auto-update: versione e bottone "aggiorna" stantii dopo il reload**. Dopo un update riuscito in pip mode, la TopBar continuava a mostrare la versione precedente e il bottone restava visibile finché l'utente non cliccava di nuovo. Causa: cache in-memory di `/api/version/info` (TTL 10 min) non invalidata dopo `_update_app_from_pip`/`_update_app_from_git`, combinata con il race tra restart systemd e reload frontend. Ora la cache viene azzerata a fine install (entrambi i path) e il frontend forza un `POST /api/version/refresh` al primo fetch dopo un reload post-update (quando presente `unit3dprep.pendingChangelog`).

### Changed
- Documentazione (`uso-web.md` IT+EN): aggiunte sezioni per UI bilingue IT/EN (v0.6.0) e selezione multipla / bulk mark-uploaded in Media Library (v0.6.1). README aggiornato con menzione lingua. Descrizione GitHub aggiornata per riflettere supporto multi-tracker Unit3D.

---

## [0.6.1] - 2026-04-24

### Added
- **Media Library — Selezione multipla per marcare film come caricati manualmente**: il pulsante "Selezione multipla" appare nella toolbar della Libreria quando almeno un film non ancora caricato è visibile (qualsiasi categoria, incluse quelle miste come `anime` con serie + film). In modalità bulk **solo i file singoli (`kind === 'movie'`) sono selezionabili** — le serie restano visibili ma disabilitate. Action bar con "Seleziona tutti / Deseleziona / Segna come caricati" e feedback `Marcati X/Y`.

---

## [0.6.0] - 2026-04-24

### Added
- **Supporto multilingua UI (IT / EN)**: switcher rapido `IT|EN` nella topbar (sempre visibile) e nuova sezione **Interface** in Impostazioni. La preferenza è persistita in `Unit3Dbot.json` (`U3DP_LANG`) e in `localStorage` (`u3d_lang`), sopravvive a refresh e restart del service.
- **API backend localizzata**: i messaggi d'errore delle route `/api/*` ora rispettano la lingua della richiesta. Il frontend invia l'header `X-U3DP-Lang: it|en` su ogni chiamata; il backend, in assenza di header, ricade sul setting runtime `U3DP_LANG` (default `it`).
- Tutte le viste e i modali ora completamente tradotti: Libreria Media, Coda Torrent, Cronologia Upload, Ricerca, Upload Rapido (UploadModal), Log, Impostazioni (nav sezioni + pulsanti salva), Wizard upload (tutti e 5 gli step), tutte le descrizioni e i toggle delle sezioni Impostazioni.

### Changed
- Default lingua: **italiano** (invariato per gli utenti esistenti). Nuove installazioni partono in IT; lo switch a EN è manuale dalla UI.

---

## [0.5.1] - 2026-04-24

### Added
- **Media Library — Mark as uploaded manually per le serie**: il pulsante, finora presente solo per i film, è ora disponibile a tre livelli per le serie TV — intera serie (detail panel), singola stagione (accanto a "Bulk upload season") e singolo episodio (mini chip `✓` accanto a ogni episodio). Utile per ripulire la libreria da contenuti già caricati fuori dall'app.

### Fixed
- `GET /api/version/info` ora segue i redirect di GitHub: quando un repo viene rinominato, `latest` non è più `null` (polling trasparente verso il nuovo slug).
- Marcare un'intera serie come caricata manualmente ora propaga correttamente lo stato a tutte le stagioni: la serie viene filtrata da "Hide already uploaded" e mostra il badge uploaded, non solo nella Upload History.

---

## [0.5.0] - 2026-04-23

Release di rebranding. Il progetto cambia nome da `itatorrents` a **`unit3dprep`** per riflettere il supporto multi-tracker Unit3D (non più solo ItaTorrents). Pairing esplicito con `unit3dup`. Nessun intervento manuale richiesto per gli utenti esistenti: env vars legacy, dotfile e chiavi di configurazione migrano automaticamente.

### Changed
- **Package Python**: `itatorrents` → `unit3dprep`. Import path, CLI entrypoints (`unit3dprep`, `unit3dprep-web`), directory del pacchetto.
- **Env var prefix**: `ITA_*` → `U3DP_*` (es. `U3DP_MEDIA_ROOT`, `U3DP_SECRET`, `U3DP_PORT`, `U3DP_SYSTEMD_UNIT`, ecc.).
- **Systemd unit**: default `unit3dprep-web.service` (era `itatorrents-web.service`).
- **Dotfile DB/cache**: `.itatorrents_*.json` → `.unit3dprep_*.json`.
- **Repo GitHub**: `davidesidoti/unit3dprep` (redirect automatico dal vecchio nome).
- **Documentazione**: `https://davidesidoti.github.io/unit3dprep/`.
- **Frontend localStorage**: chiavi `itatorrents.*` → `unit3dprep.*` (pendingChangelog + logs filters).

### Added
- **Fallback env vars legacy**: le vecchie `ITA_*` sono ancora lette al primo avvio; helper `_env()` logga un warning "Using legacy env var ITA_X; rename to U3DP_X" e continua a funzionare.
- **Auto-migrate dotfile**: all'avvio, se un `.itatorrents_*.json` esiste e il nuovo `.unit3dprep_*.json` no, viene rinominato automaticamente.
- **Auto-upgrade config JSON**: `Unit3Dbot.json` con chiavi legacy `ITA_*` viene riscritto transparentemente con le nuove chiavi al primo load/save.
- **Cleanup metadata doppio**: il flow di auto-update pulisce sia `itatorrents.egg-info` sia `unit3dprep.egg-info`, sia i `dist-info` orfani di entrambi i nomi, per supportare gli upgrade cross-rename senza residui.

### Deprecated
- **`ITA_*` env vars**: ancora funzionanti come fallback, ma producono warning nei log. Rinomina in `U3DP_*` alla prima occasione — verranno rimosse in una release futura.

### Upgrade notes
Nessuna azione manuale richiesta per gli utenti esistenti: fallback env + auto-rename dotfile coprono il caso comune. Per un cleanup completo su VPS/Ultra.cc:
```
# 1. Aggiorna il pacchetto
pip install --upgrade "git+https://github.com/davidesidoti/unit3dprep.git@v0.5.0"

# 2. (opzionale) Rinomina env vars in ~/.bashrc o nel file unit systemd
#    ITA_*  →  U3DP_*

# 3. (opzionale) Rinomina systemd unit
mv ~/.config/systemd/user/itatorrents-web.service ~/.config/systemd/user/unit3dprep-web.service
systemctl --user daemon-reload
systemctl --user disable --now itatorrents-web.service 2>/dev/null || true
systemctl --user enable --now unit3dprep-web.service
```
Finché non rinomini env + systemd unit, il service continuerà a funzionare con le chiavi legacy (warning nei log ma zero breaking).

---

## [0.4.1] - 2026-04-23

Release di hotfix sul flow di auto-update: il restart del service non avveniva realmente e la versione mostrata nella UI restava indietro. Dopo questa release il pulsante "Update app" e "Update unit3dup" funzionano end-to-end senza intervento manuale.

### Fixed
- **Auto-update unit3dup: pulsante restava visibile dopo l'update**. Il `_cache` di `/api/version/info` (TTL 10min) non veniva invalidato al termine dell'install, quindi la UI continuava a vedere `{newer: true}` fino alla scadenza naturale. Ora il cache viene azzerato sull'evento `done` dell'endpoint SSE `update/unit3dup/stream`.
- **Auto-update: service non veniva realmente riavviato su systemd user services**. Il `systemctl --user restart` spawnato come figlio detached restava nel cgroup del service genitore e veniva ucciso da systemd prima di poter eseguire. Ora il restart viene schedulato via `systemd-run --user --on-active=3s` in uno scope transient fuori dal cgroup del service, garantendo che il restart avvenga davvero. Fallback al metodo precedente se `systemd-run` non è disponibile.
- **Auto-update: versione mostrata in UI non si aggiornava dopo `git pull`**. `importlib.metadata.version()` poteva ritornare valori stantii per via di `itatorrents.egg-info/` nella source dir o `dist-info` orfani nei site-packages. In git mode il backend ora legge la versione direttamente da `pyproject.toml` (fonte autorevole, aggiornata atomicamente da `git pull`).
- **Auto-update git mode**: pre-pulizia di `itatorrents.egg-info`, `itatorrents-*.dist-info` orfani e `__editable__.itatorrents-*.pth` residui prima di `pip install -e .`, più loop di `pip uninstall` finché "not installed". Elimina il problema delle metadata stantie che pip non rimuove completamente.

### Upgrade notes
Il fix al restart risolve il problema andando avanti, ma il codice attualmente in esecuzione sul VPS ha ancora il bug del detached Popen — quindi cliccando "Update app" da v0.4.0 il service non si riavvierà. Bootstrap una tantum:
```
cd <repo>
git pull --ff-only origin main
<python> -m pip install -e .
rm -rf itatorrents.egg-info    # solo se presente
systemctl --user restart itatorrents-web.service
```
Dalla v0.4.1 in poi il pulsante funziona senza restart manuali.

---

## [0.4.0] - 2026-04-23

Nuove funzionalità per la Media Library e per la gestione runtime del service systemd, più un fix al flow di auto-update.

### Added
- Nuova checkbox **"Only with Italian audio"** nella Media Library: filtra i media il cui audio è già stato scansionato ma non contiene una traccia ITA (gli item non ancora scansionati restano visibili). Default configurabile da **Settings › Wizard Defaults** tramite la nuova chiave `W_HIDE_NO_ITALIAN`.
- `ITA_SYSTEMD_UNIT` è ora editabile da **Settings › App Auto-Update** e persiste in `Unit3Dbot.json`. La chiave viene letta runtime (non solo all'import) così il bottone "Update app" rileva subito il cambio di nome della unit senza dover riavviare il service.
- Documentazione aggiornata (`docs/configurazione.md`, `docs/uso-web.md`, `docs/deploy-ultracc.md` + mirror inglesi) con una sezione dedicata all'auto-update in-app, ai pre-requisiti systemd e alla gestione di `ITA_SYSTEMD_UNIT` / `WorkingDirectory` su Ultra.cc.
- README: menzione del sistema di auto-update nella descrizione del progetto.

### Fixed
- **UpdateProgressModal entrava in loop infinito dopo il restart del service**: l'`EventSource` riconnetteva automaticamente quando il service veniva riavviato e il backend rieseguiva l'update da capo. Ora la connessione SSE viene chiusa esplicitamente alla ricezione dell'evento `done` e `onError` non riattiva lo stream se l'update è già concluso.

---

## [0.3.1] - 2026-04-23

Primo rilascio funzionante del sistema di auto-update introdotto in v0.3.0.

### Fixed
- **Update app non funzionava su installazioni pip-from-git**: il flow assumeva un git checkout ma `pip install git+URL@tag` non lascia la cartella `.git`. Aggiunto rilevamento automatico della modalità di installazione (`git` vs `pip`) con flow dedicato per pip: `pip install --upgrade --force-reinstall git+URL@vX`.
- **Check systemd troppo stretto**: `systemctl --user is-enabled` restituisce rc≠0 per unit in stato `linked` (symlink, comune su Ultra.cc) o `static` → pulsante "Update app" erroneamente disabilitato con `systemd unit not available in this environment`. Passato a `systemctl --user cat UNIT` che ritorna 0 iff il file unit esiste, indipendentemente dallo stato di abilitazione.

### Upgrade notes
Se stai aggiornando da v0.3.0, il codice attualmente installato contiene i bug sopra quindi non può aggiornarsi autonomamente. Fai il bootstrap una volta manualmente:
```
~/.venvs/itatorrents/bin/pip install --upgrade --force-reinstall \
  "git+https://github.com/davidesidoti/itatorrents-seeding.git@v0.3.1"
systemctl --user restart itatorrents.service
```
Dalla v0.3.1 in poi il pulsante "Update app" funziona dall'UI.

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