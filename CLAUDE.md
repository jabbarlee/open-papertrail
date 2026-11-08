# open-papertrail: map for Claude

Vertical videos (1080x1920, 30 fps, 10-55 s) drawn entirely in code. One engine (`core/`) renders every **style**;
each style is one folder holding everything about its look and format. The user makes videos by talking to you;
the skills hold the method.

```
core/                    the engine: CLI, render (esbuild + headless Chrome + ffmpeg), voice, timeline, QA, export
styles/<id>/             one style
  pack.json              video size/fps, length limits, voice, pace (read by core)
  FORMAT.md              story rules: what an episode is, hooks, structure, dead zones
  DESIGN.md              the look, as rules
  VOICE.md               the voice and how to script for it
  MAKE.md                the build recipe the skills follow (write, animate, look check)
  components/            drawing, captions and sound code for this style only
  fonts/                 OFL fonts (FONTS.md)
  examples/<slug>/       worked examples: copy their structure (script, storyboard, scene.ts, sound.ts)
  episodes/<date>-<slug>/ the user's videos
  pitches/               pitch rounds: pitches-<date>.raw.json -> .json (critic survivors) + .killed.md
voices/                  voice library: <name>.wav + <name>.txt (Qwen clones these)
voice-server/            local Qwen3-TTS server for Apple Silicon (MLX)
examples/                finished MP4s, posters and strips of the examples
.claude/skills/          make, pitch, write, animate, finish, new-style, new-character
.claude/agents/          critic, look-checker
```

Styles: `flat-grain` (relatable explainers), `ink-line` (first-person object stories, no characters), `knife-paint`
(true chains of events, fact-checked), `painted` (deadpan errands, lead Otto).

## Rules
- Start with `/make` for any "make a video" request. Read the style's `FORMAT.md`, `DESIGN.md`, `VOICE.md`, `MAKE.md`
  and its example before writing anything.
- A style's files go in `styles/<id>/` only. Nothing style-specific goes in `core/`. Episodes never edit components
  for one video: one-off drawing goes in the episode's `scene.ts`.
- Episode code imports the engine as `../../../../core/...` and its style as `../../components/...`.
- Time every visual beat from the spoken words (`words.json`), never fixed seconds.
- The critic and look-checker run as subagents so they judge with fresh eyes. Don't skip them, don't judge your own
  pitches.
- Facts need sources (`sources.json`), checked on the web. Never ship an unverified claim.
- Never imitate a real person's voice, face or name for content they didn't make; never clone a voice the user doesn't
  own. Don't publish anything anywhere: the user posts their own videos.
- Renders (`build/`, `stills/`, `preview/`, `*.mp4`, `*.wav`) are gitignored; sources stay in git.

## An episode folder
| File | Written by |
|---|---|
| `episode.json` | `new`, then /write (hook, caption, hashtags, gates) |
| `script.txt` | /write: one spoken line per row, `{pause=0.4 say="..." speaker="x"}` notes |
| `storyboard.json` | /write: shots with the exact words they cover (flat-grain builds its timeline from word indexes instead) |
| `voice.mp3`, `words.json`, `clarity.json` | `voice` |
| `timeline.json` | `timeline` |
| `scene.ts`, `sound.ts` | /animate |
| `<slug>.mp4`, `<slug>.srt`, `caption.txt` | `export` |
| `qa.json`, `sources.json` | `qa`, /write |
