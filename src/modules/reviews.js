/* =========================================================
   reviews.js — chargement et rendu des avis Google (≥ 4.5★)
   La source est ./reviews.json à la racine du site.
   Le script Node `scripts/fetch-reviews.js` regénère ce JSON
   via la Google Places API.
   ========================================================= */

import { escapeHtml } from '../utils/html.js';

const MIN_RATING = 4.5;

/* Logo Google officiel multi-couleur — sert de badge "source" */
const GOOGLE_LOGO_SVG = `
  <svg viewBox="0 0 48 48" width="20" height="20" aria-label="Google">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.6-5.6C33.5 6.3 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.6-5.6C33.5 6.3 29 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
    <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-5.1c-2 1.4-4.5 2.2-6.9 2.2-5.3 0-9.7-3.4-11.3-8L6.2 33.2C9.5 39.5 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6 5.1c4.2-3.9 6.7-9.6 6.7-16.6 0-1.3-.1-2.3-.5-1.5z"/>
  </svg>`;

const stars = (n) => {
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
};

const initial = (name) => (name?.trim()?.[0] ?? '?').toUpperCase();

async function loadReviewsData() {
  const res = await fetch('./reviews.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderSummary(summaryEl, data) {
  if (!summaryEl) return;
  const avg = (data.averageRating ?? 0).toFixed(1);
  const count = data.totalReviews ?? 0;
  summaryEl.innerHTML = `
    <div class="reviews__big-rating">
      <span class="reviews__big-number">${escapeHtml(avg)}</span>
      <span class="reviews__stars">${stars(Number(avg))}</span>
    </div>
    <div>
      <p class="reviews__count">Basé sur <strong>${count}</strong> avis Google</p>
      <span class="reviews__filter-badge">★ 4.5+ uniquement</span>
    </div>
    ${data.mapsUrl && data.mapsUrl !== '#'
      ? `<a class="btn btn--cream" href="${escapeHtml(data.mapsUrl)}" target="_blank" rel="noopener">Voir sur Google →</a>`
      : ''}
  `;
}

function renderCards(listEl, data) {
  const filtered = (data.reviews ?? []).filter((r) => (r.rating ?? 0) >= MIN_RATING);
  if (!filtered.length) {
    listEl.innerHTML = `<p class="reviews__empty">Pas encore d'avis 4.5★+. Reviens bientôt.</p>`;
    return;
  }
  listEl.innerHTML = filtered.map((r) => `
    <article class="review-card">
      <div class="review-card__head">
        <div class="review-card__avatar">${
          r.avatar
            ? `<img src="${escapeHtml(r.avatar)}" alt="" loading="lazy" />`
            : escapeHtml(initial(r.author))
        }</div>
        <div class="review-card__author">
          <strong class="review-card__name">${escapeHtml(r.author)}</strong>
          <span class="review-card__date">${escapeHtml(r.date)}</span>
        </div>
        <span class="review-card__source" title="Avis Google">${GOOGLE_LOGO_SVG}</span>
      </div>
      <div class="review-card__stars" aria-label="${r.rating} sur 5">${stars(r.rating)}</div>
      <p class="review-card__text">${escapeHtml(r.text)}</p>
    </article>
  `).join('');
}

export async function initReviews() {
  const listEl    = document.getElementById('reviews-list');
  const summaryEl = document.getElementById('reviews-summary');
  if (!listEl) return;

  try {
    const data = await loadReviewsData();
    renderSummary(summaryEl, data);
    renderCards(listEl, data);
  } catch (err) {
    console.warn('[reviews] chargement impossible', err);
    listEl.innerHTML = `<p class="reviews__empty">Avis indisponibles pour le moment.</p>`;
  }
}
