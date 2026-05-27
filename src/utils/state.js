/* =========================================================
   state.js — persistance localStorage + defaults
   Source unique de vérité pour palette + spotlight.
   ========================================================= */

const STORAGE_KEY = 'noa-state';

export const STATE_DEFAULTS = Object.freeze({
  palette: {
    '--c-cream': '#f4ede0',
    '--c-ink':   '#14110f',
    '--c-pink':  '#ff3d8c',
    '--c-green': '#1f8a5a',
    '--c-blue':  '#2856e8',
  },
  spotlight: {
    enabled:    true,
    radius:     220,  // px (base utilisée par les 2 spots avec un sizeMult)
    shadow:     55,   // % (opacité du noir périphérique)
    sharpness:  60,   // % (0 = très flou, 100 = très net)
    smoothness: 4,    // /100 = lerp speed par frame
  },
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(STATE_DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      palette:   { ...STATE_DEFAULTS.palette,   ...(parsed.palette   ?? {}) },
      spotlight: { ...STATE_DEFAULTS.spotlight, ...(parsed.spotlight ?? {}) },
    };
  } catch {
    return structuredClone(STATE_DEFAULTS);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
