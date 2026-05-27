/* =========================================================
   main.js — point d'entrée, orchestration des modules
   Ordre :
   1. Chargement du state (localStorage + defaults)
   2. Application des CSS vars initiales (palette + spotlight)
   3. Init des sections UI (inauguration, carrousels, reviews)
   4. Init du panneau debug (qui synchronise ses inputs depuis le state)
   5. Spotlight engine (desktop uniquement)
   ========================================================= */

import { loadState } from './utils/state.js';
import { IS_MOBILE } from './utils/responsive.js';

import { initInauguration } from './modules/inauguration.js';
import { applyPalette, setTheme } from './modules/palette.js';
import { initCarousels } from './modules/carousel.js';
import { applySpotlight, initSpotlight } from './modules/spotlight.js';
import { initReviews } from './modules/reviews.js';
import { initWorks } from './modules/works.js';
import { initDebugPanel } from './modules/debug-panel.js';

const state = loadState();

/* CSS vars + thème actif appliqués avant tout le reste pour éviter
   tout flash de couleurs ou patterns. */
applyPalette(state.palette);
applySpotlight(state.spotlight);
setTheme(state.theme);

initInauguration();
/* Important : initCarousels() crée les clones AVANT initSpotlight() pour que
   les listeners du spotlight les voient. */
initCarousels();
initReviews();              // fire-and-forget : pas de hover handlers à attacher
initDebugPanel(state);

/* On attend que les polaroids dynamiques soient rendus avant le spotlight,
   sinon attachPolaroidListeners() les rate. Top-level await OK en module ES. */
await initWorks();

/* Pas de spotlight sur tactile : pas de hover, pas d'utilité,
   et on économise la boucle RAF + les listeners. */
if (!IS_MOBILE) initSpotlight(state);
