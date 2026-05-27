/* =========================================================
   carousel.js — galerie d'ongles
   - Desktop : carrousel inter-sets avec peek flouté + LOOP INFINI
              (clone du dernier en début, du premier en fin, téléport)
   - Mobile  : structure aplatie (CSS), scroll-snap par ongle, l'ongle
              centré reçoit .is-active pour le grossissement
   ========================================================= */

import { IS_MOBILE } from '../utils/responsive.js';

export function initCarousels() {
  document.querySelectorAll('.carousel').forEach(setupCarousel);
}

function setupCarousel(carousel) {
  const viewport     = carousel.querySelector('.carousel__viewport');
  const prev         = carousel.querySelector('.carousel__arrow--prev');
  const next         = carousel.querySelector('.carousel__arrow--next');
  const dotsBar      = carousel.querySelector('.carousel__dots');
  const originalSets = [...carousel.querySelectorAll('.nailset')];
  if (!viewport || !originalSets.length) return;

  if (IS_MOBILE) {
    carousel.querySelectorAll('.nailset__items').forEach(setupMobileNailScroll);
    return;
  }

  setupDesktopCarousel({ carousel, viewport, prev, next, dotsBar, originalSets });
}

/* ----------------------------------------------------------
   DESKTOP : carrousel infini avec clones et téléport
   ---------------------------------------------------------- */
function setupDesktopCarousel({ carousel, viewport, prev, next, dotsBar, originalSets }) {
  const useInfinite = originalSets.length >= 2;

  if (useInfinite) cloneEdges(viewport, originalSets);

  /* Dots = nombre de sets originaux (les clones ne comptent pas) */
  if (dotsBar) {
    originalSets.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Aller au set ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsBar.appendChild(dot);
    });
  }

  let activeIdx = 0;

  const setActive = (idx) => {
    const n = originalSets.length;
    activeIdx = ((idx % n) + n) % n;
    originalSets.forEach((s, i) => s.classList.toggle('is-active', i === activeIdx));
    if (useInfinite) {
      carousel.querySelectorAll('.nailset--clone').forEach((c) => {
        c.classList.toggle('is-active', Number(c.dataset.cloneOf) === activeIdx);
      });
    }
    dotsBar?.querySelectorAll('.carousel__dot').forEach((d, i) =>
      d.classList.toggle('is-active', i === activeIdx));
  };

  const goTo = (idx) => {
    if (useInfinite) {
      if (idx >= originalSets.length) {
        const fc = viewport.querySelector('.nailset--clone[data-clone-of="0"]');
        fc?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return;
      }
      if (idx < 0) {
        const lastIdx = originalSets.length - 1;
        const lc = viewport.querySelector(`.nailset--clone[data-clone-of="${lastIdx}"]`);
        lc?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return;
      }
    }
    const clamped = Math.max(0, Math.min(originalSets.length - 1, idx));
    originalSets[clamped].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  prev?.addEventListener('click', () => goTo(activeIdx - 1));
  next?.addEventListener('click', () => goTo(activeIdx + 1));

  const findClosestSet = () => {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let closest = null, bestDist = Infinity;
    viewport.querySelectorAll('.nailset').forEach((set) => {
      const c = set.offsetLeft + set.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; closest = set; }
    });
    return closest;
  };

  const recomputeActive = () => {
    const closest = findClosestSet();
    if (!closest) return;
    if (closest.classList.contains('nailset--clone')) {
      setActive(Number(closest.dataset.cloneOf));
    } else {
      const idx = originalSets.indexOf(closest);
      if (idx >= 0) setActive(idx);
    }
  };

  /* Téléport invisible : après que le scroll se soit posé sur un clone,
     on saute instantanément vers le set original équivalent. */
  const teleportIfOnClone = () => {
    if (!useInfinite) return;
    const closest = findClosestSet();
    if (!closest?.classList.contains('nailset--clone')) return;
    const origIdx   = Number(closest.dataset.cloneOf);
    const actualSet = originalSets[origIdx];
    viewport.style.scrollBehavior = 'auto';
    actualSet.scrollIntoView({ block: 'nearest', inline: 'center' });
    requestAnimationFrame(() => { viewport.style.scrollBehavior = ''; });
  };

  let scrollRaf = null;
  let scrollIdleTimer = null;
  viewport.addEventListener('scroll', () => {
    if (!scrollRaf) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        recomputeActive();
      });
    }
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(teleportIfOnClone, 220);
  }, { passive: true });

  setActive(0);
  requestAnimationFrame(() => {
    originalSets[0].scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  });
}

function cloneEdges(viewport, originalSets) {
  const lastIdx = originalSets.length - 1;

  const lastClone = originalSets[lastIdx].cloneNode(true);
  lastClone.classList.add('nailset--clone');
  lastClone.dataset.cloneOf = String(lastIdx);
  viewport.insertBefore(lastClone, viewport.firstChild);

  const firstClone = originalSets[0].cloneNode(true);
  firstClone.classList.add('nailset--clone');
  firstClone.dataset.cloneOf = '0';
  viewport.appendChild(firstClone);
}

/* ----------------------------------------------------------
   MOBILE : scroll-snap par ongle, l'ongle centré reçoit .is-active
   ---------------------------------------------------------- */
function setupMobileNailScroll(container) {
  const nails = [...container.querySelectorAll('.nail')];
  if (!nails.length) return;

  let scrollRaf = null;
  const updateActive = () => {
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = nails[0], bestDist = Infinity;
    nails.forEach((n) => {
      const c = n.offsetLeft + n.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; closest = n; }
    });
    nails.forEach(n => n.classList.toggle('is-active', n === closest));
  };

  container.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      updateActive();
    });
  }, { passive: true });

  requestAnimationFrame(updateActive);
}
