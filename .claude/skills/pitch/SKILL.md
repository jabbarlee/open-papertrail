---
name: pitch
description: Writes about 10 raw video pitches for one style (flat-grain, ink-line, knife-paint, painted, or a style the user added) - each with an exact spoken hook, a payoff, the story beats and what's on screen - following the style's FORMAT.md. Never judges its own pitches; the critic agent does. Use from /make, or when the user asks for video ideas in a style.
---

# pitch

Input: a style id, and optionally a theme or audience the user gave. Read `styles/<style>/FORMAT.md` (all of it) and
`DESIGN.md`, the example episodes' `script.txt` in `styles/<style>/examples/`, the user's own made episodes in
`styles/<style>/episodes/*/script.txt`, and earlier rounds in `styles/<style>/pitches/` (`*.json` survivors,
`*.killed.md` kills). Never repeat an idea that was made or killed.

## How to think
Don't start from a hook template. Start from the material the format runs on and work toward the hook:
- **flat-grain:** list things people privately feel and have never heard explained (at home, at the table, in the
  chat, in bed at night). For each, find the honest answer in under 10 words. Keep it only if a stranger would say
  "that's so me" at the answer. Then write the hook they'd recognise at once.
- **ink-line:** list real objects in ordinary lives that behave in a specific way (a scheduled email, a shared album,
  a read receipt, a voicemail, a calendar invite). Find a small true-feeling story where that exact behaviour turns
  it. The ending reframes everything and can't be guessed from the hook.
- **knife-paint:** find true chains of events (research them on the web) from a surprising, checkable fact to
  something the viewer owns or uses today. Note a source for every link.
- **painted:** list ordinary errands; for each, one wrong thing visible in a single glance, played straight; find the
  turn that opens a new question and the button.
- **Your own style:** follow its `FORMAT.md` the same way: material first, hook last.

Write everything in plain words a tired person gets in one hearing. If a line is clever, it's probably wrong.
Every pitch names `sendTo`: the one person a viewer would send it to, as a relationship.

## Output
Write ~10 to `styles/<style>/pitches/pitches-<YYYY-MM-DD>.raw.json` (add `-r2` for a second round that day):
```json
[{
  "id": "<date>-<style>-<slug>",
  "style": "<style>",
  "title": "Fifteen",
  "hook": "Why do you turn fifteen the second you go home?",
  "hookMechanic": "felt-question",
  "story": "The idea in one line. Then the beats in plain words, in order. Then what we see: the place, the thread object or hero prop, the mute-readable hook frame, the ending picture.",
  "payoff": "In your head, your mom is still forty.",
  "sendTo": "my mom",
  "logic": "Why each event happens, and (for real objects or facts) how the thing really works, with sources for facts."
}]
```
`hook` and `payoff` are the exact spoken lines. Don't score or rank your own pitches; hand the file to the critic.
