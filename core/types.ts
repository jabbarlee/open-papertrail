// Shared shapes for the pipeline. Nothing here knows about any format pack.

// Who speaks the voiceover, both on your own machine (core/tts.ts): `qwen` clones voices/<voiceId>.wav through the local
// voice server (voice-server/), `kokoro` runs on the CPU with no setup. `auto` (the default) uses Qwen when the voice
// server is running, else Kokoro. Word timings come from a small local Whisper model either way.
export interface VoiceConfig {
  provider?: 'auto' | 'qwen' | 'kokoro';
  voiceId: string;                     // a voice in voices/ (see voices/README.md)
  temperature?: number;                // Qwen sampling temperature, ~0.9 calm to ~1.1 lively
  speed?: number;                      // pitch-preserving tempo applied to the take
  takes?: number;                      // Qwen tries per piece, the clearest kept (default 3)
  cut?: 'lines' | 'never';             // lines: re-timed with each line's pause; never: one uncut take
  pieceWords?: number;                 // longest piece said in one generation (default 60; "never" defaults to the whole script)
  minClarity?: number;                 // share of script words Whisper must hear (default 0.9)
  kokoro: { voiceId: string; speed?: number };   // the voice used when Qwen isn't running
}

export interface PackConfig {
  id: string;
  name: string;
  video: { width: number; height: number; fps: number; minSeconds: number; maxSeconds: number };
  voice: VoiceConfig;
  // Estimated speaking pace, used for timing before the real voice exists. readCharsPerSecond sets how long an
  // unvoiced (speaker) line stays on screen when it has no hold= of its own (default 15).
  pace: { wordsPerSecond: number; linePause: number; readCharsPerSecond?: number };
  // Seconds of picture after the last spoken word (end card, or a short tail when the episode skips it).
  tail: { endCardSeconds: number; noEndCardSeconds: number };
  // Seconds the picture leads the voice on each cut, so the image is there when the word lands.
  cutLeadSeconds: number;
  // true mixes the style's synthesized music bed into the export; false (default) keeps only voice + sound effects.
  musicBed?: boolean;
  // Hashtags added after each episode's own (without #). The caption carries 3-5 in all.
  hashtags?: string[];
}

export interface Word { text: string; start: number; end: number }

// speaker is set on lines shown but not spoken (on-screen dialogue); the voiceover has none.
export interface Line { text: string; start: number; end: number; speaker?: string }

export interface StoryboardShot {
  id: string;
  // Exact script words this shot covers. Empty only for shots after the voice ends (end card, tail).
  words: string;
  draw: string;
  moves: string;
  // What visibly changes on the cut into this shot: angle, scale, scene or motion.
  change: string;
  // Seconds, only for shots with no words.
  seconds?: number;
  // Optional cut timing: lead = seconds the cut comes before this shot's first word (default: the pack's cutLeadSeconds),
  // for a held beat before a line; hold = seconds the last spoken shot stays after its last word before a wordless
  // shot (default 0.2).
  lead?: number;
  hold?: number;
  title?: string;
}

export interface Shot extends StoryboardShot { start: number; end: number; firstWord: number; lastWord: number }

export interface Timeline {
  fps: number;
  width: number;
  height: number;
  duration: number;
  words: Word[];
  lines: Line[];
  shots: Shot[];
  endCard: boolean;
}

export interface Source {
  claim: string;
  verdict: 'confirmed' | 'reworded' | 'killed';
  authors: string;
  year: number;
  title: string;
  outlet: string;
  url: string;
  note: string;
}

export interface Episode {
  format: string;
  slug: string;
  date: string;
  title: string;
  hook: string;
  altHooks: string[];
  caption: string;
  // Set by the script stage: 2-3 topical hashtags (without #); the pack's hashtags are added after them.
  hashtags?: string[];
  endCard: boolean;
  endCardLine?: string;
  // Set by the hook stage: the mechanic behind the chosen hook and what frame 1 shows.
  hookMechanic?: string;
  visualHook?: string;
  onScreenHook?: string;
  // Set by the pitch: who a viewer would send it to (a relationship, e.g. "my mom").
  sendTo?: string;
  // Per-episode voice override, merged over the style's voice (e.g. another voice or speed).
  voice?: Partial<Omit<VoiceConfig, 'kokoro'>> & { kokoro?: Partial<VoiceConfig['kokoro']> };
  gates: { pitch?: string; script?: string; look?: string };
  variantOf?: string;
}

export interface HookVersion {
  id: string;
  mechanic: string;
  line: string;
  shot: StoryboardShot;
}
