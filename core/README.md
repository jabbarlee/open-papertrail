# core: the engine

Shared by every style in `styles/`. Knows nothing about any one style: it reads `styles/<id>/pack.json` and runs the
episode's own `scene.ts` and `sound.ts`. Entry point: `npm run studio -- <command>` (`cli.ts`).

| File | Does |
|---|---|
| `cli.ts` | Every pipeline step as a command: `new`, `pace`, `voice`, `clarity`, `timeline`, `stills`, `build`, `render`, `score`, `draft`, `export`, `qa`, `gate`, `list`, `doctor`, `variants` |
| `paths.ts` | Where things live (`styles/<id>/`, its `episodes/`, `examples/`, `pitches/`), episode lookup, script parsing |
| `types.ts` | Shared shapes: style pack config (incl. the voice), timeline, storyboard, episode |
| `scene.ts` | `defineScene` / `defineSound`, the contract every episode's scene.ts and sound.ts export |
| `canvas/runtime.ts`, `canvas/kit.ts` | The in-browser frame runtime and style-free 2D helpers (easing, seeded noise, measured text) |
| `render.ts` | Bundles a scene with esbuild, renders frames in headless Chrome (puppeteer-core), joins them with ffmpeg |
| `audio/` | Synthesized instruments (pluck, bell, pad, noise, sweep, kick, hat) and the mixer for `sound.ts` cues |
| `tts.ts` | The two voices: Qwen3-TTS through the local voice server, Kokoro on the CPU; WAV helpers |
| `voice.ts` | Voices a script in one take (or pieces), keeps the clearest of N takes, re-times it per line or keeps it uncut |
| `align.ts` | Word timings: a small local Whisper model hears the take, the script's words are matched onto it |
| `timeline.ts`, `captions.ts`, `platform.ts` | Shots snapped to the words, caption timing, TikTok/Reels safe zones |
| `qa.ts`, `export.ts` | Automated checks; final MP4 at -14 LUFS + .srt + caption |

## The scene contract
```ts
import { defineScene } from '../../../../core/scene.ts';
export default defineScene({
  fonts: [{ family: 'Inter', url: '/styles/flat-grain/fonts/Inter.ttf' }],   // served from the repo root
  setup({ W, H, tl }) { /* build caches, paint static layers */ },
  render(c, rt) {   // one frame; pure: everything from rt
    // rt.t seconds, rt.f frame, rt.shot (id, start, end, words), rt.local seconds into the shot, rt.p 0..1,
    // rt.tl.words (every spoken word with start/end), rt.text (push every text box here for QA)
  },
});
```
`sound.ts` default-exports `defineSound(tl => Cue[])` (or exports a `cues` array). Instruments: `audio/cues.ts`.
