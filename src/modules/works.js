/* =========================================================
   works.js — section "Réalisations"
   Charge les 4 derniers posts Instagram à mettre en avant
   depuis latest-posts.json (curé manuellement) et les rend
   en polaroïds tiltés cliquables vers le post original.
   ========================================================= */

import { escapeHtml } from '../utils/html.js';

const INSTAGRAM_SVG = `
  <svg viewBox="0 0 24 24" width="18" height="18" aria-label="Instagram" fill="currentColor">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 01-1.38-.9 3.71 3.71 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.34 4.14.63a5.92 5.92 0 00-2.13 1.38A5.92 5.92 0 00.63 4.14c-.29.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.27 2.15.56 2.91a5.92 5.92 0 001.38 2.13c.66.66 1.34 1.07 2.13 1.38.76.29 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.27 2.91-.56a5.92 5.92 0 002.13-1.38 5.92 5.92 0 001.38-2.13c.29-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.27-2.15-.56-2.91a5.92 5.92 0 00-1.38-2.13A5.92 5.92 0 0019.86.63c-.76-.29-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>
  </svg>`;

export async function initWorks() {
  const listEl = document.getElementById('works-list');
  if (!listEl) return;

  try {
    const res = await fetch('./latest-posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPosts(listEl, data);
  } catch (err) {
    console.warn('[works] chargement impossible', err);
    listEl.innerHTML = `<p class="works__loading">Réalisations indisponibles pour le moment.</p>`;
  }
}

function renderPosts(listEl, data) {
  const posts = data.posts ?? [];
  if (!posts.length) {
    listEl.innerHTML = `<p class="works__loading">Bientôt en ligne.</p>`;
    return;
  }
  listEl.innerHTML = posts.map(polaroidHtml).join('');
}

function polaroidHtml(post, i) {
  const num = String(i + 1).padStart(2, '0');
  const filename = post.image?.split('/').pop() ?? '';
  /* Fallback affiché tant que l'image n'est pas dans le dossier images/ */
  const fallback = `
    <div class="polaroid__fallback" aria-hidden="true">
      <span>${escapeHtml(filename)}</span>
      <small>à déposer dans /images</small>
    </div>`;
  /* Caption : on prend ce qui est dispo dans la JSON, sinon fallback générique */
  const captionText = post.caption?.trim() || post.date?.trim() || 'Création récente';

  return `
    <a class="polaroid polaroid--${(i % 4) + 1}"
       href="${escapeHtml(post.url)}"
       target="_blank"
       rel="noopener"
       title="Voir ce post sur Instagram">
      <div class="polaroid__frame">
        <img src="${escapeHtml(post.image)}"
             alt="${escapeHtml(post.alt ?? 'Création @nailsoverall')}"
             loading="lazy"
             onerror="this.style.display='none'" />
        ${fallback}
        <span class="polaroid__instagram" aria-hidden="true">${INSTAGRAM_SVG}</span>
      </div>
      <div class="polaroid__caption">
        <span class="polaroid__num">#${num}</span>
        ${escapeHtml(captionText)}
      </div>
    </a>
  `;
}
