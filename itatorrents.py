#!/usr/bin/env python3
"""itatorrents: verifica lingua italiana, rinomina e lancia unit3dup."""
import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from pymediainfo import MediaInfo
except ImportError:
    print("Errore: pymediainfo non installato. Esegui: pip install pymediainfo")
    sys.exit(1)

try:
    from guessit import guessit
except ImportError:
    print("Errore: guessit non installato. Esegui: pip install guessit")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Costanti
# ---------------------------------------------------------------------------

SEEDINGS_DIR = Path.home() / "seedings"
VIDEO_EXTENSIONS = {".mkv", ".mp4", ".avi", ".mov", ".m4v", ".ts", ".webm", ".wmv", ".flv"}
ITA_TAGS = {"it", "ita", "italian", "italiano"}

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_API_KEY = os.environ.get("TMDB_API_KEY")

LANG_MAP = {
    "it": "ITA", "ita": "ITA", "italian": "ITA", "italiano": "ITA",
    "en": "ENG", "eng": "ENG", "english": "ENG",
    "es": "SPA", "spa": "SPA", "spanish": "SPA",
    "fr": "FRE", "fra": "FRE", "fre": "FRE", "french": "FRE",
    "de": "GER", "ger": "GER", "deu": "GER", "german": "GER",
    "ja": "JPN", "jpn": "JPN", "japanese": "JPN",
    "ko": "KOR", "kor": "KOR", "korean": "KOR",
    "zh": "CHI", "chi": "CHI", "zho": "CHI", "chinese": "CHI",
    "pt": "POR", "por": "POR", "portuguese": "POR",
    "ru": "RUS", "rus": "RUS", "russian": "RUS",
    "nl": "DUT", "dut": "DUT", "nld": "DUT", "dutch": "DUT",
    "pl": "POL", "pol": "POL", "polish": "POL",
    "sv": "SWE", "swe": "SWE", "swedish": "SWE",
    "tr": "TUR", "tur": "TUR", "turkish": "TUR",
    "ar": "ARA", "ara": "ARA", "arabic": "ARA",
    "hi": "HIN", "hin": "HIN", "hindi": "HIN",
}

CHANNELS_MAP = {1: "1.0", 2: "2.0", 3: "2.1", 6: "5.1", 7: "6.1", 8: "7.1", 10: "9.1", 12: "11.1"}


# ---------------------------------------------------------------------------
# Prompt helpers
# ---------------------------------------------------------------------------

def prompt_confirm(msg: str) -> bool:
    try:
        answer = input(msg).strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return False
    return answer in {"y", "yes", "s", "si", "sì"}


def prompt_edit(msg: str, default: str) -> str:
    """Chiede input con testo pre-compilato (readline) se disponibile."""
    try:
        import readline
        readline.set_startup_hook(lambda: readline.insert_text(default))
        try:
            return input(msg).strip()
        finally:
            readline.set_startup_hook()
    except (ImportError, Exception):
        print(f"Attuale: {default}")
        new = input(f"{msg} (invio = mantieni): ").strip()
        return new or default


