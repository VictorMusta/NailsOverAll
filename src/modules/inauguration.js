/* =========================================================
   inauguration.js — bannière d'annonce en haut de page
   Pour activer : passer `enabled: true` ci-dessous.
   ========================================================= */

const INAUGURATION = {
  enabled:    false,
  title:      'Inauguration · printemps 2026',
  detail:     'Impasse Doublet · 24100 Bergerac',
  ctaText:    "M'avertir",
  ctaHref:    '#contact',
  dismissible: true,
  /* Change cette clé pour ré-afficher la bannière après un changement de message */
  storageKey: 'noa-inauguration-2026-spring',
};

export function initInauguration() {
  const banner = document.getElementById('inauguration-banner');
  if (!banner || !INAUGURATION.enabled) return;
  if (INAUGURATION.dismissible && localStorage.getItem(INAUGURATION.storageKey) === 'dismissed') return;

  document.getElementById('banner-title').textContent  = INAUGURATION.title;
  document.getElementById('banner-detail').textContent = INAUGURATION.detail;
  const cta = document.getElementById('banner-cta');
  cta.textContent = INAUGURATION.ctaText;
  cta.href        = INAUGURATION.ctaHref;
  banner.removeAttribute('hidden');

  banner.querySelector('.banner__dismiss')?.addEventListener('click', () => {
    banner.setAttribute('hidden', '');
    if (INAUGURATION.dismissible) {
      localStorage.setItem(INAUGURATION.storageKey, 'dismissed');
    }
  });
}
