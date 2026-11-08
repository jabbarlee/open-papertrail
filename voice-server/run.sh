#!/bin/bash
# Starts the local voice server on 127.0.0.1:7865 (QWEN_PORT to change it). Leave it running while you make videos;
# Ctrl+C stops it. The engine finds it by itself (QWEN_URL in .env if you moved it).
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -x .venv/bin/python ]]; then
  echo "Run the one-time setup first: npm run voice:setup" >&2
  exit 1
fi
export QWEN_MODEL="${QWEN_MODEL:-mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit}"
exec .venv/bin/python -m uvicorn server:app --app-dir . --host 127.0.0.1 --port "${QWEN_PORT:-7865}" --log-level warning
