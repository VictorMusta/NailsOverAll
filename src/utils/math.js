/* =========================================================
   math.js — primitives mathématiques pures
   ========================================================= */

export const TAU = Math.PI * 2;

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
