#!/usr/bin/env python3
"""Double-clap desktop assistant for macOS.

Listens to the microphone; on a confirmed double clap, opens the Claude app
(main screen) and a blank Safari window (second screen), then speaks a
welcome line via ElevenLabs.

Run:
  .venv/bin/python jarvis.py

Debug mode (prints level/threshold on every peak):
  JARVIS_DEBUG=1 .venv/bin/python jarvis.py
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import subprocess
import sys
import threading
import time
from pathlib import Path

from dotenv import load_dotenv
import numpy as np
import sounddevice as sd

# --- tuning knobs -----------------------------------------------------------
# A clap and a raised voice can hit the same RMS level, so a level threshold
# alone is not enough: a clap decays in well under 100ms, a voice does not.
# Every peak above the threshold is held for CONFIRM_DELAY_S, then only
# counted as a clap if the level has fallen back under CONFIRM_DROP_RATIO of
# the peak by then.
SAMPLE_RATE = 48000  # MacBook mics sample at 48kHz, not 44100.
BLOCK_MS = 20
CHANNELS = 1

SPIKE_RATIO = 7.0          # peak must be this many times the noise floor
MIN_RMS = 0.28             # absolute floor a peak must clear (float audio ~[-1, 1])
CONFIRM_DELAY_S = 0.10     # wait this long after a peak before checking its shape
CONFIRM_DROP_RATIO = 0.35  # peak must fall below (peak_level * this) to count as a clap
MIN_DOUBLE_GAP_S = 0.12    # minimum time between the two claps of a double clap
MAX_DOUBLE_GAP_S = 0.35    # maximum time between the two claps of a double clap
COOLDOWN_S = 2.0           # ignore new claps for this long after a double clap fires
NOISE_FLOOR_ALPHA = 0.992  # closer to 1 = slower adaptation of the room noise floor
QUIET_GATE_MULT = 2.2      # only update the noise floor when below floor * this

JARVIS_WELCOME_PHRASE = "Bonjour monsieur, que puis-je faire pour vous ?"

load_dotenv(Path(__file__).resolve().parent / ".env")
DEBUG = (os.environ.get("JARVIS_DEBUG") or "").strip().lower() in ("1", "true", "yes")

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("jarvis")


def block_samples() -> int:
    return max(int(SAMPLE_RATE * BLOCK_MS / 1000), 1)


def resolve_input_device() -> int | None:
    """None = system default. JARVIS_INPUT_DEVICE can be an index or a name substring."""
    spec = (os.environ.get("JARVIS_INPUT_DEVICE") or "").strip()
    if not spec:
        return None
    if spec.isdigit():
        return int(spec)
    needle = spec.lower()
    for idx, dev in enumerate(sd.query_devices()):
        if dev["max_input_channels"] >= 1 and needle in dev["name"].lower():
            return idx
    log.warning("Aucun micro ne correspond à JARVIS_INPUT_DEVICE=%r; utilisation du micro par défaut.", spec)
    return None


def rms_mono(block: np.ndarray) -> float:
    if block.ndim > 1:
        block = np.mean(block.astype(np.float64), axis=1)
    else:
        block = block.astype(np.float64)
    if block.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(block**2)))


# --- macOS actions -----------------------------------------------------------

def open_vscode_app() -> None:
    try:
        subprocess.Popen(["open", "-a", "Visual Studio Code"])
    except OSError as e:
        log.warning("Impossible d'ouvrir VS Code: %s", e)


def _secondary_screen_quartz_rect() -> tuple[int, int, int, int] | None:
    """(x, y, w, h) of a non-main display, in top-left/System-Events coordinates."""
    js = (
        'ObjC.import("AppKit");'
        "var out = [];"
        "var screens = $.NSScreen.screens;"
        "for (var i = 0; i < screens.count; i++) {"
        "  var f = screens.objectAtIndex(i).frame;"
        "  out.push({x: f.origin.x, y: f.origin.y, w: f.size.width, h: f.size.height});"
        "}"
        "JSON.stringify(out);"
    )
    try:
        result = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", js],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
        frames = json.loads(result.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError) as e:
        log.warning("Impossible de détecter les écrans: %s", e)
        return None

    main = next((f for f in frames if f["x"] == 0 and f["y"] == 0), None)
    if main is None or len(frames) < 2:
        return None
    main_h = main["h"]
    for f in frames:
        if f is main:
            continue
        # AppKit is bottom-left/y-up; System Events is top-left/y-down.
        x = f["x"]
        y = main_h - (f["y"] + f["h"])
        return (int(x), int(y), int(f["w"]), int(f["h"]))
    return None


def open_safari_blank_on_second_screen() -> None:
    rect = _secondary_screen_quartz_rect()
    lines = [
        'tell application "Safari"',
        "    activate",
        "    if (count of windows) = 0 then",
        "        make new document",
        "    else",
        '        set URL of front document to "about:blank"',
        "    end if",
        "end tell",
        "delay 0.3",
    ]
    if rect:
        x, y, w, h = rect
        lines += [
            'tell application "System Events"',
            '    tell process "Safari"',
            f"        set position of front window to {{{x}, {y}}}",
            f"        set size of front window to {{{w}, {h}}}",
            "    end tell",
            "end tell",
        ]
    else:
        log.warning("Un seul écran détecté; Safari s'ouvre sans repositionnement.")
    try:
        subprocess.run(["osascript", "-e", "\n".join(lines)], timeout=10, check=False)
    except (OSError, subprocess.SubprocessError) as e:
        log.warning("Impossible d'ouvrir Safari: %s", e)


# --- voice (ElevenLabs) -------------------------------------------------------

def _voice_cache_dir() -> Path:
    return Path(__file__).resolve().parent / ".cache" / "jarvis_welcome"


def _voice_cache_path(text: str, voice_id: str, model_id: str, output_format: str) -> Path:
    key = f"{text}|{voice_id}|{model_id}|{output_format}".encode()
    digest = hashlib.sha256(key).hexdigest()[:24]
    return _voice_cache_dir() / f"{digest}.mp3"


def say_welcome() -> None:
    text = JARVIS_WELCOME_PHRASE.strip()
    if not text:
        return
    voice_id = (os.environ.get("ELEVENLABS_VOICE_ID") or "").strip()
    api_key = (os.environ.get("ELEVENLABS_API_KEY") or "").strip()
    model_id = (os.environ.get("ELEVENLABS_MODEL_ID") or "eleven_multilingual_v2").strip()
    output_format = "mp3_44100_128"
    if not voice_id or not api_key:
        log.warning(
            "ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID manquants dans .env — voix désactivée."
        )
        return

    cache_path = _voice_cache_path(text, voice_id, model_id, output_format)
    if not cache_path.is_file():
        try:
            from elevenlabs.client import ElevenLabs

            client = ElevenLabs(api_key=api_key)
            chunks = client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id=model_id,
                output_format=output_format,
                voice_settings={
                    "stability": 0.5,
                    "similarity_boost": 0.6,
                    "style": 0.0,
                    "use_speaker_boost": True,
                },
            )
            raw = b"".join(chunks)
        except Exception as e:
            log.warning("Échec ElevenLabs TTS: %s", e)
            return
        if not raw:
            log.warning("ElevenLabs a renvoyé un audio vide.")
            return
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = cache_path.with_suffix(".tmp")
        tmp.write_bytes(raw)
        tmp.replace(cache_path)
        log.info("Voix mise en cache: %s", cache_path)
    else:
        log.info("Voix rejouée depuis le cache: %s", cache_path)

    try:
        subprocess.Popen(["afplay", str(cache_path)])
    except OSError as e:
        log.warning("Impossible de jouer la voix (afplay): %s", e)


def run_double_clap_actions() -> None:
    open_vscode_app()
    open_safari_blank_on_second_screen()
    threading.Thread(target=say_welcome, daemon=True).start()


# --- clap detection ------------------------------------------------------------

def main() -> int:
    blocksize = block_samples()
    noise_floor = 1e-4

    # A clap is a short transient: level crosses the threshold, peaks, then falls
    # back under CONFIRM_DROP_RATIO of that peak within CONFIRM_DELAY_S. Tracking
    # "in transient" (rather than blocking on a fixed confirmation delay) lets a
    # second, fast-following clap start its own transient the instant the first
    # one ends, instead of being swallowed while the first is still being judged.
    in_transient = False
    transient_start = 0.0
    transient_peak = 0.0
    first_clap_time: float | None = None
    last_double_clap_time = 0.0

    log.info(
        "Écoute (double clap %.2f-%.2fs d'écart, %dHz, blocs de %dms). Ctrl+C pour arrêter.",
        MIN_DOUBLE_GAP_S,
        MAX_DOUBLE_GAP_S,
        SAMPLE_RATE,
        BLOCK_MS,
    )
    if DEBUG:
        log.debug("Mode debug actif: niveau/seuil affichés à chaque pic.")

    device = resolve_input_device()
    if device is not None:
        log.info("Micro forcé: [%d] %s", device, sd.query_devices(device)["name"])

    try:
        with sd.InputStream(
            device=device,
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="float32",
            blocksize=blocksize,
        ) as stream:
            while True:
                data, overflowed = stream.read(blocksize)
                if overflowed:
                    log.warning("Débordement audio; augmente BLOCK_MS si ça persiste.")

                level = rms_mono(data)
                now = time.monotonic()

                quiet_gate = noise_floor * QUIET_GATE_MULT
                if level < quiet_gate and not in_transient:
                    noise_floor = NOISE_FLOOR_ALPHA * noise_floor + (1.0 - NOISE_FLOOR_ALPHA) * level
                    noise_floor = max(noise_floor, 1e-7)

                threshold = max(noise_floor * SPIKE_RATIO, MIN_RMS)

                if not in_transient:
                    if level >= threshold and (now - last_double_clap_time) >= COOLDOWN_S:
                        in_transient = True
                        transient_start = now
                        transient_peak = level
                        if DEBUG:
                            log.debug(
                                "Pic détecté: niveau=%.4f seuil=%.4f noise_floor=%.5f",
                                level,
                                threshold,
                                noise_floor,
                            )
                    continue

                # In a transient: track its true peak, and end it as soon as the level
                # falls back under CONFIRM_DROP_RATIO of that peak (or after a timeout,
                # for a voice/music transient that never drops fast enough).
                transient_peak = max(transient_peak, level)
                elapsed = now - transient_start
                if level >= transient_peak * CONFIRM_DROP_RATIO and elapsed < MAX_DOUBLE_GAP_S:
                    continue

                is_clap = elapsed <= CONFIRM_DELAY_S
                if DEBUG:
                    log.debug(
                        "Fin du pic: pic=%.4f niveau_actuel=%.4f durée=%.3fs -> %s",
                        transient_peak,
                        level,
                        elapsed,
                        "clap" if is_clap else "voix/musique (ignoré)",
                    )

                clap_time = transient_start
                in_transient = False
                if not is_clap:
                    continue

                if first_clap_time is None:
                    first_clap_time = clap_time
                    continue

                gap = clap_time - first_clap_time
                if gap < MIN_DOUBLE_GAP_S:
                    continue  # too close together to be two distinct claps; keep waiting
                if gap > MAX_DOUBLE_GAP_S:
                    first_clap_time = clap_time  # too far apart; this clap starts a new pair
                    continue

                first_clap_time = None
                last_double_clap_time = clap_time
                log.info("Double clap détecté (écart=%.3fs) — lancement des actions", gap)
                threading.Thread(target=run_double_clap_actions, daemon=True).start()

    except KeyboardInterrupt:
        log.info("Arrêt.")
        return 0
    except sd.PortAudioError as e:
        log.error("Erreur audio: %s", e)
        log.error("Vérifie l'autorisation micro (Réglages Système > Confidentialité > Microphone).")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
