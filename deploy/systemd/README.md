# Systemd user units

This folder ships ready-to-install systemd **user** units for the two
processes that make the upload pipeline work:

- `unit3dprep-web.service` (this app — see project root for install)
- `unit3dwebup.service` (Unit3DWebUp FastAPI bot, our upload backend)

## Prerequisites for `unit3dwebup.service`

1. **Redis** running locally on `127.0.0.1:6379`. On Ultra.cc, install in
   user mode (compile in `~/.local/redis` or use a reserved port). On WSL
   dev: `sudo apt install -y redis-server && sudo systemctl start redis-server`.

2. **Unit3DWebUp checkout** at `~/dev/Unit3DWebUp` with its own venv at
   `~/dev/Unit3DWebUp/.venv` and dependencies installed:

   ```bash
   git clone https://github.com/31December99/Unit3DWebUp.git ~/dev/Unit3DWebUp
   cd ~/dev/Unit3DWebUp
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   cp '.env(example)' .env
   # edit .env — fill TRACKER__ITT_*, TORRENT__QBIT_*, PREFS__SCAN_PATH,
   # PREFS__TORRENT_ARCHIVE_PATH, etc.
   ```

   To customize paths/service unit, set in this app's `Unit3Dbot.json` (or env):
   - `WEBUP_REPO_PATH` (default `~/dev/Unit3DWebUp`)
   - `WEBUP_SYSTEMD_UNIT` (default `unit3dwebup.service`)
   - `WEBUP_VENV_BIN` (default `<repo>/.venv/bin`)
   - `WEBUP_URL` (default `http://127.0.0.1:8000`)

## Install

```bash
mkdir -p ~/.config/systemd/user
cp unit3dwebup.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now unit3dwebup.service
systemctl --user status unit3dwebup.service
```

Tail the logs:

```bash
journalctl --user -u unit3dwebup.service -f
```

## Verify

```bash
curl -s http://127.0.0.1:8000/setting -X POST -H 'Content-Type: application/json' -d '{}'
```

Should return a JSON `{userPreferences: {...}}` payload. From the unit3dprep
Settings UI, the "Unit3DWebUp" card should turn green.
