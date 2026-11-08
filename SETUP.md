# Setup

## 1. The basics (every machine)

```bash
npm install          # Node 20+; installs esbuild, puppeteer-core, ffmpeg-static, kokoro-js, transformers.js
npm run doctor       # what's installed, what's missing
```

- **Chrome.** The renderer drives a headless Chrome. It finds Google Chrome or Microsoft Edge in the usual places.
  Without one: `npm run setup:chrome` downloads Chrome for Testing's headless shell into `.cache/`. Or point
  `CHROME_PATH` at any Chromium in `.env`.
- **npm 11 asks before running install scripts.** `package.json` already allows the five that are needed (esbuild,
  ffmpeg-static, onnxruntime-node, protobufjs, sharp). If `npm install` warns anyway, run
  `npm install-scripts approve esbuild ffmpeg-static onnxruntime-node protobufjs sharp && npm rebuild`.
- **First voice run** downloads Kokoro (~90 MB) and Whisper base (~80 MB) from Hugging Face into
  `node_modules/@huggingface/transformers/.cache/` (set `STUDIO_MODEL_CACHE` to keep them elsewhere).

That's enough to make videos: the voice is Kokoro.

## 2. Better voices: Qwen3-TTS on your Mac (Apple Silicon)

Qwen3-TTS clones the six voices in `voices/` and reads a whole script in one natural take. It runs locally through
Apple's MLX framework (`mlx-audio`).

```bash
npm run voice:setup    # one time: voice-server/.venv, mlx-audio, and the model (~2 GB, mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit)
npm run voice:up       # starts the voice server on 127.0.0.1:7865; leave it running in its own terminal
```

Now `npm run studio -- voice <episode>` prints `voice: qwen "fern"` instead of Kokoro. `npm run doctor` shows it as `ok`.

- **Speed:** on an 8 GB M3, a 20-second script takes about 40 seconds per take (the default is up to 3 takes; the
  clearest is kept). Newer and bigger chips are faster.
- **Memory:** the 1.7B model in 8-bit uses about 3 GB. On an 8 GB Mac, close heavy apps while voicing. For less memory,
  `QWEN_MODEL=mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16 npm run voice:up` (download it once with
  `QWEN_MODEL=... npm run voice:setup`).
- **Another port:** `QWEN_PORT=7999 npm run voice:up` and `QWEN_URL=http://127.0.0.1:7999` in `.env`.
- **Force a provider for one run:** `npm run studio -- voice <ep> --provider kokoro` (or `qwen`).

### Not on Apple Silicon?
Kokoro works everywhere. The voice server is small (`voice-server/server.py`): anything that answers
`POST /tts {text, voice, seed, temperature}` with a 24 kHz WAV and `GET /health` works, so on Linux with an NVIDIA
GPU you can swap mlx-audio for the official `qwen-tts` package and keep the same API.

## 3. Design your own voices (optional)
```bash
voice-server/.venv/bin/python voice-server/design.py nora --describe "A woman in her seventies, warm and amused"
```
Downloads the VoiceDesign model once (~4 GB). See `voices/README.md`.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `No Chrome or Edge found` | `npm run setup:chrome`, or set `CHROME_PATH` |
| `fetch failed` on the first voice run | The model download needs internet once; check your connection or proxy |
| `best take only 80% heard` | Whisper couldn't hear a word: spell numbers out, reword the line it lists, or respell it with `{say="..."}` |
| Voice server says `loading the model` | The first start downloads/loads the model; wait for `qwen ready` in its terminal |
| Render runs out of memory | `npm run studio -- render <ep> --workers 1` |
| QA fails `text ... right button column` | Move that text left or up in `scene.ts`; the platform's buttons cover it |
