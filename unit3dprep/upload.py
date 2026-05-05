"""Pre-flight helpers used by the wizard + CLI.

Holds audio-check results, name-build helpers, and hardlink utilities. The
actual upload step is handled by `unit3dprep.web.webup_orchestrator` (HTTP
calls to Unit3DWebUp) — there is no longer any unit3dup CLI subprocess.
"""
from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from guessit import guessit

from .core import (
    seedings_dir,
    build_name,
    extract_specs,
    format_se,
    hardlink_file,
    hardlink_tree,
    has_italian_audio,
    map_source,
)


@dataclass
class AudioResult:
    path: Path
    has_italian: bool
    error: str = ""


def check_audio_files(paths: list[Path]) -> list[AudioResult]:
    results = []
    for p in paths:
        try:
            ok = has_italian_audio(p)
            results.append(AudioResult(path=p, has_italian=ok))
        except Exception as e:
            results.append(AudioResult(path=p, has_italian=False, error=str(e)))
    return results


def build_episode_names(
    series_folder: Path,
    video_files: list[Path],
    series_title: str,
    year: str,
    folder_guess: dict,
) -> dict[Path, str]:
    """Returns mapping file_path → new_base_name (no extension)."""
    episode_rename: dict[Path, str] = {}
    for f in video_files:
        g = dict(guessit(f.name))
        season = g.get("season")
        if isinstance(season, list):
            season = season[0]
        episode = g.get("episode")
        se = format_se(season, episode)
        if not se:
            continue
        specs = extract_specs(f)
        source, src_type = map_source(g)
        tag = g.get("release_group", "") or folder_guess.get("release_group", "") or ""
        new_name = build_name(
            title=series_title, year="", se=se,
            specs=specs, source=source, src_type=src_type, tag=tag,
        )
        episode_rename[f] = new_name
    return episode_rename


def build_movie_name_from_file(
    video_file: Path,
    movie_title: str,
    year: str,
) -> str:
    g = dict(guessit(video_file.name))
    specs = extract_specs(video_file)
    source, src_type = map_source(g)
    tag = g.get("release_group", "") or ""
    repack = "REPACK" if g.get("proper_count") else ""
    return build_name(
        title=movie_title, year=year, se="",
        specs=specs, source=source, src_type=src_type, tag=tag, repack=repack,
    )


def do_hardlink_movie(src: Path, final_name: str) -> Path:
    seed = seedings_dir()
    seed.mkdir(parents=True, exist_ok=True)
    target = seed / f"{final_name}{src.suffix.lower()}"
    hardlink_file(src, target, overwrite=True)
    return target


def do_hardlink_series(
    src_dir: Path,
    folder_name: str,
    episode_rename: dict[Path, str],
) -> Path:
    seed = seedings_dir()
    seed.mkdir(parents=True, exist_ok=True)
    target_dir = seed / folder_name
    if target_dir.exists():
        shutil.rmtree(target_dir)
    hardlink_tree(src_dir, target_dir, episode_rename)
    return target_dir
