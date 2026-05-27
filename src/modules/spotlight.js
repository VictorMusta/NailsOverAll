/* =========================================================
   spotlight.js — 2 spots lumineux dans la zone galerie
   - hors zone : éteint (fade out)
   - idle : trajectoires Lissajous indépendantes
   - hover : les 2 spots convergent (offset pour rester visibles)
   - release : la Lissajous reprend DEPUIS la position courante
   =========================================================
   API publique :
     applySpotlight(spotlightState)   → applique CSS vars (shadow, sharpness)
     initSpotlight(state)             → lance la boucle RAF + listeners hover
   ========================================================= */

import { lerp, clamp, TAU } from '../utils/math.js';

/* ---------- Configuration des 2 spots ---------- */
const SPOT_CONFIGS = Object.freeze([
  {
    sizeMult: 1.0,
    hoverOffset: { x: 0, y: 0 },
    lissajous: {
      ampX: 0.32, ampY: 0.16,
      periodX: 9500, periodY: 6700,
      phaseShift: Math.PI / 3,
    },
  },
  {
    sizeMult: 0.55,
    hoverOffset: { x: 90, y: -50 },
    lissajous: {
      ampX: 0.22, ampY: 0.28,
      periodX: 7300, periodY: 11000,
      phaseShift: -Math.PI / 4,
    },
  },
]);

const HOVER_RADIUS_MULT = Object.freeze({
  idle:     0.85,
  nail:     1.18,
  polaroid: 1.4,
  arrow:    1.95,
});

const HOVER_LERP_MULT = Object.freeze({
  idle:     1.0,
  nail:     2.4,
  polaroid: 1.6,
  arrow:    1.4,
});

/* ---------- État runtime (module-private) ---------- */
let spotlightEl = null;
let sharedState = null;   // référence au state global (pour smoothness, radius, …)

const spots = SPOT_CONFIGS.map((config) => ({
  config,
  current:         { x: 0, y: 0, radius: 220 * config.sizeMult },
  target:          { x: 0, y: 0, radius: 220 * config.sizeMult },
  lissajousCenter: { x: 0, y: 0 },
}));

const hoverState = {
  hovered:         null,
  hoverMode:       'idle',
  carouselRef:     null,
  inScope:         false,
  deactivateTimer: null,
  rafId:           null,
};

/* État du scroll : on coupe le spotlight pendant que la page scrolle.
   Après la fin du scroll, le spot ne revient QUE si la souris bouge
   (évite de remettre la lumière en pleine face juste parce qu'on s'est
   arrêté à un endroit avec le curseur). */
const scrollState = {
  isScrolling:    false,
  scrollEndTimer: null,
};

/* ---------- API publique ---------- */
export function applySpotlight(spotlightState) {
  if (!spotlightEl) spotlightEl = document.querySelector('.spotlight');
  document.documentElement.style.setProperty('--spot-shadow',    spotlightState.shadow / 100);
  document.documentElement.style.setProperty('--spot-sharpness', spotlightState.sharpness / 100);
  spotlightEl?.classList.toggle('spotlight--off', !spotlightState.enabled);
}

export function initSpotlight(state) {
  sharedState = state;
  spotlightEl = document.querySelector('.spotlight');

  initSpotPositions();
  hoverState.rafId = requestAnimationFrame(loop);

  attachScopeListeners();
  attachNailListeners();
  attachArrowListeners();
  attachPolaroidListeners();
  attachScrollGuard();
}

/* Désactive le spot pendant le scroll, le réveille uniquement quand
   la souris bouge après la fin du scroll (et que le curseur est en zone). */
