"""The local voice server: Qwen3-TTS (Apache-2.0) on Apple Silicon through MLX (mlx-audio), on 127.0.0.1 only.

It clones the voices in ../voices/: each voice is <name>.wav (a clean 5-20 s sample, one speaker, 24 kHz mono) plus
<name>.txt (exactly what the sample says). The engine (core/tts.ts) calls it; nothing leaves your Mac.

POST /tts     {"text", "voice", "seed"?, "temperature"?}  -> audio/wav (24 kHz mono, 16-bit), the whole text in one take
GET  /health  -> {"ok", "model", "voices"} once the model is loaded
GET  /voices  -> {"voices": [...]}

Run it with `npm run voice:up` (voice-server/run.sh). Model: $QWEN_MODEL, else chosen by run.sh from your RAM.
"""
import io
import os
import re
import threading
import time

import mlx.core as mx
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = os.environ.get("VOICES_DIR", os.path.join(HERE, "..", "voices"))
MODEL = os.environ.get("QWEN_MODEL", "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit")
NAME = re.compile(r"^[a-z0-9][a-z0-9_-]{0,40}$")

app = FastAPI()
state = {"model": None, "error": None}
lock = threading.Lock()


def voices() -> list[str]:
    if not os.path.isdir(VOICES):
        return []
    return sorted(f[:-4] for f in os.listdir(VOICES) if f.endswith(".wav") and NAME.match(f[:-4]) and os.path.exists(os.path.join(VOICES, f[:-4] + ".txt")))


def load():
    try:
        from mlx_audio.tts.utils import load_model
        t0 = time.time()
        state["model"] = load_model(MODEL)
        print(f"qwen ready: {MODEL} in {time.time() - t0:.0f}s; voices: {', '.join(voices()) or '(none)'}", flush=True)
    except Exception as e:  # reported by /health
        state["error"] = repr(e)
        print(f"qwen failed to load: {e!r}", flush=True)


threading.Thread(target=load, daemon=True).start()


@app.get("/health")
def health():
    if state["error"]:
        raise HTTPException(500, state["error"])
    if state["model"] is None:
        raise HTTPException(503, "loading the model (the first run downloads it)")
    return {"ok": True, "model": MODEL, "voices": voices()}


@app.get("/voices")
def list_voices():
    return {"voices": voices()}


class Req(BaseModel):
    text: str
    voice: str
    seed: int | None = None
    temperature: float | None = None


@app.post("/tts")
def tts(req: Req):
    if state["model"] is None:
        raise HTTPException(503, state["error"] or "model still loading")
    if not NAME.match(req.voice) or req.voice not in voices():
        raise HTTPException(400, f"unknown voice {req.voice!r}: use one of {voices()}")
    wav = os.path.join(VOICES, f"{req.voice}.wav")
    ref_text = open(os.path.join(VOICES, f"{req.voice}.txt")).read().strip()
    text = " ".join(req.text.split())  # one line: mlx-audio splits on newlines, and we want one take
    with lock:
        if req.seed is not None:
            mx.random.seed(req.seed)
            np.random.seed(req.seed)
        parts = [np.array(r.audio, dtype=np.float32) for r in state["model"].generate(
            text=text, ref_audio=wav, ref_text=ref_text, temperature=req.temperature, lang_code="english", split_pattern="\n")]
    audio = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, audio, 24000, subtype="PCM_16", format="WAV")
    return Response(buf.getvalue(), media_type="audio/wav")
