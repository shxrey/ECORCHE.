  // ===== SCREEN-READER NAMES FOR THE LOG BOXES =====
  // Added in the Next.js port: scripts/extract-legacy.mjs inserts this file
  // (scripts/legacy-labels.js) right after scripts/legacy-units.js.
  //
  // The weight / reps / RIR boxes and the notes box only had placeholders,
  // which screen readers don't reliably read, so 132 sets' worth of boxes
  // all sounded alike. Each now says what it is, matching how the set
  // buttons are named: "Barbell Back Squats, set 2, weight in kilograms".
  function exerciseNameOf(card) {
    const dot = card.querySelector('.set-dot[aria-label]');
    return dot ? dot.getAttribute('aria-label').replace(/, set \d+$/, '') : 'Exercise';
  }
  // (Re)names every log box in one exercise card; the weight name follows the chosen unit.
  function labelLogBoxes(card) {
    const name = exerciseNameOf(card);
    const unitWord = weightUnit === 'lb' ? 'pounds' : 'kilograms';
    card.querySelectorAll('.set-log-row').forEach(row => {
      const weight = row.querySelector('.log-weight');
      if (!weight) return;
      const set = name + ', set ' + weight.getAttribute('data-set');
      weight.setAttribute('aria-label', set + ', weight in ' + unitWord);
      const reps = row.querySelector('.log-reps');
      if (reps) reps.setAttribute('aria-label', set + ', reps');
      const rir = row.querySelector('.log-rir');
      if (rir) rir.setAttribute('aria-label', set + ', reps in reserve');
    });
    const notes = card.querySelector('.exercise-notes');
    if (notes) notes.setAttribute('aria-label', name + ', notes for today');
  }

