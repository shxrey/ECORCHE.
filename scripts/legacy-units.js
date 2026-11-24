  // ===== LOCAL STORAGE — WEIGHT UNIT (kg / lb) =====
  // Added in the Next.js port: scripts/extract-legacy.mjs inserts this file
  // (scripts/legacy-units.js) next to the other preferences.
  //
  // Saved weights are ALWAYS kilograms: logMap, backups and the cloud copy
  // all hold kg, so switching units never rewrites history. lb only changes
  // what is shown and typed. A weight typed in lb is saved as kg to 2
  // decimals (the cloud copy's precision) and shown back rounded to the
  // nearest 0.05 lb. That rounding error is under 0.012 lb, so any weight
  // you'd actually type (135, 137.5, 136.25) comes back exactly. PRs and the
  // ▲/▼ badges compare these shown values too, so a weight that round-trips
  // through lb never reads as a tiny PR or drop.
  const WEIGHT_UNIT_KEY = 'hb_weightUnit_v1';
  const KG_PER_LB = 0.45359237; // exact, by definition
  function loadWeightUnit() {
    try { return localStorage.getItem(WEIGHT_UNIT_KEY) === 'lb' ? 'lb' : 'kg'; } catch (e) { return 'kg'; }
  }
  function saveWeightUnit(val) {
    try { localStorage.setItem(WEIGHT_UNIT_KEY, val); } catch (e) {}
  }
  let weightUnit = loadWeightUnit();

  // A saved (kg) weight as a number in the chosen unit; NaN when blank.
  function toUnit(kg) {
    const n = parseFloat(kg);
    if (isNaN(n)) return NaN;
    return weightUnit === 'lb' ? Math.round(n / KG_PER_LB * 20) / 20 : n;
  }
  // A saved (kg) weight as weight-box text. In kg it's shown exactly as typed.
  function weightToInput(kg) {
    if (kg === '' || kg == null) return '';
    if (weightUnit === 'kg') return String(kg);
    const n = toUnit(kg);
    return isNaN(n) ? '' : String(Math.round(n * 100) / 100);
  }
  // Weight-box text → the value to save (kg). In kg it's saved exactly as typed.
  function inputToKg(val) {
    if (weightUnit === 'kg' || val === '' || val == null) return val;
    const n = parseFloat(val);
    return isNaN(n) ? val : String(Math.round(n * KG_PER_LB * 100) / 100);
  }
  // A weight box → the value to save (kg). A box still showing, unchanged, the
  // saved or suggested weight it was filled with (data-kg) keeps that exact kg
  // value, so 100kg shown as 220.45lb isn't re-saved as 99.99kg.
  function weightInputToKg(el) {
    const filled = el.getAttribute('data-kg');
    if (weightUnit === 'lb' && filled !== null && weightToInput(filled) === el.value) return filled;
    return inputToKg(el.value);
  }
  // An estimated 1RM (kg, unrounded) as text: "102.5kg", "226lb".
  function formatEstimate(kg) {
    const n = weightUnit === 'lb' ? kg / KG_PER_LB : kg;
    return (Math.round(n * 10) / 10) + weightUnit;
  }
  function notesPlaceholder() {
    return 'Notes — e.g. elbows flared on set 2, drop ' + (weightUnit === 'lb' ? '5lb' : '2.5kg') + ' next time';
  }
  // Brings the switch, the box placeholders and any open warm-up list in line with weightUnit.
  function applyWeightUnit() {
    document.querySelectorAll('.unit-toggle [data-unit]').forEach(btn => {
      const on = btn.getAttribute('data-unit') === weightUnit;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('.log-weight').forEach(el => { el.placeholder = weightUnit; });
    document.querySelectorAll('.exercise-notes').forEach(el => { el.placeholder = notesPlaceholder(); });
    // Warm-up steps were worked out in the old unit: close them (one tap reopens).
    document.querySelectorAll('.warmup-calc.open').forEach(el => { el.classList.remove('open'); el.innerHTML = ''; });
  }
  function setWeightUnit(val) {
    const next = val === 'lb' ? 'lb' : 'kg';
    if (next === weightUnit) return;
    weightUnit = next;
    saveWeightUnit(weightUnit);
    applyWeightUnit();
    // Re-show every weight box, "Last session", e1RM, trend and ▲/▼ badge in the new unit.
    initExerciseEnhancements();
    showInfoToast('Weights now in ' + (weightUnit === 'lb' ? 'pounds (lb)' : 'kilograms (kg)') + '. Your logged history is unchanged.');
  }