function attachScrollGuard() {
  const SCROLL_END_DELAY = 200;

  window.addEventListener('scroll', () => {
    scrollState.isScrolling = true;
    spotlightEl?.classList.remove('is-active');
    clearTimeout(scrollState.scrollEndTimer);
    scrollState.scrollEndTimer = setTimeout(() => {
      scrollState.isScrolling = false;
      /* Pas d'auto-reactivation : on attend un mousemove explicite. */
    }, SCROLL_END_DELAY);
  }, { passive: true });

  /* Mouvement souris après scroll → on rallume si on est en zone. */
  window.addEventListener('mousemove', () => {
    if (scrollState.isScrolling) return;
    if (!hoverState.inScope) return;
    /* activate() est idempotent (classList.add d'une classe déjà présente
       est un no-op) donc on peut l'appeler à chaque mousemove sans souci. */
    activate();
  }, { passive: true });
}

/* ---------- Init positions ---------- */
function initSpotPositions() {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  spots.forEach((spot, i) => {
    const r = sharedState.spotlight.radius * spot.config.sizeMult;
    spot.current.x = spot.target.x = cx;
    spot.current.y = spot.target.y = cy;
    spot.lissajousCenter.x = cx;
    spot.lissajousCenter.y = cy;
    spot.current.radius = spot.target.radius = r;
    pushSpotVars(spot, i);
  });
}

function pushSpotVars(spot, i) {
  const idx = i + 1;
  document.documentElement.style.setProperty(`--spot${idx}-x`,      `${spot.current.x}px`);
  document.documentElement.style.setProperty(`--spot${idx}-y`,      `${spot.current.y}px`);
  document.documentElement.style.setProperty(`--spot${idx}-radius`, `${spot.current.radius}px`);
}

/* ---------- Lissajous (trajectoire libre) ---------- */
function lissajousTarget(spot, now) {
  const c = spot.lissajousCenter;
  const l = spot.config.lissajous;
  const ax = window.innerWidth  * l.ampX;
  const ay = window.innerHeight * l.ampY;
  return {
    x: c.x + Math.sin((now / l.periodX) * TAU) * ax,
    y: c.y + Math.sin((now / l.periodY) * TAU + l.phaseShift) * ay,
  };
}

/* Au release d'un hover : on redéfinit lissajousCenter pour que la
   trajectoire libre redémarre DEPUIS la position courante du spot. */
function reanchorLissajous(now) {
  spots.forEach((spot) => {
    const drift = lissajousTarget(spot, now);
    const dx = drift.x - spot.lissajousCenter.x;
    const dy = drift.y - spot.lissajousCenter.y;
    spot.lissajousCenter.x = clamp(spot.current.x - dx, 80, window.innerWidth  - 80);
    spot.lissajousCenter.y = clamp(spot.current.y - dy, 80, window.innerHeight - 80);
  });
}

/* ---------- Activation / désactivation ---------- */
function activate() {
  /* Si on scrolle, on n'active pas — le scroll est censé éteindre le spot.
     L'activation effective viendra du mousemove après la fin du scroll. */
  if (scrollState.isScrolling) return;
  clearTimeout(hoverState.deactivateTimer);
  hoverState.deactivateTimer = null;
  spotlightEl?.classList.add('is-active');
}

function scheduleDeactivate() {
  /* Tempo 250ms pour éviter le flicker entre 2 éléments adjacents */
  clearTimeout(hoverState.deactivateTimer);
  hoverState.deactivateTimer = setTimeout(() => {
    if (!hoverState.inScope) spotlightEl?.classList.remove('is-active');
  }, 250);
}

/* ---------- Boucle RAF principale ---------- */
function getTargetRadius(spot) {
  const base = sharedState.spotlight.radius * spot.config.sizeMult;
  return base * (HOVER_RADIUS_MULT[hoverState.hoverMode] ?? 1);
}

