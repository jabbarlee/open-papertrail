#!/bin/bash
# One-time setup of the local voice server (Qwen3-TTS through MLX). Apple Silicon Macs only.
# Creates voice-server/.venv, installs mlx-audio, and downloads the voice model (~2 GB) into ~/.cache/huggingface.
set -euo pipefail
cd "$(dirname "$0")"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "The Qwen voice server needs an Apple Silicon Mac (M1 or newer). Kokoro still works everywhere: skip this step." >&2
  exit 1
fi

PY=""
for c in python3.13 python3.12 python3.11 python3.14 python3; do
  if command -v "$c" >/dev/null && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then PY="$c"; break; fi
done
if [[ -z "$PY" ]]; then
  echo "Python 3.10 or newer is needed: brew install python@3.12" >&2
  exit 1
fi

echo "Using $($PY --version) to create voice-server/.venv"
"$PY" -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

MODEL="${QWEN_MODEL:-mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit}"
echo "Downloading $MODEL (one time)..."
.venv/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('$MODEL')" >/dev/null
echo "Done. Start it with: npm run voice:up"
