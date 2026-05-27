/* =========================================================
   palette.js — gestion de la palette de couleurs CSS swappable
   - applyPalette() applique uniquement au DOM (CSS vars)
   - la persistance localStorage est faite par l'appelant
   ========================================================= */

import { STATE_DEFAULTS } from '../utils/state.js';

export const PALETTE_PRESETS = Object.freeze({
  default: { ...STATE_DEFAULTS.palette },
  /* "noa" — palette officielle de la DA du salon
     Vert forêt + framboise + bleu poussiéreux sur cream chaud.
     Les couleurs additionnelles (jaune saturé, rose cotton candy)
     vivent en variables statiques dans tokens.css. */
  noa: {
    '--c-cream': '#f8eee4',
    '--c-ink':   '#14110f',
    '--c-pink':  '#c0527c',
    '--c-green': '#1e5128',
    '--c-blue':  '#818eba',
  },
  acid: {
    '--c-cream': '#f7f4d8',
    '--c-ink':   '#0a0a0a',
    '--c-pink':  '#ff2d6f',
    '--c-green': '#00d97e',
    '--c-blue':  '#0042ff',
  },
  berry: {
    '--c-cream': '#fbe9e7',
    '--c-ink':   '#2b0a1a',
    '--c-pink':  '#e91e63',
    '--c-green': '#6a1b9a',
    '--c-blue':  '#3949ab',
  },
  mint: {
    '--c-cream': '#eaf6ee',
    '--c-ink':   '#0f2922',
    '--c-pink':  '#ff6b9d',
    '--c-green': '#10b981',
    '--c-blue':  '#0ea5e9',
  },
});

export function applyPalette(palette) {
  Object.entries(palette).forEach(([varName, hex]) => {
    document.documentElement.style.setProperty(varName, hex);
  });
}
