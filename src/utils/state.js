/* =========================================================
   state.js — persistance localStorage + defaults
   Source unique de vérité pour palette + spotlight.
   ========================================================= */

const STORAGE_KEY = 'noa-state';

export const STATE_DEFAULTS = Object.freeze({
  palette: {
    /* Palette officielle du salon (DA "noa") — appliquée par défaut.
       Le preset "default" dans palette.js conserve la palette flashy
       d'origine, accessible via le bouton Default du debug. */
    '--c-cream': '#f8eee4',
    '--c-ink':   '#14110f',
    '--c-pink':  '#c0527c',
    '--c-green': '#1e5128',
    '--c-blue':  '#818eba',
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
