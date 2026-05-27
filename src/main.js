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
import { applyPalette } from './modules/palette.js';
import { initCarousels } from './modules/carousel.js';
import { applySpotlight, initSpotlight } from './modules/spotlight.js';
import { initReviews } from './modules/reviews.js';
import { initDebugPanel } from './modules/debug-panel.js';

const state = loadState();

/* CSS vars : on les applique avant d'attacher les listeners pour éviter
   tout flash de couleurs par défaut. */
applyPalette(state.palette);
applySpotlight(state.spotlight);

initInauguration();
/* Important : initCarousels() crée les clones AVANT initSpotlight() pour que
   les listeners du spotlight les voient. */
initCarousels();
initReviews();
initDebugPanel(state);

/* Pas de spotlight sur tactile : pas de hover, pas d'utilité,
   et on économise la boucle RAF + les listeners. */
if (!IS_MOBILE) initSpotlight(state);
