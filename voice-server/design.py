"""Designs a brand-new synthetic voice from a written description (Qwen3-TTS VoiceDesign, Apache-2.0, on your Mac)
and saves it to the voice library, ready to clone: voices/<name>.wav + voices/<name>.txt.

    voice-server/.venv/bin/python voice-server/design.py <name> --describe "A calm man in his fifties, low, dry..." \
        [--text "what the sample says"] [--takes 3] [--seed 1]

It writes every take to voices/_candidates/<name>/ so you can listen and pick: --keep <n> copies take n into the
library. Without --keep, take 1 is kept. Nobody's real voice is involved, so you can use the result freely.
"""
import argparse
import os
import shutil

import mlx.core as mx
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = os.path.join(HERE, "..", "voices")
MODEL = os.environ.get("QWEN_DESIGN_MODEL", "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16")
DEFAULT_TEXT = ("Okay, so here's the thing nobody tells you. You can know exactly what you want to say, "
                "and still say something else entirely. And honestly? That's most of my week.")

p = argparse.ArgumentParser()
p.add_argument("name")
p.add_argument("--describe", required=True)
p.add_argument("--text", default=DEFAULT_TEXT)
p.add_argument("--takes", type=int, default=3)
p.add_argument("--seed", type=int, default=1)
p.add_argument("--keep", type=int, default=0, help="copy this take (1-based) into voices/ without generating")
a = p.parse_args()

cand = os.path.join(VOICES, "_candidates", a.name)
os.makedirs(cand, exist_ok=True)


def keep(n: int):
    shutil.copy(os.path.join(cand, f"take{n}.wav"), os.path.join(VOICES, f"{a.name}.wav"))
    with open(os.path.join(VOICES, f"{a.name}.txt"), "w") as f:
        f.write(open(os.path.join(cand, "text.txt")).read())
    print(f"voices/{a.name}.wav <- take {n}")


if a.keep:
    keep(a.keep)
    raise SystemExit(0)

from mlx_audio.tts.utils import load_model  # noqa: E402

model = load_model(MODEL)
text = " ".join(a.text.split())
with open(os.path.join(cand, "text.txt"), "w") as f:
    f.write(text + "\n")
with open(os.path.join(cand, "describe.txt"), "w") as f:
    f.write(a.describe + "\n")
for n in range(1, a.takes + 1):
    mx.random.seed(a.seed + n)
    parts = [np.array(r.audio, dtype=np.float32) for r in model.generate(text=text, instruct=a.describe, lang_code="english", split_pattern="\n")]
    audio = np.concatenate(parts)
    sf.write(os.path.join(cand, f"take{n}.wav"), audio, 24000, subtype="PCM_16")
    print(f"take {n}: {len(audio) / 24000:.1f}s -> voices/_candidates/{a.name}/take{n}.wav")
keep(1)