function loop(now) {
  /* En mode "arrow", on re-résout l'élément cible à chaque frame pour suivre
     le set actif (qui change quand l'utilisateur clique sur la flèche). */
  if (hoverState.hoverMode === 'arrow' && hoverState.carouselRef) {
    const items = findVisuallyActiveItems(hoverState.carouselRef);
    if (items) hoverState.hovered = items;
  }

  const baseT = sharedState.spotlight.smoothness / 100;
  const t  = Math.min(0.4, baseT * (HOVER_LERP_MULT[hoverState.hoverMode] ?? 1));
  const tr = Math.min(0.5, t * 1.6);

  let hoverCenter = null;
  if (hoverState.hovered) {
    const r = hoverState.hovered.getBoundingClientRect();
    hoverCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  spots.forEach((spot, i) => {
    if (hoverCenter) {
      spot.target.x = hoverCenter.x + spot.config.hoverOffset.x;
      spot.target.y = hoverCenter.y + spot.config.hoverOffset.y;
    } else if (hoverState.inScope) {
      const lt = lissajousTarget(spot, now);
      spot.target.x = lt.x;
      spot.target.y = lt.y;
    }
    spot.target.radius = getTargetRadius(spot);

    spot.current.x      = lerp(spot.current.x,      spot.target.x,      t);
    spot.current.y      = lerp(spot.current.y,      spot.target.y,      t);
    spot.current.radius = lerp(spot.current.radius, spot.target.radius, tr);
    pushSpotVars(spot, i);
  });

  hoverState.rafId = requestAnimationFrame(loop);
}

/* ---------- Listeners DOM ---------- */
function attachScopeListeners() {
  ['#gallery', '#works'].forEach((sel) => {
    const section = document.querySelector(sel);
    if (!section) return;
    section.addEventListener('mouseenter', () => {
      hoverState.inScope = true;
      activate();
    });
    section.addEventListener('mouseleave', () => {
      hoverState.inScope = false;
      scheduleDeactivate();
    });
  });
}

function attachNailListeners() {
  document.querySelectorAll('.nail').forEach((nail) => {
    nail.addEventListener('mouseenter', () => {
      hoverState.hovered = nail;
      hoverState.hoverMode = 'nail';
    });
    nail.addEventListener('mouseleave', () => {
      if (hoverState.hovered === nail) {
        reanchorLissajous(performance.now());
        hoverState.hovered = null;
        hoverState.hoverMode = 'idle';
      }
    });
  });
}

/* En mode infini, plusieurs .nailset.is-active coexistent (l'original ET son
   clone). On retourne les .nailset__items dont le centre horizontal est le
   plus proche du centre du viewport — donc celui que l'utilisateur regarde. */
function findVisuallyActiveItems(carousel) {
  const viewport = carousel.querySelector('.carousel__viewport');
  if (!viewport) {
    /* fallback : premier match en DOM */
    const set = carousel.querySelector('.nailset.is-active');
    return set?.querySelector('.nailset__items') ?? null;
  }
  const vRect = viewport.getBoundingClientRect();
  const vCenterX = vRect.left + vRect.width / 2;

  let bestSet = null, bestDist = Infinity;
  carousel.querySelectorAll('.nailset.is-active').forEach((set) => {
    const r = set.getBoundingClientRect();
    const setCenterX = r.left + r.width / 2;
    const d = Math.abs(setCenterX - vCenterX);
    if (d < bestDist) { bestDist = d; bestSet = set; }
  });
  return bestSet?.querySelector('.nailset__items') ?? null;
}

function attachArrowListeners() {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    carousel.querySelectorAll('.carousel__arrow').forEach((arrow) => {
      arrow.addEventListener('mouseenter', () => {
        hoverState.carouselRef = carousel;
        hoverState.hoverMode   = 'arrow';
        const itemsRow = findVisuallyActiveItems(carousel);
        if (itemsRow) hoverState.hovered = itemsRow;
      });
      arrow.addEventListener('mouseleave', () => {
        if (hoverState.hoverMode === 'arrow') {
          reanchorLissajous(performance.now());
          hoverState.hovered     = null;
          hoverState.carouselRef = null;
          hoverState.hoverMode   = 'idle';
        }
      });
    });
  });
}

function attachPolaroidListeners() {
  document.querySelectorAll('.polaroid').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      hoverState.hovered = card;
      hoverState.hoverMode = 'polaroid';
    });
    card.addEventListener('mouseleave', () => {
      if (hoverState.hovered === card) {
        reanchorLissajous(performance.now());
        hoverState.hovered = null;
        hoverState.hoverMode = 'idle';
      }
    });
  });
}
