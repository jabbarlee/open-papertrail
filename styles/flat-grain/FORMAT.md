# Format: Flat Grain

**Relatable explainers.** One narrator tells you why you feel something you've felt but never explained, while one
simple drawn idea acts it out. The viewer is the subject, not a character. 20-30 seconds.

Look: `DESIGN.md`. Voice: `VOICE.md`. Worked example: `examples/` (read its `script.txt`, `scene.ts`, `sound.ts`).

## The whole video in one line
**A question you've privately asked yourself, a plain answer you recognise at once, and a last line that turns it
back on you.**

| Hook | The idea | The last line |
|---|---|---|
| You have friends, so why do you feel this alone? | They know your jokes, not your week. | The whole table goes home feeling the same. |
| Why do you turn fifteen the second you go home? | That house only knows you at fifteen. | In your head, your mom is still forty. |
| Why do you still remember the dumb thing you said in 2019? | You're the only one who remembers it. | Someone's lying awake over what they said to you, and you can't remember it. |

## 1. The idea
Start with one question: **what does a person privately feel but can't explain?** Then ask what the honest answer
is. No answer they'd recognise, no video.

- **A feeling, not a situation.** "You feel alone around friends" reaches everyone. "You have an unanswered text"
  only reaches people holding one.
- **A feeling, not a finding.** Never start from a study or a named effect.
- **Most people have felt it this month.**
- **One idea, said in under 10 words.** If it needs a chain of causes, drop it.
- **Never:** clinical words, diagnosing, mental-health claims.
- **The swap test:** if the script still works about a different feeling, it's generic. Start again.
- **The send test:** name the one person a viewer would send this to, as a relationship ("my mom", "the friend who
  never replies"), and what they'd mean by it ("this is us"). No person, no video. Feelings that sit between two
  people (a parent, a sibling, a best friend, the group chat) travel further than purely private ones. Put it in
  `episode.json` as `sendTo`. Never write "send this to" in the hook or caption.

## 2. The hook
- **Plain words a tired person gets in one hearing.** No metaphor to decode, nothing clever.
- **Name the pain and leave the answer open.** The viewer must need the "because…".
- **Say "you".**
- **A contradiction is the strongest engine:** two true things that shouldn't both be true.
- **One specific thing makes it real:** "fifteen", "2019", "strangers".
- **10-13 words, finished by about 2.8 seconds.** Say it out loud: if it sounds written, rewrite it.

| Weak | Why | Strong | Why |
|---|---|---|---|
| "You're not ignoring them. The reply just got heavier." | Clever metaphor, sounds finished | "Why do you reply to strangers in seconds, but not the people you love?" | Everyone does it, and it demands an answer |
| "You're not bad at keeping in touch. You just need a reason." | No pain, no gap | "You have friends, so why do you feel this alone?" | Private feeling, plain words, contradiction |

### Hook types (`hookMechanic` in episode.json)
| Type | Example on one idea | What it does |
|---|---|---|
| `felt-question` | Why do you turn fifteen the second you go home? | Asks what they've privately asked |
| `stated-contradiction` | You're a grown adult, and your mom can still make you roll your eyes. | The same tension, as recognition |
| `hard-truth` | Your family has never met the adult you. | Stings, so they need to hear why |
| `held-back-reason` | You turn fifteen at home for one reason. | Promises the answer outright |
| `type-of-person` | People who run their whole lives still turn fifteen at home. | The viewer tags themselves or a friend |

Avoid "Have you ever…", "you won't believe…", comfort lines and anything that needs decoding.

## 3. The explanation
Five sentences, 70-90 words:
1. **The hook.**
2. **The moment:** one scene they've lived, with a day, a phrase or an object. "Your mom says take a coat and you roll your eyes."
3. **The answer:** "And it's because…", in plain words, by about 8 seconds.
4. **The proof:** it lands one more time, or goes further.
5. **The flip:** one sentence turns it back on the viewer, so the feeling means something new. It has an edge. Never
   a moral, a tip or a comfort line.

**Keep it simple.** Each sentence is one thought, 27 words at most. A viewer who looks away for one line can still
follow the next. The flip takes one step. **The stranger test:** after one watch, can someone repeat the point in a
sentence? No facts unless they're sourced; most scripts need none (`sources.json` is `[]`).

## 4. The voice
No hard stops between sentences: the style voices the whole script in **one uncut take** (`"cut": "never"` in
`pack.json`). Start sentences with "And", "So", "Because" so they run on when spoken. Keep scripts under ~30 s.

## 5. The picture
- **One place.** One house cut in half; one bed plus the table from the memory. Up to 3 scenes.
- **One thread object** carries the idea from start to finish and changes: a dot, a gold age tag, a glowing screen.
- **The hook is a visual gag that works on mute.** You walk through the door and shrink as your tag drops from 32 to 15.
- **Every scene grows out of the last.** Wipes come from the thread object, or one shape turns into the next. No plain cuts.
- **The drawing acts out the sentence as it's said.** Something visibly changes every 2 seconds or so.
- **Short words on screen do the joking:** "TAKE A COAT!", "1 WATCHING". A number that ticks is a strong device.
- **Make it loop.** The last picture rhymes with frame 1 (the same room, tag or object, changed).
- **The ending is a silent reveal.** 2-3 seconds after the last word: a number ticks, the camera pulls out.
- **Numbers must add up.** You 32, Mom 40 when you were 15, so she's 57 now.
- **A recurring "you":** black hair, green jumper, crimson skin, so viewers know the world.
- **Frame 1 is finished,** never drawing itself on, and **shows the whole hook**: the first caption chunk holds the
  entire hook (up to 2 lines) from frame 1. Call `makeCaptions(said, lines, key, <hook word count>)`; it throws if
  chunk 0 is shorter.
- **Captions** in one fixed dark band, word by word, key words in gold, two lines at most. Push every text box to
  `rt.text` (via `boxes`) so QA checks it.

### Drawing checks
- A `forced` mouth reads as a grin. A worried or embarrassed face is `flat`.
- Heads must not overlap: keep busts at least 230 px apart, or the faces merge.
- White `bob` hair reads as old; use it only for age.
- A lying figure needs the blanket to cover the whole torso.
- Speech-bubble tails point at the mouth of whoever's speaking.

## 6. The caption
One lowercase question about the viewer's own life, then two hashtags.

## 7. Timeline
This style times shots by word index, not by storyboard text:
`npx tsx styles/flat-grain/components/timeline.ts <episode> <tail seconds> '[["s01",0,"what we see"],["s02",10,"..."]]'`
Each shot is `[id, index of its first word in words.json, what it draws]`. 8-12 shots; tail 2-3 s for the silent reveal.
