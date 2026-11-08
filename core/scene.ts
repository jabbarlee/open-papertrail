// The contract between the engine and an episode's drawing code.
// An episode's scene.ts default-exports a Scene; its sound.ts default-exports a SoundSheet.
import type { Shot, Timeline, Word } from './types.ts';
import type { Cue } from './audio/cues.ts';

export interface FontFile { family: string; url: string; weight?: string; style?: string }

export interface TextBox { text: string; x0: number; y0: number; x1: number; y1: number; size: number }

export interface Runtime {
  W: number; H: number; FPS: number; NF: number;
  f: number;           // frame
  t: number;           // seconds
  tl: Timeline;
  shot: Shot;
  shotIndex: number;
  local: number;       // seconds since this shot started
  p: number;           // 0..1 through this shot
  word: Word | null;   // word being spoken now, if any
  text: TextBox[];     // every text box drawn this frame, read by QA
  params: URLSearchParams;
}

export interface SetupContext { W: number; H: number; tl: Timeline; params: URLSearchParams }

export interface Scene {
  fonts?: FontFile[];
  setup?(ctx: SetupContext): void | Promise<void>;
  render(c: CanvasRenderingContext2D, rt: Runtime): void;
}

export type SoundSheet = (tl: Timeline) => Cue[];

export const defineScene = (s: Scene): Scene => s;
export const defineSound = (s: SoundSheet): SoundSheet => s;
