---
name: finish
description: Finishes an animated episode - renders the video in headless Chrome, synthesizes the sound, exports the final 1080x1920 MP4 at -14 LUFS with an .srt and caption, runs the automated QA (length, hook timing, talking speed, pacing, text size and safe zones, sync, sources, gates), fixes and re-renders only broken shots, and records the approvals. Use from /make after /animate, or when asked to render, export or QA an episode.
---

# finish

Input: an episode with `scene.ts`, `sound.ts`, `timeline.json` and `voice.mp3`.

1. `npm run studio -- render <ep>` → `video.mp4` (picture only). Renders in parallel workers; `--workers 2` on a
   machine with little memory. `--shots s03,s05` re-renders only those shots.
2. `npm run studio -- score <ep>` → `score.wav` / `sfx.wav` from `sound.ts`.
3. `npm run studio -- export <ep>` → `<slug>.mp4` (picture + voice + sound, loudness -14 LUFS), `<slug>.srt`,
   `caption.txt` (the caption, plus citations from `sources.json`), `hooks.txt`.
4. `npm run studio -- qa <ep>`. Read every line:
   - **FAIL** must be fixed. Text in a platform zone: move it in `scene.ts`. A word not heard: reword the line and
     re-voice (`voice`, then `timeline`, then render again). A shot too short or long: adjust the storyboard and timeline.
   - **WARN**: judge it; `MAKE.md` lists warnings that are expected for the style.
   - It names shots to re-render; use `render <ep> --shots ...`, then `score`, `export`, `qa` again.
   Up to 3 fix rounds. If it still fails, tell the user what's wrong instead of hiding it.
5. Gates: the script gate is recorded in /write or /make; record the look once the stills passed and the video plays
   right: `npm run studio -- gate <ep> --gate look --note "<why>"`. Then `qa` once more so the gates count.
6. Watch it yourself: `npm run studio -- stills <ep> --at 0,<middle>,<end-0.5>` from the final timeline and open them.
   Frame 1 stops a thumb; the payoff lands; the last frame leads back into the first.

Report the final MP4 path, its length, the voice used (`voice.provider`), the caption, and any warnings left.
