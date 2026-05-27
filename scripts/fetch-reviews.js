#!/usr/bin/env node
/* =========================================================
   NOA — Récupération des avis Google ≥4.5★ via Places API (New)
   ---------------------------------------------------------
   Usage :
     PLACE_ID=ChIJ... GOOGLE_API_KEY=AIza... node scripts/fetch-reviews.js

   Le script :
   - appelle l'endpoint Places API (New) Place Details
   - filtre les avis ≥ 4.5★
   - trie du plus récent au plus ancien
   - écrit le résultat dans ./reviews.json (servi statiquement par le site)

   ⚠️  Ne jamais committer la clé API. Préférer un .env (chargé via dotenv)
       ou un secret CI. La clé doit aussi être restreinte côté Google Cloud
       Console (HTTP referrer ou IP) pour limiter les risques.

   Pour trouver ton PLACE_ID :
     https://developers.google.com/maps/documentation/places/web-service/place-id
   ========================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PLACE_ID = process.env.PLACE_ID;
const API_KEY  = process.env.GOOGLE_API_KEY;
const MIN_RATING = Number(process.env.MIN_RATING ?? 4.5);

if (!PLACE_ID || !API_KEY) {
  console.error('✗ Variables manquantes.');
  console.error('  Usage : PLACE_ID=... GOOGLE_API_KEY=... node scripts/fetch-reviews.js');
  process.exit(1);
}

const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=fr`;
const fieldMask = [
  'reviews',
  'rating',
  'userRatingCount',
  'displayName',
  'googleMapsUri',
].join(',');

console.log(`→ Fetch Place ${PLACE_ID}…`);

const res = await fetch(url, {
  headers: {
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': fieldMask,
  },
});

if (!res.ok) {
  console.error(`✗ Google API error ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const data = await res.json();

const reviews = (data.reviews ?? [])
  .filter((r) => (r.rating ?? 0) >= MIN_RATING)
  .map((r) => ({
    rating: r.rating,
    text: r.text?.text ?? r.originalText?.text ?? '',
    author: r.authorAttribution?.displayName ?? 'Anonyme',
    avatar: r.authorAttribution?.photoUri ?? null,
    date: r.relativePublishTimeDescription ?? '',
    publishTime: r.publishTime,
  }))
  .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));

const output = {
  fetchedAt: new Date().toISOString(),
  source: 'google-places',
  placeName: data.displayName?.text ?? null,
  averageRating: data.rating ?? null,
  totalReviews: data.userRatingCount ?? null,
  mapsUrl: data.googleMapsUri ?? null,
  minRatingFilter: MIN_RATING,
  reviews,
};

const outPath = path.join(ROOT, 'reviews.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

console.log(`✓ ${reviews.length} avis ≥${MIN_RATING}★ écrits dans ${path.relative(ROOT, outPath)}`);
console.log(`  Moyenne du salon : ${output.averageRating} (sur ${output.totalReviews} avis)`);
