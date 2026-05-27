/* =========================================================
   debug-panel.js — UI de réglage (palette + spotlight + presets)
   Le panneau est responsable de :
   - synchroniser ses inputs depuis le state
   - notifier palette.js / spotlight.js des changements
   - sauvegarder le state via state.js
   ========================================================= */

import { applyPalette, PALETTE_PRESETS } from './palette.js';
import { applySpotlight } from './spotlight.js';
import { saveState, STATE_DEFAULTS } from '../utils/state.js';

export function initDebugPanel(state) {
  const panel    = document.getElementById('debug-panel');
  const toggle   = document.getElementById('debug-toggle');
  const body     = panel?.querySelector('.debug__body');
  const resetBtn = document.getElementById('debug-reset');
  if (!panel) return;

  /* ----- Ouverture / fermeture du panneau ----- */
  toggle?.addEventListener('click', () => {
    const isOpen = !body.hasAttribute('hidden');
    if (isOpen) {
      body.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      body.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  /* ----- Palette : color pickers ----- */
  attachPaletteInputs(panel, state);

  /* ----- Spotlight : sliders ----- */
  const spotInputs = collectSpotInputs();
  attachSpotInputs(spotInputs, state);

  /* ----- Reset ----- */
  resetBtn?.addEventListener('click', () => {
    state.palette   = { ...STATE_DEFAULTS.palette };
    state.spotlight = { ...STATE_DEFAULTS.spotlight };
    applyPalette(state.palette);
    applySpotlight(state.spotlight);
    saveState(state);
    syncPaletteInputs(panel, state);
    syncSpotInputs(spotInputs, state);
  });

  /* ----- Presets ----- */
  panel.querySelectorAll('.debug__presets button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = PALETTE_PRESETS[btn.dataset.preset];
      if (!preset) return;
      state.palette = { ...preset };
      applyPalette(state.palette);
      saveState(state);
      syncPaletteInputs(panel, state);
    });
  });

  /* ----- Sync initial des inputs depuis le state ----- */
  syncPaletteInputs(panel, state);
  syncSpotInputs(spotInputs, state);
}

/* ---------- Palette ---------- */
function attachPaletteInputs(panel, state) {
  panel.querySelectorAll('.debug__row[data-var]').forEach((row) => {
    const varName = row.dataset.var;
    const input = row.querySelector('input[type="color"]');
    const code  = row.querySelector('code');
    input?.addEventListener('input', (e) => {
      const hex = e.target.value;
      document.documentElement.style.setProperty(varName, hex);
      if (code) code.textContent = hex.toUpperCase();
      state.palette[varName] = hex;
      saveState(state);
    });
  });
}

function syncPaletteInputs(panel, state) {
  panel.querySelectorAll('.debug__row[data-var]').forEach((row) => {
    const v = state.palette[row.dataset.var];
    if (!v) return;
    const input = row.querySelector('input[type="color"]');
    const code  = row.querySelector('code');
    if (input) input.value = v;
    if (code)  code.textContent = v.toUpperCase();
  });
}

/* ---------- Spotlight ---------- */
function collectSpotInputs() {
  return {
    toggle:        document.getElementById('spot-toggle'),
    radius:        document.getElementById('spot-radius'),
    shadow:        document.getElementById('spot-shadow'),
    sharpness:     document.getElementById('spot-sharpness'),
    smoothness:    document.getElementById('spot-smoothness'),
    radiusVal:     document.getElementById('spot-radius-val'),
    shadowVal:     document.getElementById('spot-shadow-val'),
    sharpnessVal:  document.getElementById('spot-sharpness-val'),
    smoothnessVal: document.getElementById('spot-smoothness-val'),
  };
}

function attachSpotInputs(inputs, state) {
  inputs.toggle?.addEventListener('change', (e) => {
    state.spotlight.enabled = e.target.checked;
    applySpotlight(state.spotlight);
    saveState(state);
  });
  inputs.radius?.addEventListener('input', (e) => {
    state.spotlight.radius = +e.target.value;
    if (inputs.radiusVal) inputs.radiusVal.textContent = `${state.spotlight.radius}px`;
    applySpotlight(state.spotlight);
    saveState(state);
  });
  inputs.shadow?.addEventListener('input', (e) => {
    state.spotlight.shadow = +e.target.value;
    if (inputs.shadowVal) inputs.shadowVal.textContent = `${state.spotlight.shadow}%`;
    applySpotlight(state.spotlight);
    saveState(state);
  });
  inputs.sharpness?.addEventListener('input', (e) => {
    state.spotlight.sharpness = +e.target.value;
    if (inputs.sharpnessVal) inputs.sharpnessVal.textContent = `${state.spotlight.sharpness}%`;
    applySpotlight(state.spotlight);
    saveState(state);
  });
  inputs.smoothness?.addEventListener('input', (e) => {
    state.spotlight.smoothness = +e.target.value;
    if (inputs.smoothnessVal) inputs.smoothnessVal.textContent = `${state.spotlight.smoothness}`;
    applySpotlight(state.spotlight);
    saveState(state);
  });
}

function syncSpotInputs(inputs, state) {
  const s = state.spotlight;
  if (inputs.toggle)        inputs.toggle.checked    = s.enabled;
  if (inputs.radius)        inputs.radius.value      = s.radius;
  if (inputs.shadow)        inputs.shadow.value      = s.shadow;
  if (inputs.sharpness)     inputs.sharpness.value   = s.sharpness;
  if (inputs.smoothness)    inputs.smoothness.value  = s.smoothness;
  if (inputs.radiusVal)     inputs.radiusVal.textContent     = `${s.radius}px`;
  if (inputs.shadowVal)     inputs.shadowVal.textContent     = `${s.shadow}%`;
  if (inputs.sharpnessVal)  inputs.sharpnessVal.textContent  = `${s.sharpness}%`;
  if (inputs.smoothnessVal) inputs.smoothnessVal.textContent = `${s.smoothness}`;
}