def prompt_choice(msg: str, choices: dict[str, str]) -> str:
    options = " / ".join(f"[{k}]{v}" for k, v in choices.items())
    while True:
        try:
            ans = input(f"{msg} {options}: ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            return ""
        if ans in choices:
            return ans


# ---------------------------------------------------------------------------
# MediaInfo: audio italiano
# ---------------------------------------------------------------------------

def _audio_langs(track) -> list[str]:
    cands = []
    if track.language:
        cands.append(track.language)
    other = getattr(track, "other_language", None)
    if other:
        cands.extend(other if isinstance(other, list) else [other])
    return [c for c in cands if c]


def has_italian_audio(path: Path) -> bool:
    try:
        info = MediaInfo.parse(str(path))
    except Exception as e:
        print(f"Avviso: impossibile analizzare '{path}': {e}")
        return False
    for track in info.tracks:
        if track.track_type != "Audio":
            continue
        if any(c.lower().strip() in ITA_TAGS for c in _audio_langs(track)):
            return True
    return False


def iter_video_files(folder: Path):
    for f in sorted(folder.rglob("*")):
        if f.is_file() and f.suffix.lower() in VIDEO_EXTENSIONS:
            yield f


# ---------------------------------------------------------------------------
# MediaInfo: estrazione specs tecniche
# ---------------------------------------------------------------------------

def extract_specs(path: Path) -> dict:
    """Estrae resolution/hdr/vcodec/acodec/channels/object/hi10p/dub dal file."""
    info = MediaInfo.parse(str(path))
    video_track = next((t for t in info.tracks if t.track_type == "Video"), None)
    audio_tracks = [t for t in info.tracks if t.track_type == "Audio"]

    specs: dict = {
        "resolution": "", "hdr": "", "vcodec_format": "",
        "bit_depth": None, "scan_type": "", "writing_library": "",
        "acodec": "", "channels": "", "object": "",
        "dub": [],
    }

    if video_track:
        height = getattr(video_track, "height", None)
        scan = (getattr(video_track, "scan_type", "") or "Progressive").lower()
        suffix = "i" if scan.startswith("interlaced") else "p"
        if height:
            for h in (2160, 1080, 720, 576, 480):
                if height >= h:
                    specs["resolution"] = f"{h}{suffix}"
                    break
        specs["vcodec_format"] = (getattr(video_track, "format", "") or "")
        specs["bit_depth"] = getattr(video_track, "bit_depth", None)
        specs["scan_type"] = scan
        specs["writing_library"] = getattr(video_track, "writing_library", "") or ""

        hdr_fmt = (getattr(video_track, "hdr_format_commercial", "")
                   or getattr(video_track, "hdr_format", "") or "")
        hdr_fmt_l = hdr_fmt.lower()
        if "dolby vision" in hdr_fmt_l and "hdr10+" in hdr_fmt_l:
            specs["hdr"] = "DV HDR10+"
        elif "dolby vision" in hdr_fmt_l and "hdr10" in hdr_fmt_l:
            specs["hdr"] = "DV HDR"
        elif "dolby vision" in hdr_fmt_l:
            specs["hdr"] = "DV"
        elif "hdr10+" in hdr_fmt_l:
            specs["hdr"] = "HDR10+"
        elif "hdr10" in hdr_fmt_l or "smpte st 2086" in hdr_fmt_l:
            specs["hdr"] = "HDR"
        elif "hlg" in hdr_fmt_l:
            specs["hdr"] = "HLG"

    if audio_tracks:
        main = audio_tracks[0]
        fmt = (getattr(main, "format", "") or "").lower()
        comm = (getattr(main, "format_commercial_if_any", "")
                or getattr(main, "commercial_name", "") or "").lower()
        profile = (getattr(main, "format_profile", "") or "").lower()

        if "truehd" in fmt or "truehd" in comm:
            specs["acodec"] = "TrueHD"
        elif "dts" in fmt or "dts" in comm:
            if "ma" in profile:
                specs["acodec"] = "DTS-HD MA"
            elif "hra" in profile or "hi" in profile:
                specs["acodec"] = "DTS-HD HRA"
            elif "x" in profile:
                specs["acodec"] = "DTS:X"
            elif "es" in profile:
                specs["acodec"] = "DTS-ES"
            else:
                specs["acodec"] = "DTS"
        elif "e-ac-3" in fmt or "eac3" in fmt or "dd+" in comm or "digital plus" in comm:
            specs["acodec"] = "DD+"
        elif "ac-3" in fmt or "ac3" in fmt:
            specs["acodec"] = "DD"
        elif "flac" in fmt:
            specs["acodec"] = "FLAC"
        elif "alac" in fmt:
            specs["acodec"] = "ALAC"
        elif "opus" in fmt:
            specs["acodec"] = "Opus"
        elif "pcm" in fmt:
            specs["acodec"] = "LPCM"
        elif "aac" in fmt:
            specs["acodec"] = "AAC"
        else:
            specs["acodec"] = (getattr(main, "format", "") or "").upper()

        try:
            ch = int(getattr(main, "channel_s", 0) or 0)
            specs["channels"] = CHANNELS_MAP.get(ch, f"{ch}.0")
        except (ValueError, TypeError):
            specs["channels"] = ""

        if "atmos" in comm or "atmos" in fmt:
            specs["object"] = "Atmos"
        elif "auro" in comm or "auro" in fmt:
            specs["object"] = "Auro3D"

        dubs = []
        for t in audio_tracks:
            for lang in _audio_langs(t):
                code = LANG_MAP.get(lang.lower().strip())
                if code and code not in dubs:
                    dubs.append(code)
        specs["dub"] = dubs

    return specs


def vcodec_for_type(specs: dict, src_type: str) -> str:
    """Mappa il codec in base al tipo sorgente (disc/remux/web-dl/encode/webrip)."""
    fmt = (specs.get("vcodec_format") or "").upper()
    writing = (specs.get("writing_library") or "").lower()
    t = src_type.lower()

    is_avc = "AVC" in fmt
    is_hevc = "HEVC" in fmt or "H.265" in fmt
    is_vp9 = "VP9" in fmt
    is_mpeg2 = "MPEG" in fmt and "2" in fmt
    is_vc1 = "VC-1" in fmt

    if t in {"remux", "disc", "bluray", "uhd bluray", "3d bluray", "hddvd"}:
        if is_hevc: return "HEVC"
        if is_avc: return "AVC"
        if is_mpeg2: return "MPEG-2"
        if is_vc1: return "VC-1"
    if t in {"web-dl", "hdtv", "uhdtv"}:
        if is_hevc: return "H.265"
        if is_avc: return "H.264"
        if is_vp9: return "VP9"
        if is_mpeg2: return "MPEG-2"
    # encode / webrip / bdrip / dvdrip
    if "x265" in writing: return "x265"
    if "x264" in writing: return "x264"
    if is_hevc: return "x265"
    if is_avc: return "x264"
    return fmt


def hi10p_flag(specs: dict) -> bool:
    fmt = (specs.get("vcodec_format") or "").upper()
    return ("AVC" in fmt) and (specs.get("bit_depth") == 10) and (not specs.get("hdr"))


# ---------------------------------------------------------------------------
# guessit -> source / type
# ---------------------------------------------------------------------------

STREAM_ABBR = {
    "netflix": "NF", "amazon": "AMZN", "amazon prime video": "AMZN",
    "disney+": "DSNP", "disney plus": "DSNP", "apple tv+": "ATVP",
    "hbo max": "HMAX", "max": "HMAX", "hulu": "HULU", "paramount+": "PMTP",
    "peacock": "PCOK", "sky": "SKY", "now": "NOW", "rai": "RAI",
    "crunchyroll": "CR",
}


def map_source(guess: dict) -> tuple[str, str]:
    """Ritorna (SOURCE, TYPE). TYPE vuoto se Full Disc/Encode/HDTV."""
    src = (guess.get("source") or "").lower()
    other = guess.get("other") or []
    if isinstance(other, str):
        other = [other]
    other_l = [o.lower() for o in other]
    stream = (guess.get("streaming_service") or "").lower()

    is_remux = "remux" in other_l
    is_webdl = "web-dl" in other_l or src == "web"
    is_webrip = "webrip" in other_l or "web-rip" in other_l
    is_hdtv = src == "hdtv"
    is_uhd = "ultra hd blu-ray" in src or "uhd" in other_l

    if "blu-ray" in src or src == "bluray":
        source = "UHD BluRay" if is_uhd else "BluRay"
        if is_remux:
            return source, "REMUX"
        return source, ""
    if is_webdl:
        abbr = STREAM_ABBR.get(stream, stream.upper().replace(" ", "") if stream else "WEB")
        return abbr, "WEB-DL"
    if is_webrip:
        abbr = STREAM_ABBR.get(stream, stream.upper().replace(" ", "") if stream else "WEB")
        return abbr, "WEBRip"
    if is_hdtv:
        return ("UHDTV" if is_uhd else "HDTV"), ""
    if "dvd" in src:
        return "DVD", ""
    return (src.upper() if src else ""), ""


# ---------------------------------------------------------------------------
# TMDB
# ---------------------------------------------------------------------------

def tmdb_fetch(kind: str, tmdb_id: str) -> dict:
    if not TMDB_API_KEY:
        raise RuntimeError(
            "TMDB_API_KEY non impostata. Imposta la variabile d'ambiente "
            "(export TMDB_API_KEY=...) prima di eseguire lo script."
        )
    url = f"{TMDB_BASE}/{kind}/{urllib.parse.quote(str(tmdb_id))}?api_key={TMDB_API_KEY}&language=en-US"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def ask_tmdb_id(kind_label: str, default_title: str = "") -> tuple[str, dict]:
    """Chiede l'ID TMDB e ritorna (kind, data). kind = 'movie' o 'tv'."""
    kind = "tv" if kind_label == "tv" else "movie"
    hint = f" (guessit: '{default_title}')" if default_title else ""
    while True:
        try:
            raw = input(f"Inserisci TMDB ID per {kind}{hint}: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            sys.exit(1)
        if not raw:
            continue
        try:
            data = tmdb_fetch(kind, raw)
            return kind, data
        except Exception as e:
            print(f"Errore TMDB: {e}. Riprova.")


# ---------------------------------------------------------------------------
# Assemblaggio nome
# ---------------------------------------------------------------------------

def sanitize(s: str) -> str:
    # Rimuove caratteri problematici per filesystem ma preserva punteggiatura ammessa.
    bad = '<>:"/\\|?*'
    return "".join(c for c in s if c not in bad).strip()


def build_name(
    title: str,
    year: str,
    se: str,
    specs: dict,
    source: str,
    src_type: str,
    tag: str,
    cut: str = "",
    repack: str = "",
    edition_flag: str = "",
    dub_override: list[str] | None = None,
) -> str:
    """Compone il titolo conforme a ItaTorrents."""
    parts = [title]
    if year:
        parts.append(year)
    if se:
        parts.append(se)
    if cut:
        parts.append(cut)
    if repack:
        parts.append(repack)
    if specs.get("resolution"):
        parts.append(specs["resolution"])
    # Edition viene messa in descrizione, non nel nome.
    if "3d" in (edition_flag or "").lower():
        parts.append("3D")
    if source:
        parts.append(source)
    if src_type:
        parts.append(src_type)

    # Encode/WEB-DL path: Dub/ACodec/Channels/Object/Hi10P/HDR/VCodec
    # Disc/Remux path: Hi10P/HDR/VCodec/Dub/ACodec/Channels/Object
    is_disc_or_remux = src_type.upper() in {"REMUX", ""} and source in {
        "BluRay", "UHD BluRay", "3D BluRay", "HDDVD"
    }
    dubs = dub_override if dub_override is not None else specs.get("dub", [])
    dub_str = " ".join(dubs) if dubs else ""

    if is_disc_or_remux:
        if hi10p_flag(specs): parts.append("Hi10P")
        if specs.get("hdr"): parts.append(specs["hdr"])
        vc = vcodec_for_type(specs, src_type or source)
        if vc: parts.append(vc)
        if dub_str: parts.append(dub_str)
        if specs.get("acodec"): parts.append(specs["acodec"])
        if specs.get("channels"): parts.append(specs["channels"])
        if specs.get("object"): parts.append(specs["object"])
    else:
        if dub_str: parts.append(dub_str)
        if specs.get("acodec"): parts.append(specs["acodec"])
        if specs.get("channels"): parts.append(specs["channels"])
        if specs.get("object"): parts.append(specs["object"])
        if hi10p_flag(specs): parts.append("Hi10P")
        if specs.get("hdr"): parts.append(specs["hdr"])
        vc = vcodec_for_type(specs, src_type or source)
        if vc: parts.append(vc)

    base = " ".join(p for p in parts if p)
    if tag:
        base = f"{base}-{tag}"
    return sanitize(base)


def tmdb_year(data: dict, kind: str) -> str:
    date = data.get("release_date") if kind == "movie" else data.get("first_air_date")
    if date and len(date) >= 4:
        return date[:4]
    return ""


def format_se(season: int | None, episode) -> str:
    if season is None or episode is None:
        return ""
    if isinstance(episode, list) and episode:
        if len(episode) == 1:
            return f"S{season:02d}E{episode[0]:02d}"
        # episodi consecutivi? usiamo range
        ep_sorted = sorted(episode)
        if ep_sorted == list(range(ep_sorted[0], ep_sorted[-1] + 1)):
            return f"S{season:02d}E{ep_sorted[0]:02d}-{ep_sorted[-1]:02d}"
        return f"S{season:02d}E{ep_sorted[0]:02d}E{ep_sorted[-1]:02d}"
    if isinstance(episode, int):
        return f"S{season:02d}E{episode:02d}"
    return ""


# ---------------------------------------------------------------------------
# Hardlink + collision handling
# ---------------------------------------------------------------------------

def resolve_collision(target: Path) -> str:
    """Ritorna 'overwrite', 'skip', 'cancel' oppure ''."""
    if not target.exists():
        return "overwrite"
    print(f"Attenzione: '{target}' esiste già.")
    choice = prompt_choice(
        "Cosa fare?",
        {"o": "sovrascrivi", "s": "salta", "c": "annulla"},
    )
    return {"o": "overwrite", "s": "skip", "c": "cancel"}.get(choice, "cancel")


def hardlink_file(src: Path, dst: Path, action: str = "overwrite"):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if action == "overwrite" and dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    if action == "skip" and dst.exists():
        return
    os.link(src, dst)


def hardlink_tree(src_dir: Path, dst_dir: Path, episode_rename: dict[Path, str]):
    """
    Replica src_dir in dst_dir con hardlink. episode_rename: mapping
    file_originale -> nuovo_nome (senza estensione). File non-video vengono
    replicati mantenendo il nome originale.
    """
    dst_dir.mkdir(parents=True, exist_ok=True)
    for src_file in sorted(src_dir.rglob("*")):
        if not src_file.is_file():
            continue
        rel_parent = src_file.parent.relative_to(src_dir)
        target_parent = dst_dir / rel_parent
        target_parent.mkdir(parents=True, exist_ok=True)
        if src_file in episode_rename:
            new_name = episode_rename[src_file] + src_file.suffix.lower()
        else:
            new_name = src_file.name
        target = target_parent / new_name
        if target.exists():
            target.unlink()
        os.link(src_file, target)


# ---------------------------------------------------------------------------
# unit3dup
# ---------------------------------------------------------------------------

def run_unit3dup(args: list[str]):
    try:
        result = subprocess.run(["unit3dup", *args])
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("Errore: 'unit3dup' non trovato nel PATH.")
        sys.exit(127)


# ---------------------------------------------------------------------------
# Flussi principali
# ---------------------------------------------------------------------------

def handle_file(path: Path):
    if not path.exists() or not path.is_file():
        print(f"Errore: file non valido: {path}")
        sys.exit(1)

    print(f"Analisi tracce audio: {path.name} ...")
    if not has_italian_audio(path):
        print("Italiano non trovato nelle tracce audio. Uscita.")
        sys.exit(1)

    if not prompt_confirm("Lingua italiana trovata. Proseguo con hardlink e rinomina? [y/n]: "):
        print("Annullato.")
        sys.exit(0)

    guess = dict(guessit(path.name))
    title_hint = guess.get("title", "")
    kind, tmdb_data = ask_tmdb_id("movie", title_hint)
    title = tmdb_data.get("title") or tmdb_data.get("name") or title_hint
    year = tmdb_year(tmdb_data, kind)

    specs = extract_specs(path)
    source, src_type = map_source(guess)
    tag = guess.get("release_group", "") or ""

    proposed = build_name(
        title=title, year=year, se="",
        specs=specs, source=source, src_type=src_type, tag=tag,
        cut="", repack="REPACK" if guess.get("proper_count") else "",
    )
    final_name = prompt_edit("Nome finale: ", proposed)
    if not final_name:
        print("Nome vuoto, annullato.")
        sys.exit(1)

    SEEDINGS_DIR.mkdir(parents=True, exist_ok=True)
    target = SEEDINGS_DIR / f"{final_name}{path.suffix.lower()}"
    action = resolve_collision(target)
    if action == "cancel":
        print("Annullato.")
        sys.exit(0)
    if action == "skip" and target.exists():
        print(f"File esistente, uso: {target}")
    else:
        hardlink_file(path, target, action)
        print(f"Hardlink creato: {target}")

    if not prompt_confirm(f"Uploadare '{target.name}' su ItaTorrents? [y/n]: "):
        print("Annullato (hardlink rimane in ~/seedings).")
        sys.exit(0)

    run_unit3dup(["-b", "-u", str(target.resolve())])


def handle_folder(folder: Path):
    if not folder.exists() or not folder.is_dir():
        print(f"Errore: cartella non valida: {folder}")
        sys.exit(1)

    files = list(iter_video_files(folder))
    if not files:
        print("Nessun file video trovato.")
        sys.exit(1)

    print(f"Trovati {len(files)} file video. Analisi tracce audio ...")
    for f in files:
        print(f"  {f.relative_to(folder)} ... ", end="", flush=True)
        if has_italian_audio(f):
            print("ok")
        else:
            print("NO ITALIANO")
            print(f"\nFile senza traccia italiana: {f}")
            sys.exit(1)

    if not prompt_confirm("\nItaliano trovato in tutti i file. Proseguo con hardlink e rinomina? [y/n]: "):
        print("Annullato.")
        sys.exit(0)

    # Parse folder name per avere serie + anno come hint.
    folder_guess = dict(guessit(folder.name))
    title_hint = folder_guess.get("title", folder.name)
    kind, tmdb_data = ask_tmdb_id("tv", title_hint)
    series_title = tmdb_data.get("name") or tmdb_data.get("title") or title_hint
    year = tmdb_year(tmdb_data, kind)

    # Per ogni file episodio: specs + guessit -> nuovo nome.
    episode_rename: dict[Path, str] = {}
    sample_specs = None
    sample_source = ""
    sample_type = ""
    sample_tag = ""
    for f in files:
        g = dict(guessit(f.name))
        season = g.get("season")
        if isinstance(season, list):
            season = season[0]
        episode = g.get("episode")
        se = format_se(season, episode)
        if not se:
            print(f"Avviso: impossibile ricavare S##E## da '{f.name}'. Lo salto.")
            continue
        specs = extract_specs(f)
        source, src_type = map_source(g)
        tag = g.get("release_group", "") or folder_guess.get("release_group", "") or ""
        if sample_specs is None:
            sample_specs, sample_source, sample_type, sample_tag = specs, source, src_type, tag
        new_name = build_name(
            title=series_title, year=year, se=se,
            specs=specs, source=source, src_type=src_type, tag=tag,
        )
        episode_rename[f] = new_name

    # Nome cartella serie: basato sul primo episodio ma senza S##E##.
    folder_name = build_name(
        title=series_title, year=year, se="",
        specs=sample_specs or {}, source=sample_source, src_type=sample_type, tag=sample_tag,
    )
    folder_name = prompt_edit("Nome cartella finale: ", folder_name)
    if not folder_name:
        print("Nome vuoto, annullato.")
        sys.exit(1)

    SEEDINGS_DIR.mkdir(parents=True, exist_ok=True)
    target_dir = SEEDINGS_DIR / folder_name
    action = resolve_collision(target_dir)
    if action == "cancel":
        print("Annullato.")
        sys.exit(0)
    if action == "overwrite" and target_dir.exists():
        shutil.rmtree(target_dir)

    if action != "skip" or not target_dir.exists():
        hardlink_tree(folder, target_dir, episode_rename)
        print(f"Hardlink creati in: {target_dir}")
        print("Episodi rinominati:")
        for orig, new in episode_rename.items():
            print(f"  {orig.name} -> {new}{orig.suffix.lower()}")

    if not prompt_confirm(f"Uploadare '{target_dir.name}' su ItaTorrents? [y/n]: "):
        print("Annullato (hardlink rimane in ~/seedings).")
        sys.exit(0)

    run_unit3dup(["-b", "-f", str(target_dir.resolve())])


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Verifica lingua italiana, rinomina secondo nomenclatura ItaTorrents e carica via unit3dup."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-u", "--upload", metavar="FILE", help="Singolo file video (film)")
    group.add_argument("-f", "--folder", metavar="CARTELLA", help="Cartella (serie TV)")
    args = parser.parse_args()

    if args.upload:
        handle_file(Path(args.upload).expanduser().resolve())
    else:
        handle_folder(Path(args.folder).expanduser().resolve())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrotto. Ciao!")
        sys.exit(130)
