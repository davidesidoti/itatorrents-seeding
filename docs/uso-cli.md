# Uso › CLI

La CLI `itatorrents` è pensata per l'uso interattivo via SSH o terminale locale. Non serve la Web UI: è un workflow diretto file → hardlink → `unit3dup`.

Entry point: `itatorrents` (registrato da `pip install -e .`).

---

## Sintassi

```bash
itatorrents -u <FILE>       # film o singolo episodio
itatorrents -f <CARTELLA>   # serie o intera stagione
```

`-u` e `-f` sono mutuamente esclusivi. Nessun altro flag: tutto il resto avviene tramite prompt interattivi.

---

## Flusso `-u` (singolo file)

```bash
itatorrents -u /mnt/media/movies/Dune.Part.Two.2024.mkv
```

1. **Check audio** — `pymediainfo` elenca le tracce. Se non c'è italiano, esce con errore.
2. **Conferma** — *"Lingua italiana trovata. Proseguo con hardlink e rinomina? [y/n]"*.
3. **TMDB ID** — prompt *"Inserisci TMDB ID per movie (guessit: 'Dune Part Two')"*. Cerca su <https://www.themoviedb.org>, copia l'ID numerico dall'URL (`/movie/693134` → `693134`) e incollalo. Serve `TMDB_API_KEY`.
4. **Nome finale** — `guessit` + `extract_specs` compongono un nome secondo la [nomenclatura](nomenclatura.md). Puoi editarlo inline (readline precarica il default).
5. **Collision check** — se il target esiste in `~/seedings/`, chiede *sovrascrivi / salta / annulla*.
6. **Hardlink** — creato in `~/seedings/<nome finale>.<ext>`.
7. **Conferma upload** — *"Uploadare '<nome>' su ItaTorrents? [y/n]"*.
8. **`unit3dup`** — se accetti, lancia `unit3dup -b -u <path assoluto>`. Exit code restituito al shell.

### Output atteso

```
Analisi tracce audio: Dune.Part.Two.2024.mkv ...
Lingua italiana trovata. Proseguo con hardlink e rinomina? [y/n]: y
Inserisci TMDB ID per movie (guessit: 'Dune Part Two'): 693134
Nome finale: Dune Parte Due (2024) 2160p UHD BluRay TrueHD 7.1 HDR10 H.265 - ItaTorrentsBot
Hardlink creato: /home/user/seedings/Dune Parte Due (2024) ... .mkv
Uploadare 'Dune Parte Due ... .mkv' su ItaTorrents? [y/n]: y
[unit3dup output ...]
```

---

## Flusso `-f` (serie / stagione)

```bash
itatorrents -f /mnt/media/series/Severance/Season\ 02/
```

1. **Scansione** — tutti i file video nella cartella vengono analizzati.
2. **Check audio su TUTTI** — se anche uno solo manca l'italiano, esce.
3. **TMDB ID** — prompt per la **serie**, non per la stagione.
4. **Parsing episodi** — `guessit` estrae `S##E##` da ogni filename. Episodi senza S/E vengono segnalati e saltati.
5. **Nome cartella** — generato dal primo episodio come campione. Editabile.
6. **Hardlink tree** — `~/seedings/<nome cartella>/<nome episodio N>.<ext>` per ogni file.
7. **Conferma upload** — come sopra.
8. **`unit3dup`** — lancia `unit3dup -b -f <path assoluto cartella>`.

### Puntare a una singola stagione

Puoi puntare direttamente a `Serie/Season 01/`: `guessit` opera sui filename dei singoli episodi, non sul nome della cartella, quindi funziona. Questo è utile per serie multi-stagione dove vuoi caricarne una per volta.

---

## Variabili d'ambiente CLI

| Variabile | Effetto |
|---|---|
| `TMDB_API_KEY` | Richiesta per `tmdb_fetch`. Senza, il prompt TMDB fallisce con errore. |
| `ITA_MEDIA_ROOT` | Non usata dalla CLI direttamente, ma utile se vuoi path assoluti brevi via completion. |
| `ITA_SEEDINGS_DIR` | Cambia dove vengono creati gli hardlink. |

La CLI legge `ITA_SEEDINGS_DIR` attraverso `core.seedings_dir()`, quindi rispetta anche `Unit3Dbot.json`.

---

## Comandi `unit3dup` lanciati

- Film / episodio singolo: `unit3dup -b -u <path assoluto file>`
- Serie / stagione: `unit3dup -b -f <path assoluto cartella>`

Il path è sempre passato come `.resolve()` (assoluto, simlink-risolti). `-b` = batch mode (non interattivo lato `unit3dup`).

---

## Scelte possibili ai prompt

| Prompt | Risposte valide |
|---|---|
| Conferma binaria | `y` / `yes` / `s` / `si` / `sì` → sì; tutto il resto → no |
| Collision | `o` sovrascrivi / `s` salta / `c` annulla |
| Nome finale | editabile inline con readline (frecce ←→), invio per confermare |

`Ctrl+C` durante un prompt termina con exit code 130.

---

## Exit code

| Codice | Significato |
|---|---|
| `0` | Successo (upload completato o annullato dall'utente dopo hardlink). |
| `1` | File/cartella non valido, no italiano, nome vuoto, TMDB errore irrecuperabile. |
| `127` | `unit3dup` non trovato nel PATH. |
| `130` | `Ctrl+C`. |
| altro | Exit code propagato da `unit3dup`. |

---

## Differenza dal wizard Web UI

| Aspetto | CLI | Wizard Web |
|---|---|---|
| Rilevamento italiano | Blocca se manca | Configurabile (`W_AUDIO_CHECK`) |
| TMDB | Sempre manuale (ID) | Ricerca + match automatico |
| Nome finale | Editabile inline | Editabile con preview |
| Upload | `unit3dup` foreground | `unit3dup` in PTY con SSE stream |
| Storico | **Non** scrive nel DB | Scrive `ITA_DB_PATH` |
| Batch | Un file/cartella per volta | Stesso |

!!! warning "Nessuna scrittura nello storico"
    La CLI non aggiorna `~/.itatorrents_db.json`. Se vuoi che l'upload appaia nella Web UI come "Uploaded", passa attraverso il wizard o `quickupload`.
