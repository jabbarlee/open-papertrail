---
name: make
description: Makes one finished vertical video (1080x1920 MP4 with voice, captions and sound) in one of the repo's styles, end to end - idea, critic, script, voice, animation in code, render, QA. Stops only to let the user pick the idea and approve the script, unless they say "auto". Use when the user says "make a video", "make an episode", "/make", names a style (flat-grain, ink-line, knife-paint, painted) or gives an idea to turn into a video.
---

# make

You are the director. The engine is in `core/`, each look is a folder in `styles/<style>/`. Read `CLAUDE.md` first if
you haven't this session.

## 0. Settle the brief (one question at most)
- **Style.** If the user named one, use it. If not, pick from the idea (a felt "why do I…" → `flat-grain`; a
  first-person story about an object in someone's life → `ink-line`; a true chain of events from history or science →
  `knife-paint`; a deadpan errand where one thing is wrong → `painted`) and say which you picked. Ask only if it's
  truly unclear.
- **Idea.** If the user gave one, skip to step 2 (still run the critic on it if they want feedback; never block on it).
- **"auto"** in the request: no stops; pick the critic's #1 and approve gates yourself, noting why.

Read the style's `FORMAT.md`, `DESIGN.md`, `VOICE.md` and `MAKE.md`, and the example in `styles/<style>/examples/`
(its `script.txt`, `storyboard.json` if any, `scene.ts`, `sound.ts`). Those are the bar.

## 1. Ideas
Run `/pitch <style>` (it writes ~10 raw pitches to `styles/<style>/pitches/pitches-<date>.raw.json`), then the
**critic agent** (`.claude/agents/critic.md`) on that file in a fresh subagent: it never saw them written, kills most
and keeps at most 3. Show the user the survivors (title, hook, payoff, the critic's line) and let them pick one, or
edit one. With "auto", take #1. Zero survivors: pitch again once, then tell the user.

## 2. Write
Run `/write` with the picked pitch: it creates the episode folder, `script.txt`, `episode.json` and (for most styles)
`storyboard.json`. Then show the user the script and ask for approval (skip with "auto"). Record it:
`npm run studio -- gate <ep> --gate script --note "<who approved, why>"`.

## 3. Voice
`npm run studio -- voice <ep>`. It uses the local Qwen voice server if it's running (`npm run voice:up`), otherwise
Kokoro, and says which. If it reports a word not heard, reword or respell that line (`{say="..."}` keeps the caption)
and voice again. Then the timeline: `npm run studio -- timeline <ep>` (flat-grain has its own; see its `MAKE.md`).

## 4. Animate
Run `/animate <ep>`: `scene.ts` + `sound.ts`, then stills checked by the **look-checker agent** against `DESIGN.md`
until they pass. This is the longest step; keep going until the stills are right.

## 5. Finish
Run `/finish <ep>`: render, score, export, QA, fix rounds, gates. Report to the user: the MP4 path, its length, the
caption (`caption.txt`), the voice used, and anything QA warned about. Offer one round of changes.

## Rules
- Build exactly what was picked. Don't add morals, tips, comfort lines or a "follow for more".
- Time every beat from the words (`words.json`), never fixed seconds, so a re-voice lines up by itself.
- Don't edit `core/` or another style's components for one episode; new drawing code goes in the episode's `scene.ts`.
  Something reusable for the style goes in `styles/<style>/components/` with a line in its README.
- Never publish anything anywhere. The user posts the MP4 themselves.
