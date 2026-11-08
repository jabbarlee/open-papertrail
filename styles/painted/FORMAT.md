# Format: Painted

**Third person, with a deadpan narrator.** A dry documentary voice tells us what the lead is doing; the lead rarely
speaks. We watch them do one ordinary errand: order a coffee, get a haircut, buy one thing, wash clothes, post a
letter, return something. One specific thing about it is wrong, and **everyone plays it completely straight**.
20-30 seconds. Look: `DESIGN.md`. Voice: `VOICE.md`. Components: `components/README.md`. Worked example: `examples/`.

## The series in one line
**Your lead runs errands. Something is always slightly off, and only the people serving them notice.**

The shipped lead is **Otto** (`components/cast/otto.ts`): tall flopped beanie, sleeves that swallow his hands, tired
under-eye lines. You can use him, or design your own lead with the `/new-character` skill (rules in `DESIGN.md`).

## What an episode is
- **One place, one errand, one wrong thing.** The wrong thing is specific and visible in a single glance (a hat they
  won't take off at the barber; a drawn stamp at the post office). If it needs explaining, it's the wrong idea.
- **Played straight.** The lead is calm, polite, sure that this is normal. The staff react with eyes, a pause, one or
  two words. Nobody winks at the camera, nobody explains the joke, nobody learns anything.
- **It escalates once or twice, then turns.** The turn lands around 60-70% of the way through and opens a new
  question (the cup gets filled with milk and put on the floor: who is it for?).
- **It ends on a button, not a moral:** a callback, a small reveal, a second customer who does the same thing. The
  last shot can loop into the first.

## The hook (line 1 + frame 1)
The narrator's first line states the strange fact plainly, and frame 1 shows it at the same time ("Every morning,
this café writes Otto's name on a cup." over the cup in the window). **If a viewer has to decode the picture, the
idea is wrong.** Also:
- Frame 1 shows the wrong thing **already happening**, mid-action, readable by a 10-year-old with no context.
- At most one short line of dialogue on it, as a handwritten caption (≤ 5 words).
- The viewer must be holding a question by 1 second ("who is that cup for?"), and the answer must be something they
  want to see, not hear. Never give the turn away in frame 1.

## Voice and captions
The narrator says every beat in short third-person sentences, 55-75 words, each line paired with the shot that shows
it. The narration also appears as handwritten subtitles top-left (Gaegu). Characters' own lines are rare, ≤ 5 words,
as captions. The best stories have a real mystery in line 1 and a plain, true answer.

## Length and shape
20-30 s, 10-12 shots, hard cuts, each cut on the narrator's line. Sitcom grammar: wide (place + people) → inserts on
the thing → reaction close-ups → the turn → button. A new picture every 1.5-3 s.

## Cast
- **The lead:** in every episode. Says very little. Never explains themselves. Never wrong in their own eyes.
- **The person serving them:** one per place (barber, barista, cashier, clerk), designed per `DESIGN.md`. They carry
  the reactions. Shipped: `mae` (barista), `sal` (barber), `dex` (a friend), `cat`.
- **Bystanders:** one or two at most, usually as the button.

## Dead zones
The lead's inner monologue or first-person narration · talking to camera · a gag the viewer has to decode ·
"relatable" sketches anyone could post · brand names or real stores · pop-culture parody · sad, sweet or moral
endings · the staff explaining the joke · a twist that's a dream, a prank or "it was all fake" · more than one wrong
thing per episode.

## Sound
Room tone of the place, close foley for every touch (door bell, pour, cup down, marker), no music under the narrator,
a single sting on the payoff (`components/sfx.ts`).
