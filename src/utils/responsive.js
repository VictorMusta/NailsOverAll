/* =========================================================
   responsive.js — détection du contexte d'affichage
   Évalué au load. Pour un site vitrine, on accepte qu'un
   resize ne re-déclenche pas la logique (reload nécessaire).
   ========================================================= */

export const IS_MOBILE = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
