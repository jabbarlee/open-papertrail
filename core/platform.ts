// Where TikTok and Instagram Reels draw their own UI over a 1080x1920 video. Format-agnostic:
// every pack places its captions in CAPTION_BAND and keeps all text out of these zones.
export const PLATFORM_UI = {
  top: 150,        // For You / Following tabs, search, LIVE badge
  bottom: 400,     // username, description, sound/audio row
  right: 170,      // like / comment / save / share / sound column…
  rightFrom: 950,  // …which starts about here and runs down to the bottom area
  side: 60,        // breathing room on both edges
};

// On-screen captions sit here: under the picture, above the UI, clear of the button column.
export const CAPTION_BAND = { top: 1250, bottom: 1920 - PLATFORM_UI.bottom, left: 70, right: 1080 - PLATFORM_UI.right - 10 };

// Baselines for `lines` lines of `size` px text, bottom-anchored in the band (descenders stay inside).
export function bandBaselines(lines: number, size: number, lineHeight = 1.05): number[] {
  const last = CAPTION_BAND.bottom - size * 0.28;
  return Array.from({ length: lines }, (_, i) => last - (lines - 1 - i) * size * lineHeight);
}
