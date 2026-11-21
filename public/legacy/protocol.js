// Original protocol logic, ported unchanged from the single-file app.
// React renders the exercise cards with data-legacy-on* attributes (React cannot
// emit inline handler strings); turn them back into real inline handlers first.
document.querySelectorAll('[data-legacy-onclick],[data-legacy-onkeydown]').forEach(function (el) {
  ['onclick', 'onkeydown'].forEach(function (evt) {
    var code = el.getAttribute('data-legacy-' + evt);
    if (code !== null) { el.setAttribute(evt, code); el.removeAttribute('data-legacy-' + evt); }
  });
});
  // ===== PROGRAM DATA =====
  const PROGRAM = {
    push: {
      top: 'PUSH DAY',
      sub: 'An evidence-based A/B split for chest, shoulders &amp; triceps — now with the triceps split into two standalone lifts and core anchored here permanently. Built on the EMG and hypertrophy research of <strong>Schoenfeld, Helms, Trebs &amp; Maeo</strong> — the same literature Jeff Nippard draws on for his own programming.',
      ex: 8, sets: 21, muscles: 4, min: '~60'
    },
    pull: {
      top: 'PULL DAY',
      sub: 'An evidence-based A/B split for lats, mid-back, rear delts, traps &amp; biceps — now with shrugs and a heavy unilateral row added. Built on the EMG and hypertrophy research of <strong>Andersen, Oliveira, Signorile &amp; Schoenfeld</strong> — the same literature Jeff Nippard and Dr. Mike Israetel draw on for their own back &amp; arm programming.',
      ex: 8, sets: 24, muscles: 5, min: '~68'
    },
    legs: {
      top: 'LEG DAY',
      sub: 'An evidence-based A/B split for quads, hamstrings, glutes, calves, shoulders &amp; forearms — now built around the Back Squat with leg curls dropped in favor of a 4th RDL set. Built on the muscle-length and EMG research of <strong>Maeo, Schoenfeld, Kassiano &amp; Helms</strong> — the same literature Jeff Nippard draws on for his own leg programming.',
      ex: 7, sets: 21, muscles: 6, min: '~65'
    }
  };

  const SETS_PER_DAY = {
    pushA: 21, pushB: 21,
    pullA: 24, pullB: 24,
    legsA: 21, legsB: 21
  };
  const TOTAL_SETS = Object.values(SETS_PER_DAY).reduce((a, b) => a + b, 0);

  let currentGroup = 'legs';
  let currentDay = 'A';

  // ===== UNIFIED STATE PERSISTENCE =====
  // doneMap/logMap/notesMap/sessionsMap used to be four independently
  // saved localStorage keys. A write to one succeeding while another
  // failed (quota exceeded partway through a sequence of saves, a tab
  // closing between two writes) could leave state fragmented — e.g.
  // resetAllProgress clearing doneMap but a subsequent logMap write never
  // landing — with nothing in the data itself to reveal that it happened.
  // All four now live under one JSON blob, written with a single atomic
  // localStorage.setItem() call: either the whole thing persists, or none
  // of it does, never a partial slice.
  //
  // Deliberately NOT a rename of doneMap/logMap/notesMap/sessionsMap
  // throughout the rest of this file. Every function that reads or writes
  // those four variables — commitSetLogRow, saveSetLog, toggleSet,
  // resetDay, resetAllProgress, recordSessionTick, the notes handler,
  // importProgress/exportProgress, the PR-detection and session-timer
  // monkey-patches, the delta badges, the RIR flags, and everything else
  // built on them today — keeps working completely unchanged. Only what
  // backs their persistence changed; the variables themselves, and every
  // call site that reads or writes them, are untouched.
  const UNIFIED_STATE_KEY = 'hb_state_v1';
  const LEGACY_KEYS = {
    doneMap: 'hb_completed_sets_v1',
    logMap: 'hb_logMap_v1',
    notesMap: 'hb_notesMap_v1',
    sessionsMap: 'hb_sessions_v1'
  };
  const KEY_TO_UNIFIED_PROP = {
    'hb_completed_sets_v1': 'doneMap',
    'hb_logMap_v1': 'logMap',
    'hb_notesMap_v1': 'notesMap',
    'hb_sessions_v1': 'sessionsMap'
  };
  function loadUnifiedState() {
    try {
      const raw = localStorage.getItem(UNIFIED_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            doneMap: (parsed.doneMap && typeof parsed.doneMap === 'object') ? parsed.doneMap : {},
            logMap: (parsed.logMap && typeof parsed.logMap === 'object') ? parsed.logMap : {},
            notesMap: (parsed.notesMap && typeof parsed.notesMap === 'object') ? parsed.notesMap : {},
            sessionsMap: (parsed.sessionsMap && typeof parsed.sessionsMap === 'object') ? parsed.sessionsMap : {}
          };
        }
      }
    } catch (e) { /* fall through to legacy read below */ }

    // One-time migration from the old four-separate-keys format. The old
    // keys are deliberately left in localStorage untouched here — not
    // deleted — at a negligible storage cost, so this migration can never
    // itself destroy data even if something above it went wrong: worst
    // case, a future load just re-reads the same old keys again.
    const migrated = { doneMap: {}, logMap: {}, notesMap: {}, sessionsMap: {} };
    Object.keys(LEGACY_KEYS).forEach(prop => {
      try {
        const raw = JSON.parse(localStorage.getItem(LEGACY_KEYS[prop]));
        if (raw && typeof raw === 'object') migrated[prop] = raw;
      } catch (e) { /* leave that one property at its {} default */ }
    });
    return migrated;
  }
  let _unifiedState = loadUnifiedState();

  // Debounced write: the in-memory maps (doneMap etc.) update synchronously
  // the instant a set is toggled — the UI never waits — but the actual
  // localStorage.setItem was, until now, ALSO happening synchronously on
  // every single tap, which is exactly the main-thread-blocking write
  // every audit this session flagged as the top critical fix and which
  // never actually got built. Now it does: rapid-fire taps coalesce into
  // one write ~500ms after the user stops, not one write per tap.
  //
  // The risk a debounce like this introduces — losing the last few taps
  // if the tab closes before the delay fires — is handled by flushing
  // immediately (bypassing the delay) on visibilitychange/pagehide, so
  // nothing backgrounds or closes with an unwritten pending save.
  let _unifiedStateSaveTimeout = null;
  let _unifiedStateDirty = false;
  function flushUnifiedState() {
    if (_unifiedStateSaveTimeout) { clearTimeout(_unifiedStateSaveTimeout); _unifiedStateSaveTimeout = null; }
    if (!_unifiedStateDirty) return;
    _unifiedStateDirty = false;
    try {
      localStorage.setItem(UNIFIED_STATE_KEY, JSON.stringify({
        doneMap: doneMap, logMap: logMap, notesMap: notesMap, sessionsMap: sessionsMap
      }));
      scheduleAutoBackup();
    } catch (e) { handleStorageWriteError(e); }
  }
  function saveUnifiedState() {
    _unifiedStateDirty = true;
    if (_unifiedStateSaveTimeout) clearTimeout(_unifiedStateSaveTimeout);
    _unifiedStateSaveTimeout = setTimeout(flushUnifiedState, 500);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushUnifiedState();
  });
  window.addEventListener('pagehide', flushUnifiedState);

  // ===== LOCAL STORAGE — SET COMPLETION =====
  const STORE_KEY = 'hb_completed_sets_v1';
  function loadDone() { return _unifiedState.doneMap; }
  // Surfaces a QuotaExceededError instead of the previous empty catch block
  // silently swallowing it — without this, a full quota meant every future
  // save would appear to work (no error visible to the user) while nothing
  // actually persisted, and the loss wouldn't surface until a later
  // session. Shown once, not per-write, since a full quota means every
  // subsequent write fails the same way.
  let quotaWarningShown = false;
  function handleStorageWriteError(err) {
    const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
    if (isQuota && !quotaWarningShown) {
      quotaWarningShown = true;
      showInfoToast('Storage full — export your data now (Export Backup, below) to avoid losing progress.');
    }
  }
  // Both saveDone and saveMap (below) now write the full unified blob via
  // saveUnifiedState() regardless of which specific map actually changed —
  // every call site passes the corresponding live global as its argument
  // (verified: doneMap here is always the current global, never a copy),
  // so ignoring the argument and reading the globals directly is
  // equivalent, and it's what makes the underlying write atomic across
  // all four maps at once instead of four independent ones.
  function saveDone(obj) { saveUnifiedState(); }
  let doneMap = loadDone();

  // ===== LOCAL STORAGE — AUTO-REST PREFERENCE =====
  const AUTO_REST_KEY = 'hb_autoRest_v1';
  function loadAutoRest() {
    try {
      const raw = localStorage.getItem(AUTO_REST_KEY);
      return raw === null ? true : JSON.parse(raw); // default on for first-time visitors
    } catch (e) { return true; }
  }
  function saveAutoRest(val) {
    try { localStorage.setItem(AUTO_REST_KEY, JSON.stringify(val)); } catch (e) {}
  }
  let autoRestEnabled = loadAutoRest();
  function setAutoRest(val) {
    autoRestEnabled = !!val;
    saveAutoRest(autoRestEnabled);
  }
  function initAutoRestToggle() {
    const el = document.getElementById('autoRestToggle');
    if (el) el.checked = autoRestEnabled; // sync checkbox to stored pref on load
  }

  // ===== LOCAL STORAGE — HIGH CONTRAST GYM MODE =====
  const HIGH_CONTRAST_KEY = 'hb_highContrast_v1';
  function loadHighContrast() {
    try { return JSON.parse(localStorage.getItem(HIGH_CONTRAST_KEY) || 'false'); } catch (e) { return false; }
  }
  function saveHighContrast(val) {
    try { localStorage.setItem(HIGH_CONTRAST_KEY, JSON.stringify(val)); } catch (e) {}
  }
  let highContrastEnabled = loadHighContrast();
  function applyHighContrast() {
    document.body.classList.toggle('high-contrast', highContrastEnabled);
    const btn = document.getElementById('mbHighContrastBtn');
    if (btn) {
      btn.classList.toggle('active', highContrastEnabled);
      btn.setAttribute('aria-pressed', String(highContrastEnabled));
    }
  }
  function toggleHighContrast() {
    highContrastEnabled = !highContrastEnabled;
    saveHighContrast(highContrastEnabled);
    applyHighContrast();
  }

  // ===== LOCAL STORAGE — VOICE ANNOUNCEMENT PREFERENCE =====
  const AUDIO_KEY = 'hb_audioEnabled_v1';
  function loadAudioEnabled() {
    try {
      const raw = localStorage.getItem(AUDIO_KEY);
      return raw === null ? true : JSON.parse(raw); // default on for first-time visitors
    } catch (e) { return true; }
  }
  function saveAudioEnabled(val) {
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(val)); } catch (e) {}
  }
  let audioEnabled = loadAudioEnabled();
  const AUDIO_ICON_ON = '<svg id="mbAudioIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  const AUDIO_ICON_OFF = '<svg id="mbAudioIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  function updateAudioBtn() {
    const btn = document.getElementById('mbAudioBtn');
    if (!btn) return;
    btn.innerHTML = audioEnabled ? AUDIO_ICON_ON : AUDIO_ICON_OFF;
    btn.classList.toggle('muted', !audioEnabled);
    btn.setAttribute('aria-pressed', String(audioEnabled));
    btn.title = audioEnabled ? 'Rest-timer voice announcements: on' : 'Rest-timer voice announcements: off';
  }
  function toggleAudioAnnouncements() {
    audioEnabled = !audioEnabled;
    saveAudioEnabled(audioEnabled);
    updateAudioBtn();
    // Cancel anything mid-speech the moment the user mutes.
    if (!audioEnabled && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function setKeyFor(dot) {
    const card = dot.closest('.exercise-card');
    const ex = card ? card.getAttribute('data-exercise') : 'unknown';
    // Prefer the stable data-set-idx (assigned once, in markup order) over the
    // dot's visible text — text like "1"/"L"/"R" is cosmetic and would silently
    // break saved progress if the label copy ever changes.
    const setNum = dot.getAttribute('data-set-idx') || dot.textContent.trim();
    return ex + '-set' + setNum;
  }

  function applyStoredCompletion() {
    document.querySelectorAll('.set-dot').forEach(dot => {
      const key = setKeyFor(dot);
      if (doneMap[key]) dot.classList.add('done');
    });
    initSetDotAria();
    document.querySelectorAll('.day-content').forEach(updateDayProgress);
    updateMasterTracker();
    renderAllVolumeCompletions(); // called at init, import, and undo — not high-frequency, so no need to debounce here
  }

  // ===== GROUP SWITCH (Push / Pull / Legs) =====
  function switchGroup(group) {
    currentGroup = group;
    document.body.setAttribute('data-group', group);

    document.querySelectorAll('#groupTabs .group-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab-group') === group);
    });

    const data = PROGRAM[group];
    document.getElementById('heroTitle').innerHTML = data.top + '<br><span class="accent" id="heroAccent">BLUEPRINT</span>';
    document.getElementById('heroSubtitle').innerHTML = data.sub;
    document.getElementById('statEx').textContent = data.ex;
    document.getElementById('statSets').textContent = data.sets;
    document.getElementById('statMuscles').textContent = data.muscles;
    document.getElementById('statMin').textContent = data.min;

    showCurrentDay();
    syncHash();
  }

  // ===== DAY SWITCH (A / B) =====
  function switchDay(day) {
    if (navigator.vibrate) navigator.vibrate(15);
    currentDay = day;
    document.getElementById('btnDayA').classList.toggle('active', day === 'A');
    document.getElementById('btnDayB').classList.toggle('active', day === 'B');
    showCurrentDay();
    syncHash();
  }

  // ===== URL HASH ROUTING (survives mobile browser unload/reload) =====
  function syncHash() {
    try { history.replaceState(null, '', '#' + currentGroup + currentDay); } catch (e) {}
  }

  function restoreFromHash() {
    const hash = window.location.hash.replace('#', '');
    const match = hash.match(/^(push|pull|legs)([AB])$/i);
    if (!match) return false;
    switchGroup(match[1].toLowerCase());
    switchDay(match[2].toUpperCase());
    return true;
  }

  function showCurrentDay() {
    document.querySelectorAll('.day-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(currentGroup + currentDay);
    if (target) target.classList.add('active');
    if (typeof updateActiveDayIndicator === 'function') updateActiveDayIndicator();
    if (typeof updateSessionMinibar === 'function') updateSessionMinibar();
    if (typeof hideRestTimer === 'function') hideRestTimer();

    setTimeout(() => {
      const dayEl = document.getElementById(currentGroup + currentDay);
      if (!dayEl) return;

      // Re-arm the reveal observer. No forced reflow needed here — the
      // IntersectionObserver callback that re-adds .visible fires
      // asynchronously on its own frame, well after the browser has
      // already painted this class removal naturally.
      dayEl.querySelectorAll('.reveal').forEach(el => {
        el.classList.remove('visible');
        observer.observe(el);
      });

      // Restarting a CSS animation from JS does need one forced layout
      // flush between "animation: none" and re-applying it — but only ONE
      // flush for the whole day, not one per card. Batch every "clear"
      // write first, force a single reflow, then batch every "re-apply"
      // write — instead of interleaving write/read/write/read per card,
      // which was forcing a separate synchronous layout for each one.
      const cards = dayEl.querySelectorAll('.exercise-card');
      cards.forEach(el => { el.style.animation = 'none'; });
      void dayEl.offsetWidth;
      cards.forEach((el, i) => {
        el.style.animation = 'fadeUp 0.5s ease forwards';
        el.style.animationDelay = (i * 0.06) + 's';
      });
    }, 40);
  }

  function jumpToDay(group, day) {
    switchGroup(group);
    switchDay(day);
    const el = document.getElementById('workout');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ===== CARD EXPAND/COLLAPSE =====
  // grid-template-rows: 0fr->1fr auto-sizes to content for free but isn't
  // compositor-threaded. max-height needs an actual pixel target to
  // animate smoothly, and — unlike the grid trick — doesn't keep re-sizing
  // itself if content changes after the animation finishes (typing a
  // multi-line note, opening the warmup calculator). So: measure and
  // animate to a real height on expand, then lift the cap once the
  // transition ends so later growth isn't clipped; on collapse, snap back
  // to the current natural height first (CSS can't transition from
  // "none"), then animate that down to 0.
  function setExerciseBodyHeight(card, expand) {
    const body = card.querySelector('.exercise-body');
    const inner = card.querySelector('.exercise-body-inner');
    if (!body || !inner) return;
    if (expand) {
      body.style.maxHeight = inner.scrollHeight + 'px';
      const onEnd = (e) => {
        if (e.target !== body || e.propertyName !== 'max-height') return;
        // Still expanded when the transition ends? Lift the cap. (If the
        // user collapsed it again mid-animation, leave the cap in place —
        // the collapse handler already set the value it needs.)
        if (card.classList.contains('expanded')) body.style.maxHeight = 'none';
        body.removeEventListener('transitionend', onEnd);
      };
      body.addEventListener('transitionend', onEnd);
    } else {
      body.style.maxHeight = inner.scrollHeight + 'px'; // snap to current (no visible change from 'none')
      void body.offsetHeight; // one forced reflow so the browser has a concrete value to animate from
      body.style.maxHeight = '0px';
    }
  }

  function handleHeaderKey(evt, header) {
    if (evt.key === 'Enter' || evt.key === ' ' || evt.key === 'Spacebar') {
      evt.preventDefault();
      toggleCard(header, evt);
    }
  }

  function toggleCard(header, evt) {
    if (evt && evt.target.closest('.set-tracker')) return;
    const card = header.closest('.exercise-card');
    const wasExpanded = card.classList.contains('expanded');

    card.closest('.day-content').querySelectorAll('.exercise-card.expanded').forEach(c => {
      if (c !== card) {
        c.classList.remove('expanded');
        const h = c.querySelector('.exercise-header');
        if (h) h.setAttribute('aria-expanded', 'false');
        setExerciseBodyHeight(c, false);
      }
    });

    card.classList.toggle('expanded');
    header.setAttribute('aria-expanded', String(!wasExpanded));
    setExerciseBodyHeight(card, !wasExpanded);

    if (!wasExpanded) {
      const teaser = card.querySelector('.next-up-teaser');
      if (teaser) {
        const next = card.nextElementSibling;
        if (next && next.classList.contains('exercise-card')) {
          const nextName = next.querySelector('.exercise-info h3');
          teaser.textContent = 'Next: ' + (nextName ? nextName.textContent.trim() : 'next exercise');
        } else {
          teaser.textContent = 'Last exercise of the day — finish strong.';
        }
      }
      setTimeout(() => {
        card.querySelectorAll('.activation-bar').forEach(bar => {
          const target = bar.getAttribute('style').match(/scaleX\(([\d.]+)\)/);
          if (target) bar.style.transform = 'scaleX(' + target[1] + ')';
        });
      }, 80);
    }
  }

  // ===== SET TRACKER =====
  // aria-label carries the context a sighted user gets for free (which
  // exercise, which set) that the visible "1"/"2"/"3" digit alone doesn't;
  // aria-pressed is the correct native semantic for a toggle button's
  // state, so screen readers announce the state change on their own
  // without needing a separate live-region ping for every single tap.
  function updateSetDotAria(dot) {
    const idx = dot.getAttribute('data-set-idx') || dot.getAttribute('data-set') || '';
    const exName = dot.closest('.exercise-card');
    const h3 = exName && exName.querySelector('.exercise-info h3');
    const label = (h3 ? h3.textContent.trim() + ', ' : '') + 'set ' + idx;
    dot.setAttribute('aria-label', label);
    dot.setAttribute('aria-pressed', String(dot.classList.contains('done')));
  }
  function initSetDotAria() {
    document.querySelectorAll('.set-dot').forEach(updateSetDotAria);
  }

  // ⚠ MONKEY-PATCH CHAIN: also extended later in this file (session-timer
  // script block, near the bottom) — see the "MONKEY-PATCH CHAIN" comment
  // there for the full list and why this pattern exists at all.
  function toggleSet(dot) {
    dot.classList.toggle('done');
    const key = setKeyFor(dot);
    const nowDone = dot.classList.contains('done');
    if (navigator.vibrate && nowDone) { navigator.vibrate(50); }
    if (nowDone) doneMap[key] = true;
    else delete doneMap[key];
    saveDone(doneMap);
    recordSessionTick(nowDone ? 1 : -1);
    updateSetDotAria(dot);

    const card = dot.closest('.exercise-card');
    // Marking a set done implies it was actually performed — without this,
    // doneMap and logMap are two disconnected truths: a set can read
    // "complete" while nothing was ever logged for it. Only commits on
    // marking done, never on un-marking (un-doing a set shouldn't erase
    // what was already logged for it), and only the ONE row for this set —
    // see commitSetLogRow()'s own comment for why it can't reuse
    // saveSetLog() wholesale here.
    if (nowDone && card) {
      const exKey = card.getAttribute('data-exercise');
      const setIdx = dot.getAttribute('data-set-idx');
      if (exKey && setIdx) commitSetLogRow(exKey, card, setIdx);
    }

    const dayEl = dot.closest('.day-content');
    updateDayProgress(dayEl);
    updateMasterTracker(dayEl ? dayEl.id : undefined);
    updateCardCompletionState(card);

    if (nowDone && autoRestEnabled) startRestTimerFor(dot);
    debouncedRenderVolumeCompletions();
  }

  function updateDayProgress(dayEl) {
    if (!dayEl) return;
    const id = dayEl.id; // e.g. "pushA"
    const total = SETS_PER_DAY[id];
    if (!total) return;
    const done = dayEl.querySelectorAll('.set-dot.done').length;

    const capGroup = id.replace(/[AB]$/, '');
    const dayLetter = id.slice(-1);
    const CapGroup = capGroup.charAt(0).toUpperCase() + capGroup.slice(1);

    const ring = document.getElementById('ring' + CapGroup + dayLetter);
    const text = document.getElementById('ringText' + CapGroup + dayLetter);
    const circumference = 2 * Math.PI * 24;
    const pct = Math.min(done / total, 1);
    if (ring) ring.style.strokeDashoffset = circumference * (1 - pct);
    if (text) text.textContent = done + '/' + total;
  }

  // ⚠ MONKEY-PATCH CHAIN: also extended later (session-timer script block)
  // — see the "MONKEY-PATCH CHAIN" comment there.
  function resetDay(dayId) {
    const dayEl = document.getElementById(dayId);
    if (!dayEl) return;
    const doneDots = Array.from(dayEl.querySelectorAll('.set-dot.done'));
    const undoSnapshot = doneDots.map(d => setKeyFor(d));
    doneDots.forEach(d => {
      delete doneMap[setKeyFor(d)];
      d.classList.remove('done');
      updateSetDotAria(d);
    });
    saveDone(doneMap);
    recordSessionTick(-undoSnapshot.length);
    updateDayProgress(dayEl);
    updateMasterTracker(dayEl.id);
    debouncedRenderVolumeCompletions();

    const dayLabel = (dayEl.querySelector('h2') && dayEl.querySelector('h2').textContent.trim())
      || dayId;
    showUndoToast('Reset ' + dayLabel + '.', () => {
      undoSnapshot.forEach(key => { doneMap[key] = true; });
      saveDone(doneMap);
      recordSessionTick(undoSnapshot.length);
      dayEl.querySelectorAll('.set-dot').forEach(d => {
        if (undoSnapshot.includes(setKeyFor(d))) d.classList.add('done');
        updateSetDotAria(d);
      });
      updateDayProgress(dayEl);
      updateMasterTracker(dayEl.id);
      debouncedRenderVolumeCompletions();
    });
  }

  function confirmResetDay(dayId) {
    showConfirmModal('Reset all logged sets for this day? This can be undone for a few seconds after.', () => resetDay(dayId));
  }

  // ===== BACKUP: EXPORT / IMPORT PROGRESS =====
  // localStorage alone is risky (cleared cache, new device, browser reset) —
  // this gives you a portable .json file you own and control.
  function exportProgress() {
    const payload = {
      app: 'hypertrophy-blueprint',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      doneMap: doneMap,
      logMap: logMap,
      notesMap: notesMap,
      sessionsMap: sessionsMap,
      preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hypertrophy-progress-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Warmup % calculator — 50/75/90% jumps toward the top working set's
  // weight, rounded to the nearest 2.5kg (standard small-plate increment).
  // Reads whatever's currently in set 1's weight field (typed, auto-filled
  // suggestion, or already-saved) — no separate target-weight input needed.
  function toggleWarmupCalc(exKey) {
    const el = document.getElementById('warmupCalc-' + exKey);
    if (!el) return;
    if (el.classList.contains('open')) { el.classList.remove('open'); el.innerHTML = ''; return; }
    const card = document.querySelector('.exercise-card[data-exercise="' + exKey + '"]');
    const topInput = card && card.querySelector('.log-weight[data-set="1"]');
    const top = topInput ? parseFloat(topInput.value) : NaN;
    if (!top || top <= 0) {
      el.innerHTML = '<span class="warmup-hint">Enter set 1\'s weight first.</span>';
      el.classList.add('open');
      return;
    }
    const round25 = n => Math.round(n / 2.5) * 2.5;
    const steps = [0.5, 0.75, 0.9].map(pct => round25(top * pct));
    el.innerHTML = steps.map((w, i) => '<span class="warmup-step">' + [50, 75, 90][i] + '%: <b>' + w + 'kg</b></span>').join('');
    el.classList.add('open');
  }

  function csvEscape(val) {
    const s = String(val);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  // Flattened logMap for spreadsheet analysis. Deliberately leaves notes
  // out — notesMap is a single undated string per exercise, not tied to
  // any particular session, so attaching it to specific dated rows here
  // would misrepresent it as session-specific when it isn't.
  function exportCSV() {
    const rows = [['date', 'exercise', 'set', 'weight_kg', 'reps', 'rir']];
    Object.keys(logMap).sort().forEach(exKey => {
      Object.keys(logMap[exKey]).sort().forEach(date => {
        const sets = logMap[exKey][date];
        Object.keys(sets).map(Number).sort((a, b) => a - b).forEach(setIdx => {
          const s = sets[setIdx];
          if (!s.w && !s.r && !s.rir) return;
          rows.push([date, exKey, setIdx, s.w || '', s.r || '', s.rir || '']);
        });
      });
    });
    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hypertrophy-log-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===== AUTO-BACKUP (File System Access API) =====
  // Session-scoped by design: the file handle only lives in a JS variable
  // for this tab's lifetime. Persisting a handle across page reloads would
  // need IndexedDB (handles aren't localStorage-serializable), and this
  // app has no IndexedDB layer — adding one just for this toggle would be
  // a bigger architectural change than a convenience feature warrants.
  // Re-enabling after a reload takes one click. Chrome/Edge (desktop and
  // Android) support the underlying API; Safari and Firefox don't as of
  // writing, so the button explains that instead of silently failing.
  let autoBackupHandle = null;
  let autoBackupTimeout = null;
  function isAutoBackupSupported() { return typeof window.showSaveFilePicker === 'function'; }

  async function toggleAutoBackup() {
    const btn = document.getElementById('autoBackupBtn');
    if (autoBackupHandle) {
      autoBackupHandle = null;
      clearTimeout(autoBackupTimeout);
      if (btn) { btn.textContent = 'Enable Auto-Backup'; btn.classList.remove('active-toggle'); }
      showInfoToast('Auto-backup turned off.');
      return;
    }
    if (!isAutoBackupSupported()) {
      showInfoToast('Auto-backup needs a browser with File System Access support (Chrome or Edge) — Export Backup still works here.');
      return;
    }
    try {
      autoBackupHandle = await window.showSaveFilePicker({
        suggestedName: 'hypertrophy-progress-autobackup.json',
        types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }]
      });
      if (btn) { btn.textContent = 'Auto-Backup: On'; btn.classList.add('active-toggle'); }
      await writeAutoBackup();
      showInfoToast('Auto-backup enabled for this session.');
    } catch (err) {
      // Picker cancelled or permission denied — not worth surfacing as an
      // error, just leave auto-backup off.
      autoBackupHandle = null;
    }
  }

  async function writeAutoBackup() {
    if (!autoBackupHandle) return;
    try {
      const payload = {
        app: 'hypertrophy-blueprint',
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        doneMap: doneMap,
        logMap: logMap,
        notesMap: notesMap,
        sessionsMap: sessionsMap,
        preferences: { autoRestEnabled: autoRestEnabled, audioEnabled: audioEnabled }
      };
      const writable = await autoBackupHandle.createWritable();
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();
    } catch (err) {
      // Handle invalidated or permission revoked mid-session — disable
      // quietly rather than repeatedly failing on every future save.
      autoBackupHandle = null;
      const btn = document.getElementById('autoBackupBtn');
      if (btn) { btn.textContent = 'Enable Auto-Backup'; btn.classList.remove('active-toggle'); }
    }
  }

  // Called from saveDone()/saveMap() — the two central write paths — so
  // every mutation source (set toggles, log edits, notes, import, reset)
  // is covered automatically with no need to call this from each of them
  // individually. Debounced so rapid-fire set taps become one disk write,
  // not one per tap.
  function scheduleAutoBackup() {
    if (!autoBackupHandle) return;
    clearTimeout(autoBackupTimeout);
    autoBackupTimeout = setTimeout(writeAutoBackup, 5000);
  }

  const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024; // 5MB — a JSON workout log has no legitimate reason to be anywhere near this
  const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];
  function hasUnsafeKeys(obj, depth) {
    if (depth > 6 || !obj || typeof obj !== 'object') return false;
    for (const key of Object.keys(obj)) {
      if (UNSAFE_KEYS.includes(key)) return true;
      if (hasUnsafeKeys(obj[key], depth + 1)) return true;
    }
    return false;
  }
  // Drops (rather than rejecting the whole import over) any entry that's
  // malformed, out of a sane physical range, or references an exercise key
  // that doesn't exist in the current program — a garbled or fabricated
  // single entry shouldn't cost you the rest of an otherwise-good backup.
  function sanitizeLogMap(rawLogMap, validExerciseKeys) {
    const clean = {};
    Object.keys(rawLogMap).forEach(exKey => {
      if (!validExerciseKeys.has(exKey)) return;
      const dates = rawLogMap[exKey];
      if (!dates || typeof dates !== 'object') return;
      const cleanDates = {};
      Object.keys(dates).forEach(date => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        const sets = dates[date];
        if (!sets || typeof sets !== 'object') return;
        const cleanSets = {};
        Object.keys(sets).forEach(setIdx => {
          const s = sets[setIdx];
          if (!s || typeof s !== 'object') return;
          const w = parseFloat(s.w), r = parseFloat(s.r), rir = parseFloat(s.rir);
          const wOk = s.w === '' || s.w == null || (isFinite(w) && w >= 0 && w <= 2000);
          const rOk = s.r === '' || s.r == null || (isFinite(r) && r >= 0 && r <= 100);
          const rirOk = s.rir === '' || s.rir == null || (isFinite(rir) && rir >= 0 && rir <= 20);
          if (wOk && rOk && rirOk) cleanSets[setIdx] = { w: s.w, r: s.r, rir: s.rir, pr: s.pr === true };
        });
        if (Object.keys(cleanSets).length) cleanDates[date] = cleanSets;
      });
      if (Object.keys(cleanDates).length) clean[exKey] = cleanDates;
    });
    return clean;
  }

  // Rewritten to validate the ENTIRE payload — schema identity, unsafe
  // keys, shapes, numeric bounds, orphaned exercise references — before
  // touching any live state, and to commit every map together at the end.
  // The old version assigned doneMap and saved it immediately, before the
  // rest of the file had even been checked; a parse failure partway
  // through left the user's current progress already overwritten with no
  // way back. Now nothing is mutated unless everything above it passed.
  // Drops any note entry with a malformed date key, references an
  // exercise that no longer exists, or isn't a string — mirrors
  // sanitizeLogMap's "drop the bad entry, keep the rest" approach.
  function sanitizeNotesMap(rawNotesMap, validExerciseKeys) {
    const clean = {};
    Object.keys(rawNotesMap).forEach(exKey => {
      if (!validExerciseKeys.has(exKey)) return;
      const dates = rawNotesMap[exKey];
      if (!dates || typeof dates !== 'object') return;
      const cleanDates = {};
      Object.keys(dates).forEach(date => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        if (typeof dates[date] === 'string' && dates[date]) {
          cleanDates[date] = dates[date].slice(0, 2000);
        }
      });
      if (Object.keys(cleanDates).length) clean[exKey] = cleanDates;
    });
    return clean;
  }

  function importProgress(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showInfoToast('That file is too large to be a valid backup.');
      document.getElementById('importFileInput').value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (hasUnsafeKeys(parsed, 0)) throw new Error('Unsafe key in payload');

        // Only accept a file that identifies itself as this app's own
        // backup format, or the oldest legacy shape (a bare flat
        // {"key": true, ...} object with no wrapper at all, from before
        // the "app" field existed) — anything else is rejected rather
        // than silently "succeeding" on unrelated JSON with an object shape.
        const looksLikeOwnBackup = !!(parsed && parsed.app === 'hypertrophy-blueprint');
        const looksLikeLegacyDoneMapOnly = !!(parsed && typeof parsed === 'object' && !parsed.app
          && Object.values(parsed).every(v => typeof v === 'boolean'));
        if (!looksLikeOwnBackup && !looksLikeLegacyDoneMapOnly) throw new Error('Not a recognized backup file');

        const finalDone = looksLikeOwnBackup ? parsed.doneMap : parsed;
        if (!finalDone || typeof finalDone !== 'object') throw new Error('Invalid doneMap');

        const validExerciseKeys = new Set(
          Array.from(document.querySelectorAll('[data-exercise]')).map(el => el.getAttribute('data-exercise'))
        );
        const cleanDoneMap = {};
        Object.keys(finalDone).forEach(key => {
          const exPart = key.replace(/-set[^-]+$/, ''); // matches setKeyFor()'s "<exercise>-set<N>" format
          if (validExerciseKeys.has(exPart) && finalDone[key] === true) cleanDoneMap[key] = true;
        });

        let cleanLogMap = null;
        if (looksLikeOwnBackup && parsed.logMap && typeof parsed.logMap === 'object') {
          cleanLogMap = sanitizeLogMap(migrateLogMapToDated(parsed.logMap), validExerciseKeys);
        }
        let cleanNotesMap = null;
        if (looksLikeOwnBackup && parsed.notesMap && typeof parsed.notesMap === 'object') {
          cleanNotesMap = sanitizeNotesMap(migrateNotesMapToDated(parsed.notesMap), validExerciseKeys);
        }
        let cleanSessionsMap = null;
        if (looksLikeOwnBackup && parsed.sessionsMap && typeof parsed.sessionsMap === 'object') {
          cleanSessionsMap = parsed.sessionsMap;
        }
        const prefsToApply = (looksLikeOwnBackup && parsed.preferences && typeof parsed.preferences === 'object')
          ? parsed.preferences : null;

        // ---- Preview before committing, instead of overwriting live
        // state immediately: summarize what the backup actually contains,
        // and let the user back out if it doesn't look like what they
        // expected (wrong file, an old backup grabbed by mistake, etc.)
        // before anything current gets replaced. Reuses the existing
        // confirm-modal infrastructure — this is still a full replace, not
        // a field-by-field merge; building genuine merge semantics (what
        // wins when the same exercise+date+set exists in both, differently)
        // is a meaningfully bigger feature than a preview, and rushing
        // that logic seemed like a worse trade than being upfront that
        // it's still replace-only.
        const setCount = Object.keys(cleanDoneMap).length;
        let loggedSetCount = 0;
        const exerciseCount = cleanLogMap ? Object.keys(cleanLogMap).length : 0;
        if (cleanLogMap) {
          Object.values(cleanLogMap).forEach(dates => {
            Object.values(dates).forEach(sets => { loggedSetCount += Object.keys(sets).length; });
          });
        }
        let noteCount = 0;
        if (cleanNotesMap) {
          Object.values(cleanNotesMap).forEach(dates => { noteCount += Object.keys(dates).length; });
        }
        const parts = [];
        parts.push(setCount + ' completed set' + (setCount === 1 ? '' : 's'));
        if (loggedSetCount) {
          parts.push(loggedSetCount + ' logged entr' + (loggedSetCount === 1 ? 'y' : 'ies')
            + ' across ' + exerciseCount + ' exercise' + (exerciseCount === 1 ? '' : 's'));
        }
        if (noteCount) parts.push(noteCount + ' note' + (noteCount === 1 ? '' : 's'));
        if (prefsToApply) parts.push('your saved preferences');
        const summary = 'This backup contains ' + parts.join(', ')
          + '. Importing will replace your current progress with this data — this can\'t be undone. Continue?';

        showConfirmModal(summary, () => {
          // ---- Every check above passed and the user confirmed — commit everything together ----
          doneMap = cleanDoneMap;
          saveDone(doneMap);
          if (cleanLogMap) { logMap = cleanLogMap; saveMap(LOG_KEY, logMap); }
          if (cleanNotesMap) { notesMap = cleanNotesMap; saveMap(NOTES_KEY, notesMap); }
          if (cleanSessionsMap) { sessionsMap = cleanSessionsMap; saveMap(SESSIONS_KEY, sessionsMap); }
          if (prefsToApply) {
            if (typeof prefsToApply.autoRestEnabled === 'boolean') {
              autoRestEnabled = prefsToApply.autoRestEnabled;
              saveAutoRest(autoRestEnabled);
              const arToggle = document.getElementById('autoRestToggle');
              if (arToggle) arToggle.checked = autoRestEnabled;
            }
            if (typeof prefsToApply.audioEnabled === 'boolean') {
              audioEnabled = prefsToApply.audioEnabled;
              saveAudioEnabled(audioEnabled);
              if (typeof updateAudioBtn === 'function') updateAudioBtn();
            }
          }

          document.querySelectorAll('.set-dot.done').forEach(d => { d.classList.remove('done'); updateSetDotAria(d); });
          applyStoredCompletion();
          initExerciseEnhancements(); // refreshes last-log/last-session/log-inputs/notes per card from the new logMap/notesMap
          renderHistory();            // refreshes the sparkline + this-week/last-week counts from the new sessionsMap

          showInfoToast('Progress imported successfully.');
        });
      } catch (err) {
        showInfoToast('Could not import this file — it does not look like a valid backup.');
      } finally {
        document.getElementById('importFileInput').value = '';
      }
    };
    reader.readAsText(file);
  }

  // ===== MESOCYCLE WEEK COUNTER =====
  // Manual rolling cycle, by explicit product decision: the week only
  // resets when the user presses "Reset Entire Week" — there is no
  // calendar-based auto-reset (see the Standards section's "deload every
  // 6th week" note, which this counter now tracks directly). Cycles
  // 1 -> 2 -> ... -> 6 (deload) -> 1 on each manual reset.
  const MESOCYCLE_KEY = 'hb_mesocycleWeek_v1';
  function loadMesocycleWeek() {
    try {
      const n = parseInt(localStorage.getItem(MESOCYCLE_KEY), 10);
      return (n >= 1 && n <= 6) ? n : 1;
    } catch (e) { return 1; }
  }
  function saveMesocycleWeek(n) {
    try { localStorage.setItem(MESOCYCLE_KEY, String(n)); }
    catch (e) { handleStorageWriteError(e); }
  }
  let mesocycleWeek = loadMesocycleWeek();
  function renderMesocycleBanner() {
    const el = document.getElementById('mesocycleBanner');
    if (!el) return;
    const isDeload = mesocycleWeek === 6;
    el.classList.toggle('deload', isDeload);
    el.textContent = isDeload
      ? 'Week 6 of 6 — Deload: drop sets, skip failure work'
      : 'Week ' + mesocycleWeek + ' of 6';
  }

  function resetAllProgress() {
    const undoSnapshot = { ...doneMap };
    const undoCount = Object.keys(undoSnapshot).length;
    const priorMesocycleWeek = mesocycleWeek;
    doneMap = {};
    saveDone(doneMap);
    recordSessionTick(-undoCount);
    document.querySelectorAll('.set-dot.done').forEach(d => { d.classList.remove('done'); updateSetDotAria(d); });
    document.querySelectorAll('.day-content').forEach(updateDayProgress);
    updateMasterTracker();
    renderAllVolumeCompletions();

    mesocycleWeek = mesocycleWeek >= 6 ? 1 : mesocycleWeek + 1;
    saveMesocycleWeek(mesocycleWeek);
    renderMesocycleBanner();

    showUndoToast('Reset entire week.', () => {
      doneMap = { ...undoSnapshot };
      saveDone(doneMap);
      recordSessionTick(undoCount);
      applyStoredCompletion();
      mesocycleWeek = priorMesocycleWeek;
      saveMesocycleWeek(mesocycleWeek);
      renderMesocycleBanner();
    });
  }

  function confirmResetAll() {
    showConfirmModal('Reset ALL progress across every session this week? This can be undone for a few seconds after.', resetAllProgress);
  }

  // ===== MASTER WEEKLY TRACKER =====
  const TRACKER_IDS = ['pushA', 'pushB', 'pullA', 'pullB', 'legsA', 'legsB'];

  // Cache all per-day DOM references + last-known done-counts once, instead
  // of re-running getElementById/querySelector for all 6 days on every
  // single set tap. Populated lazily on first use so call order doesn't
  // matter. `done` is only ever written by updateMasterTracker itself, so
  // it can't drift out of sync with the DOM between calls.
  const trackerDayCache = {};
  function buildTrackerDayCache() {
    TRACKER_IDS.forEach(id => {
      const capGroup = id.replace(/[AB]$/, '');
      const CapGroup = capGroup.charAt(0).toUpperCase() + capGroup.slice(1);
      const dayLetter = id.slice(-1);
      trackerDayCache[id] = {
        dayEl: document.getElementById(id),
        bar: document.getElementById('bar' + CapGroup + dayLetter),
        count: document.getElementById('count' + CapGroup + dayLetter),
        card: document.querySelector('.tracker-day-card[data-jump="' + capGroup + '"][data-day="' + dayLetter + '"]'),
        done: 0
      };
    });
    trackerDayCache.__built = true;
  }

  // changedDayId (e.g. 'pushA'): only that one day gets its set-dots
  // rescanned; the other 5 reuse their cached count. Omit it (init, full
  // reset, import) to force a full rescan of every day.
  function updateMasterTracker(changedDayId) {
    if (!trackerDayCache.__built) buildTrackerDayCache();
    let totalDone = 0;
    TRACKER_IDS.forEach(id => {
      const entry = trackerDayCache[id];
      if (!entry) return;
      const total = SETS_PER_DAY[id];
      if (!changedDayId || changedDayId === id) {
        entry.done = entry.dayEl ? entry.dayEl.querySelectorAll('.set-dot.done').length : 0;
      }
      totalDone += entry.done;

      const pct = total ? Math.min(entry.done / total, 1) * 100 : 0;
      if (entry.bar) entry.bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      if (entry.count) entry.count.textContent = entry.done + '/' + total + ' sets';
      if (entry.card) entry.card.classList.toggle('complete', entry.done >= total && total > 0);
    });

    const overallPct = TOTAL_SETS ? totalDone / TOTAL_SETS : 0;
    const ring = document.getElementById('masterRing');
    const ringText = document.getElementById('masterRingText');
    const ringSets = document.getElementById('masterRingSets');
    const circumference = 2 * Math.PI * 54;
    if (ring) ring.style.strokeDashoffset = circumference * (1 - overallPct);
    if (ringText) ringText.textContent = Math.round(overallPct * 100) + '%';
    if (ringSets) ringSets.textContent = totalDone + '/' + TOTAL_SETS + ' sets';

    const trackerInfoP = document.querySelector('.tracker-info p');
    if (trackerInfoP) {
      trackerInfoP.textContent = totalDone === 0
        ? 'Zero sets logged this week. The bar is waiting.'
        : 'Tracks every working set across all 6 sessions — Leg A/B, Push A/B and Pull A/B. Progress persists locally in this browser between visits.';
    }

    if (overallPct >= 1 && !window.__weekCelebrated) {
      window.__weekCelebrated = true;
      fireConfetti();
    } else if (overallPct < 1) {
      window.__weekCelebrated = false;
    }

    updateActiveDayIndicator();
    updateSessionMinibar();
  }

  // ===== ANATOMY TABS =====
  function switchAnatomyTab(group) {
    document.querySelectorAll('#anatomyTabs .group-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab-group') === group);
    });
    document.querySelectorAll('.anatomy-panel').forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-group') === group);
    });
  }

  // ===== SOURCES TABS =====
  function switchSourcesTab(group) {
    document.querySelectorAll('#sourcesTabs .group-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab-group') === group);
    });
    document.querySelectorAll('.sources-group-panel').forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('data-group') === group);
    });
  }

  // ===== AMBIENT PARTICLES =====
  // Skipped entirely (not just frozen) under reduced-motion: spawning 18 DOM
  // nodes that never animate still costs layout/paint for no visual benefit.
  (function spawnParticles(){
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wrap = document.getElementById('heroParticles');
    if (!wrap) return;
    for (let i = 0; i < 18; i++) {
      const e = document.createElement('div');
      e.className = 'hero-particle';
      e.style.left = (Math.random() * 100) + '%';
      e.style.animationDuration = (6 + Math.random() * 6) + 's';
      e.style.animationDelay = (Math.random() * 8) + 's';
      e.style.opacity = 0.3 + Math.random() * 0.4;
      wrap.appendChild(e);
    }
  })();

  // ===== SCROLL REVEAL =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // One-shot reveal — stop watching once it's played. showCurrentDay()
        // re-observes elements explicitly when a day is switched back to,
        // so this doesn't lose the replay-on-day-switch behavior.
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('.exercise-card').forEach((card, i) => {
    card.style.animationDelay = (i * 0.05) + 's';
  });

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ================================================================
  // ===== EVERYTHING BELOW THIS LINE IS THE NEW FEATURE BATCH =====
  // ================================================================

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }
  // Debounced trigger for the volume-audit "completed so far" badges.
  // renderAllVolumeCompletions() is otherwise only re-armed by scrolling
  // the section back into view (see its IntersectionObserver setup) —
  // deliberately, to avoid a full multi-card scan on every single set tap.
  // But that alone means the badges go stale and never catch up if the
  // user stays scrolled past the section for the rest of a session (kiosk
  // mode, working through a day's list). This covers that gap without
  // reintroducing the per-tap cost: rapid-fire taps coalesce into one
  // recompute ~2s after the user stops, not one per tap. Defined here
  // (rather than after renderAllVolumeCompletions's own declaration,
  // further down) works fine — function declarations are hoisted with
  // their full implementation, so this correctly captures the finished
  // function regardless of textual order.
  const debouncedRenderVolumeCompletions = debounce(() => renderAllVolumeCompletions(), 2000);
  // Redirected through the same unified blob as saveDone/loadDone above —
  // `key` is only used to look up which property of _unifiedState to
  // return/which live global to treat as already-current; the actual
  // write is always the single atomic saveUnifiedState() call.
  function loadMap(key) {
    const prop = KEY_TO_UNIFIED_PROP[key];
    return prop ? _unifiedState[prop] : {};
  }
  function saveMap(key, obj) { saveUnifiedState(); }

  // ===== MOBILE HAMBURGER DRAWER =====
  // Focus trap: while the drawer is open, Tab/Shift+Tab cycle only through
  // its own focusable elements instead of escaping to the page underneath
  // (which is still there, just visually covered by the drawer overlay).
  let drawerReturnFocus = null;
  function getFocusableIn(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null); // skip hidden elements
  }
  function trapDrawerTab(e) {
    if (e.key !== 'Tab') return;
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer || !drawer.classList.contains('open')) return;
    const focusable = getFocusableIn(drawer);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  document.addEventListener('keydown', trapDrawerTab);

  function toggleDrawer(force) {
    const drawer = document.getElementById('mobileDrawer');
    const btn = document.getElementById('hamburgerBtn');
    const open = typeof force === 'boolean' ? force : !drawer.classList.contains('open');
    drawer.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      drawerReturnFocus = document.activeElement;
      const focusable = getFocusableIn(drawer);
      if (focusable.length) focusable[0].focus();
    } else if (drawerReturnFocus) {
      drawerReturnFocus.focus();
      drawerReturnFocus = null;
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const drawer = document.getElementById('mobileDrawer');
      if (drawer && drawer.classList.contains('open')) { toggleDrawer(false); return; }
      const openModal = document.querySelector('.app-modal-overlay.open');
      if (openModal) { openModal.classList.remove('open'); return; }
      if (kioskActive) exitKioskMode();
    }
  });

  // ===== GENERIC MODALS =====
  function openStandardsModal() { document.getElementById('standardsModalOverlay').classList.add('open'); }
  function openHistoryModal() { renderHistory(); document.getElementById('historyModalOverlay').classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  document.querySelectorAll('.app-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  // Replaces window.confirm() — a blocking native dialog with no styling,
  // no haptics, that felt jarring against the rest of the app's custom UI.
  // confirmModalCallback only ever gets invoked by the Confirm button's own
  // onclick below; Escape and overlay-click both just remove the .open
  // class (same as any other .app-modal-overlay), which safely defaults to
  // "cancel" without needing to know about this modal's callback at all.
  let confirmModalCallback = null;
  function showConfirmModal(message, onConfirm) {
    const msgEl = document.getElementById('confirmModalMessage');
    if (msgEl) msgEl.textContent = message;
    confirmModalCallback = onConfirm;
    document.getElementById('confirmModalOverlay').classList.add('open');
  }
  function closeConfirmModal(confirmed) {
    document.getElementById('confirmModalOverlay').classList.remove('open');
    const cb = confirmModalCallback;
    confirmModalCallback = null;
    if (confirmed && cb) cb();
  }

  // Replaces window.alert() for non-blocking notifications (import
  // success/failure) — reuses the existing toast stack, just without the
  // undo button showUndoToast's toasts have.
  function showInfoToast(message) {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const msg = document.createElement('span');
    msg.textContent = message;
    toast.appendChild(msg);
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ===== UNDO TOAST =====
  function showUndoToast(message, onUndo) {
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const msg = document.createElement('span');
    msg.textContent = message;
    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo';
    let undone = false;
    undoBtn.onclick = () => {
      if (undone) return;
      undone = true;
      onUndo();
      toast.remove();
    };
    toast.appendChild(msg);
    toast.appendChild(undoBtn);
    stack.appendChild(toast);
    setTimeout(() => { if (!undone) toast.remove(); }, 5000);
  }

  // ===== STICKY SESSION MINI-BAR =====
  // ⚠ MONKEY-PATCH CHAIN: also extended later (session-timer script block)
  // — see the "MONKEY-PATCH CHAIN" comment there.
  function updateSessionMinibar() {
    const dayEl = document.getElementById(currentGroup + currentDay);
    if (!dayEl) return;
    const total = SETS_PER_DAY[currentGroup + currentDay] || 0;
    const done = dayEl.querySelectorAll('.set-dot.done').length;
    const nameEl = dayEl.querySelector('h2');
    document.getElementById('mbDay').textContent = nameEl ? nameEl.textContent.trim() : (currentGroup + ' ' + currentDay);
    document.getElementById('mbProgress').textContent = done + '/' + total + ' sets';

    const pct = total ? done / total : 0;
    const ringCircumference = 2 * Math.PI * 12; // r=12
    const ringFill = document.getElementById('mbRingFill');
    const ringText = document.getElementById('mbRingText');
    if (ringFill) ringFill.style.strokeDashoffset = ringCircumference * (1 - pct);
    if (ringText) ringText.textContent = Math.round(pct * 100) + '%';
  }
  // ===== STICKY SESSION MINI-BAR VISIBILITY (IntersectionObserver, no scroll listener) =====
  // Replaces a scroll handler that read hero.offsetHeight on every scroll tick —
  // that forces a synchronous layout recalculation mid-scroll. An observer only
  // fires when .hero actually crosses the viewport edge, so it's effectively free.
  const __heroEl = document.querySelector('.hero');
  if (__heroEl) {
    const minibarObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Kiosk mode owns mini-bar visibility itself (always visible while active) —
        // don't fight it with hero-scroll state.
        if (kioskActive) return;
        document.getElementById('sessionMinibar').classList.toggle('visible', !entry.isIntersecting);
      });
    }, { rootMargin: '-120px 0px 0px 0px', threshold: 0 });
    minibarObserver.observe(__heroEl);
  }

  // ===== ACTIVE-DAY PULSE INDICATOR =====
  function updateActiveDayIndicator() {
    document.querySelectorAll('.tracker-day-card').forEach(card => {
      const match = card.getAttribute('data-jump') === currentGroup && card.getAttribute('data-day') === currentDay;
      card.classList.toggle('active-day', match);
    });
  }

  // ===== REST TIMER =====
  let restInterval = null, restRemaining = 0, restEndTime = 0;
  let restAudioCtx = null; // lazily created inside showRestTimer(), which only
                            // ever runs off a user tap (toggleSet -> startRestTimerFor),
                            // so the AudioContext is created within a user-gesture
                            // call stack and won't get autoplay-blocked later
                            // when the interval actually schedules the beep.
  function repRangeToSeconds(dot) {
    const card = dot.closest('.exercise-card');
    const repsPill = card ? card.querySelector('.meta-pill .value') : null;
    // meta-pills render in order Sets / Reps / RIR — the 2nd pill is Reps
    const pills = card ? card.querySelectorAll('.meta-pill .value') : [];
    const repsText = pills[1] ? pills[1].textContent.trim() : '';
    const lowNum = parseInt((repsText.match(/\d+/) || [null])[0], 10);
    if (!lowNum || lowNum <= 6) return 180;
    if (lowNum <= 8) return 120;
    return 75;
  }
  function startRestTimerFor(dot) {
    const seconds = repRangeToSeconds(dot);
    showRestTimer(seconds);
  }
  function showRestTimer(seconds) {
    // endTime-based instead of decrementing a counter per tick: mobile OSs
    // throttle setInterval aggressively once a tab backgrounds or the
    // screen locks, so a tick-counted timer drifts — it only "catches up"
    // by however many ticks it missed, arriving late and wrong. Storing
    // the actual end timestamp means every tick (however delayed) always
    // computes the true remaining time from Date.now(), so it's correct
    // the moment it's checked, not just correct if every tick fired on
    // schedule.
    restEndTime = Date.now() + seconds * 1000;
    restRemaining = seconds;
    const el = document.getElementById('restTimer');
    el.classList.add('visible');
    el.classList.remove('done');
    renderRestTime();
    // Screen-reader cue for rest starting — independent of the audioEnabled
    // TTS toggle above, since that gates the app's own synthesized voice
    // feature, not a screen-reader user's own assistive tech.
    const live = document.getElementById('a11yLiveRegion');
    if (live) live.textContent = 'Resting ' + seconds + ' seconds.';
    if (restInterval) clearInterval(restInterval);
    // Create/unlock the AudioContext now, synchronously within the tap that
    // started this rest period, so it's already running by the time the
    // interval below needs to schedule the chime.
    if (!restAudioCtx) {
      try { restAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { restAudioCtx = null; }
    } else if (restAudioCtx.state === 'suspended') {
      restAudioCtx.resume().catch(() => {});
    }
    restInterval = setInterval(tickRestTimer, 1000);
  }
  // Pulled out of showRestTimer's interval callback so it can also be
  // called directly the moment the tab regains visibility (see the
  // visibilitychange listener below) — recomputing immediately from
  // Date.now() rather than waiting for a background-throttled interval's
  // next (possibly much-delayed) tick to catch up.
  function tickRestTimer() {
    const el = document.getElementById('restTimer');
    if (!el || !el.classList.contains('visible')) return;
    restRemaining = Math.max(0, Math.round((restEndTime - Date.now()) / 1000));
    if (restRemaining <= 0) {
      restRemaining = 0;
      renderRestTime();
      el.classList.add('done');
      playRestChime();
      announceRestOver();
      const live = document.getElementById('a11yLiveRegion');
      if (live) live.textContent = 'Rest over.';
      if (restInterval) { clearInterval(restInterval); restInterval = null; }
    } else {
      renderRestTime();
    }
    updateSessionMinibar();
    const mb = document.getElementById('mbRest');
    if (mb) mb.textContent = el.classList.contains('visible') ? formatTime(restRemaining) + ' rest' : '';
  }
  // Catch up immediately on regaining foreground, rather than waiting for
  // whatever's left of a throttled interval's delay.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && restInterval) tickRestTimer();
  });
  // Short digital-watch-style double beep, synthesized natively — no audio
  // file to load. Two sine tones (880Hz -> 1175Hz, a rising fifth) each with
  // a fast attack / exponential decay envelope so they read as clean
  // "beeps" rather than clicks or buzzes.
  function playRestChime() {
    if (!restAudioCtx) return;
    try {
      const ctx = restAudioCtx;
      const now = ctx.currentTime;
      const beep = (start, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      };
      beep(now, 880);
      beep(now + 0.18, 1175);
    } catch (e) { /* audio unavailable — fail silently, timer UI already shows "done" */ }
  }
  // Finds the next not-yet-fully-logged exercise in the currently active day,
  // in document order, and returns its heading text — same "what's left"
  // logic updateCardCompletionState() already uses to decide kiosk dimming.
  function getNextUncompletedExerciseName() {
    const dayEl = document.querySelector('.day-content.active');
    if (!dayEl) return null;
    const cards = dayEl.querySelectorAll('.exercise-card');
    for (const card of cards) {
      const dots = card.querySelectorAll('.set-tracker .set-dot');
      const allDone = dots.length > 0 && Array.from(dots).every(d => d.classList.contains('done'));
      if (!allDone) {
        const h3 = card.querySelector('.exercise-info h3');
        if (h3) return h3.textContent.trim();
      }
    }
    return null;
  }
  // Announces "Rest over. Next up: [Exercise]" via the Web Speech API once
  // the rest timer hits 0:00. Respects the mute toggle and only speaks while
  // the tab is actually in front of the user (visible), so a backgrounded
  // tab won't suddenly talk. speechSynthesis + SpeechSynthesisUtterance are
  // absent on some browsers, so both are feature-detected first.
  // Prefers an on-device (non-network) voice so the rest-timer announcement
  // doesn't lag or silently fail on spotty gym WiFi — network-backed voices
  // are common Android defaults. Falls back to whatever's available.
  // Voice list loads async in most browsers — this warms it up early so
  // getPreferredVoice() has something to pick from by the time a rest
  // period actually finishes, not just on the first call.
  if ('speechSynthesis' in window) { window.speechSynthesis.getVoices(); }
  function getPreferredVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    return voices.find(v => v.localService && v.lang && v.lang.startsWith('en'))
      || voices.find(v => v.localService)
      || voices.find(v => v.lang && v.lang.startsWith('en'))
      || voices[0];
  }
  function announceRestOver() {
    if (!audioEnabled) return;
    if (document.visibilityState !== 'visible') return;
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    const nextName = getNextUncompletedExerciseName();
    const text = nextName ? ('Rest over. Next up: ' + nextName) : 'Rest over.';
    try {
      window.speechSynthesis.cancel(); // clear anything queued/stuck from a prior rest period
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.volume = 1;
      const voice = getPreferredVoice();
      if (voice) utter.voice = voice;
      window.speechSynthesis.speak(utter);
    } catch (e) { /* speech unavailable — the beep + visual "done" state still land */ }
  }
  function renderRestTime() {
    document.getElementById('rtTime').textContent = formatTime(restRemaining);
  }
  function formatTime(s) {
    const m = Math.floor(s / 60), r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  function adjustRestTimer(delta) {
    if (navigator.vibrate) navigator.vibrate(12);
    const now = Date.now();
    // If the timer had already finished, restEndTime is stale (in the
    // past) — anchor the adjustment to right now instead of to that
    // stale value, or "+15" after the timer's been sitting on "Done!"
    // for a while would silently add LESS than 15 seconds of actual
    // countdown (or even land back in the past). Still-running timers
    // anchor to their real current end time, unchanged from before.
    const base = Math.max(restEndTime, now);
    restEndTime = base + delta * 1000;
    restRemaining = Math.max(0, Math.round((restEndTime - now) / 1000));
    renderRestTime();
    const el = document.getElementById('restTimer');
    if (restRemaining > 0) {
      el.classList.remove('done');
      // Pre-existing edge case, fixed while already in this function: if
      // the timer had already finished (interval cleared, "done" state)
      // and the user adds time back with +15, restart the countdown —
      // previously this left a static, non-counting display reading
      // "0:15" forever.
      if (!restInterval) restInterval = setInterval(tickRestTimer, 1000);
    }
  }
  function hideRestTimer() {
    document.getElementById('restTimer').classList.remove('visible', 'done');
    if (restInterval) { clearInterval(restInterval); restInterval = null; }
    const mb = document.getElementById('mbRest');
    if (mb) mb.textContent = '';
  }

  // ===== TEMPO PACER (3s lower / 1s stretch hold / explosive up, looped) =====
  // One chained setTimeout (not setInterval) since each phase has a
  // different duration. tempoPacerTimeout holds the single pending timer
  // so stopTempoPacer() always has exactly one thing to clear — never more
  // than one phase is scheduled at a time, so this can't stack into
  // multiple concurrent loops no matter how fast the toggle is tapped.
  let tempoPacerTimeout = null;
  let tempoPacerActive = false;
  const TEMPO_PHASES = [
    { key: 'lower', label: 'Lower', seconds: '3s', duration: 3000, vibrate: 200, speak: 'Down' },
    { key: 'hold', label: 'Hold', seconds: '1s', duration: 1000, vibrate: 80, speak: 'Hold' },
    { key: 'drive', label: 'Drive', seconds: 'X', duration: 700, vibrate: [60, 40, 60], speak: 'Up' }
  ];

  function toggleTempoPacer() {
    if (tempoPacerActive) stopTempoPacer(); else startTempoPacer();
  }

  function startTempoPacer() {
    if (tempoPacerActive) return; // already running — a double-tap is a no-op, not a second loop
    tempoPacerActive = true;
    const widget = document.getElementById('tempoPacer');
    const btn = document.getElementById('mbTempoBtn');
    if (widget) widget.classList.add('visible');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
    runTempoPhase(0);
  }

  function runTempoPhase(index) {
    if (!tempoPacerActive) return; // stopTempoPacer() ran mid-cycle — don't schedule another phase
    const phase = TEMPO_PHASES[index % TEMPO_PHASES.length];
    const labelEl = document.getElementById('tpPhaseLabel');
    const secEl = document.getElementById('tpPhaseSeconds');
    if (labelEl) labelEl.textContent = phase.label;
    if (secEl) secEl.textContent = phase.seconds;
    const widget = document.getElementById('tempoPacer');
    if (widget) {
      widget.classList.remove('phase-lower', 'phase-hold', 'phase-drive');
      widget.classList.add('phase-' + phase.key);
    }
    if (navigator.vibrate) navigator.vibrate(phase.vibrate);
    // Voice call-out respects the same audioEnabled preference as the rest
    // timer's "Rest over" announcement, and reuses the same local-voice
    // preference so it doesn't lag on spotty gym WiFi.
    if (audioEnabled && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        window.speechSynthesis.cancel(); // don't let phase call-outs queue up behind each other
        const utter = new SpeechSynthesisUtterance(phase.speak);
        utter.rate = 1.3;
        utter.volume = 1;
        const voice = getPreferredVoice();
        if (voice) utter.voice = voice;
        window.speechSynthesis.speak(utter);
      } catch (e) { /* speech unavailable — vibration + visual phase state still land */ }
    }
    tempoPacerTimeout = setTimeout(() => runTempoPhase(index + 1), phase.duration);
  }

  function stopTempoPacer() {
    tempoPacerActive = false;
    if (tempoPacerTimeout) { clearTimeout(tempoPacerTimeout); tempoPacerTimeout = null; }
    const widget = document.getElementById('tempoPacer');
    if (widget) { widget.classList.remove('visible', 'phase-lower', 'phase-hold', 'phase-drive'); }
    const btn = document.getElementById('mbTempoBtn');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  // Safety net against the exact "runaway interval" risk: if the tab goes
  // to the background mid-cycle, stop the loop rather than let it keep
  // firing haptics/speech (and holding a live timeout) with nobody looking.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && tempoPacerActive) stopTempoPacer();
  });

  // ===== CONFETTI (lightweight, canvas-based) =====
  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:500;pointer-events:none;width:100vw;height:100vh;';
    // Cap the backing-store DPR at 2x — on a 3x-DPR phone this cuts the
    // pixel count (and per-frame fill cost) to 4/9ths with no visible
    // quality loss, since confetti pieces are small and short-lived.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth, cssH = window.innerHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const colors = ['#369973', '#E8B23D', '#E45228', '#5389B4', '#A574E8'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * cssW, y: -20 - Math.random() * cssH * 0.3,
      w: 6 + Math.random() * 5, h: 8 + Math.random() * 6,
      speed: 2 + Math.random() * 3, drift: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    let frame = 0;
    const maxFrames = 220;
    (function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      pieces.forEach(p => {
        p.y += p.speed; p.x += p.drift; p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < maxFrames) requestAnimationFrame(draw);
      else canvas.remove();
    })();
    const badge = document.querySelector('.tracker-info h5');
    if (badge) {
      const original = badge.textContent;
      badge.textContent = 'Week complete. Recovery starts now.';
      setTimeout(() => { badge.textContent = original; }, 6000);
    }
  }

  // ===== SESSION HISTORY (date-stamped daily set counts) =====
  const SESSIONS_KEY = 'hb_sessions_v1';
  let sessionsMap = loadMap(SESSIONS_KEY);
  // Local calendar date, not UTC — toISOString() shifts across the day
  // boundary at UTC midnight rather than the user's own midnight, which
  // could misfile a late-night set into the next day depending on
  // timezone offset. en-CA's locale format is YYYY-MM-DD by design, so no
  // manual padding/reassembly needed. Shared by the streak tracker,
  // sparkline, session history, and the dated log map — all read this one
  // function, so they all move together.
  function todayKey() { return new Date().toLocaleDateString('en-CA'); }
  function recordSessionTick(delta) {
    if (!delta) return;
    const key = todayKey();
    sessionsMap[key] = (sessionsMap[key] || 0) + delta;
    if (sessionsMap[key] <= 0) delete sessionsMap[key];
    saveMap(SESSIONS_KEY, sessionsMap);
  }
  function renderHistory() {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Bug fix: this used to build keys with d.toISOString().slice(0,10)
      // — a UTC date — while recordSessionTick() (and everything else that
      // reads/writes sessionsMap) uses todayKey()'s local-timezone date.
      // In any timezone ahead of UTC, a session logged between midnight
      // and the UTC offset boundary got saved under one date and looked
      // up under a different one here, so today's sets could show as zero
      // on the sparkline while "this week" (which parses these same keys
      // differently) looked correct. Matching todayKey()'s exact
      // formatting call ensures every reader of sessionsMap agrees on
      // what "today" means.
      const key = d.toLocaleDateString('en-CA');
      days.push({ key, count: sessionsMap[key] || 0 });
    }
    const max = Math.max(1, ...days.map(d => d.count));
    const spark = document.getElementById('historySparkline');
    spark.innerHTML = '';
    days.forEach(d => {
      const bar = document.createElement('div');
      bar.className = 'hs-bar' + (d.count === 0 ? ' empty' : '');
      bar.style.height = Math.max(3, (d.count / max) * 74) + 'px';
      bar.title = d.key + ': ' + d.count + ' sets';
      spark.appendChild(bar);
    });

    const now = new Date();
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    let thisWeek = 0, lastWeek = 0;
    Object.keys(sessionsMap).forEach(key => {
      // new Date("YYYY-MM-DD") parses as UTC midnight per spec, not local
      // midnight — in a negative-UTC-offset timezone that can land the
      // parsed instant on the previous local calendar day, misaligning it
      // against thisWeekStart/lastWeekStart (which ARE local-time Date
      // objects). Building the date from its Y/M/D components instead
      // always uses local-time interpretation, matching everything else
      // here.
      const parts = key.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (d >= thisWeekStart) thisWeek += sessionsMap[key];
      else if (d >= lastWeekStart) lastWeek += sessionsMap[key];
    });
    document.getElementById('histThisWeek').textContent = thisWeek;
    document.getElementById('histLastWeek').textContent = lastWeek;
  }

  // ===== WEIGHT / REPS / RIR LOGGER + PER-EXERCISE NOTES =====
  // Injected generically into every .exercise-card at runtime rather than
  // hand-edited into all ~50 exercise cards in the markup.
  const LOG_KEY = 'hb_logMap_v1';
  const NOTES_KEY = 'hb_notesMap_v1';
  // Schema version gate — lets the one-time logMap/notesMap migrations
  // below skip their scan once already run, instead of re-checking every
  // exercise's shape on every single page load. Bumped to 3 for the
  // notesMap dating migration added alongside this comment — anyone whose
  // browser already has SCHEMA_KEY="2" from before that migration existed
  // needs the gate to re-open, or their notes would stay in the old flat
  // format forever with nothing left to convert them.
  const SCHEMA_VERSION = 3;
  const SCHEMA_KEY = 'hb_schemaVersion_v1';

  // hb_logMap_v1 used to be a flat snapshot — logMap[exKey] = {1: {w,r,rir}, ...} —
  // overwritten in full on every save, so it only ever held "whatever was
  // last typed," with no date attached and no actual history. This wraps
  // any such legacy entry under today's date once, moving to
  // logMap[exKey] = {'YYYY-MM-DD': {1: {w,r,rir}, ...}, ...}. Detection is
  // by shape (are the top-level keys dates or set indices), so it's a no-op
  // — and safe to leave in permanently — once everything's already migrated.
  function migrateLogMapToDated(map) {
    Object.keys(map).forEach(exKey => {
      const entry = map[exKey];
      if (!entry || typeof entry !== 'object') return;
      const keys = Object.keys(entry);
      const looksDated = keys.every(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
      if (keys.length && !looksDated) {
        map[exKey] = { [todayKey()]: entry };
      }
    });
    return map;
  }

  let logMap = loadMap(LOG_KEY);
  let notesMap = loadMap(NOTES_KEY);
  // One shared version check for BOTH migrations below — checked once,
  // both run together, flag set once at the end. Setting the flag after
  // the first migration and checking it again before the second would
  // make the second one see "already migrated" and silently skip.
  if (localStorage.getItem(SCHEMA_KEY) !== String(SCHEMA_VERSION)) {
    logMap = migrateLogMapToDated(logMap);
    saveMap(LOG_KEY, logMap);
    notesMap = migrateNotesMapToDated(notesMap);
    saveMap(NOTES_KEY, notesMap);
    try { localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION)); } catch (e) {}
  }

  // Same migration shape as logMap above, for the same reason: notesMap
  // used to be one flat string per exercise that persisted forever with
  // no date context, so a note like "drop 2.5kg next time" could silently
  // mislead weeks later after a deload or exercise swap. A pre-existing
  // flat string gets wrapped under today's date (the best available guess
  // — the original write date isn't recoverable) so it isn't lost, and
  // immediately shows up as "last note" context rather than sitting in the
  // now-empty live textarea pretending to be current.
  function migrateNotesMapToDated(map) {
    Object.keys(map).forEach(exKey => {
      const entry = map[exKey];
      if (typeof entry === 'string') {
        map[exKey] = entry ? { [todayKey()]: entry } : {};
      } else if (!entry || typeof entry !== 'object') {
        map[exKey] = {};
      }
    });
    return map;
  }
  // Finds the most recent dated note strictly before `beforeKey` — mirrors
  // findPriorSetEntry's role for logMap, so "last note" and "last session"
  // agree on what "prior" means.
  function findPriorNote(exKey, beforeKey) {
    const history = notesMap[exKey];
    if (!history) return null;
    const priorDates = Object.keys(history).filter(d => d < beforeKey).sort();
    if (!priorDates.length) return null;
    const date = priorDates[priorDates.length - 1];
    return { date: date, text: history[date] };
  }
  function renderLastNote(exKey) {
    const el = document.getElementById('lastNote-' + exKey);
    if (!el) return;
    const prior = findPriorNote(exKey, todayKey());
    el.textContent = prior ? ('Last note (' + prior.date + '): ' + prior.text) : '';
  }

  function initExerciseEnhancements() {
    document.querySelectorAll('.exercise-card').forEach(card => {
      const exKey = card.getAttribute('data-exercise');
      if (!exKey) return;

      const info = card.querySelector('.exercise-info');
      if (info && !info.querySelector('.last-log')) {
        const lastEl = document.createElement('div');
        lastEl.className = 'last-log';
        lastEl.id = 'lastLog-' + exKey;
        info.appendChild(lastEl);
      }

      const bodyInner = card.querySelector('.exercise-body-inner');
      if (bodyInner && !bodyInner.querySelector('.set-log-panel')) {
        const setCount = card.querySelectorAll('.set-tracker .set-dot').length;

        // "Last session" — read-only, reuses .last-log's type styling,
        // always rendered (not conditionally hidden) since it's already
        // scoped to the expanded body: it's only ever on-screen when the
        // card itself is expanded.
        const lastSessionEl = document.createElement('div');
        lastSessionEl.className = 'last-log last-session';
        lastSessionEl.id = 'lastSession-' + exKey;
        bodyInner.appendChild(lastSessionEl);

        // Estimated 1RM (Epley) from the most recent logged set — off by
        // default in the sense that it only appears once there's real
        // weight+reps data to compute from (.last-log:empty stays hidden).
        const est1rmEl = document.createElement('div');
        est1rmEl.className = 'last-log est-1rm';
        est1rmEl.id = 'est1rm-' + exKey;
        bodyInner.appendChild(est1rmEl);

        // Load trend — last up-to-8 sessions' best estimated 1RM per date,
        // as a tiny bar sparkline (mirrors the weekly history sparkline's
        // set-count bars, just for load instead of volume).
        const loadSparkEl = document.createElement('div');
        loadSparkEl.className = 'load-sparkline';
        loadSparkEl.id = 'loadSpark-' + exKey;
        bodyInner.appendChild(loadSparkEl);

        const panel = document.createElement('div');
        panel.className = 'set-log-panel';
        let rowsHtml = '';
        for (let i = 1; i <= setCount; i++) {
          rowsHtml += '<div class="set-log-row">Set ' + i + ':'
            + ' <input type="number" step="any" inputmode="decimal" class="log-input log-weight" placeholder="kg" data-set="' + i + '">'
            + ' <input type="number" inputmode="numeric" class="log-input log-reps" placeholder="reps" data-set="' + i + '">'
            + ' <input type="number" inputmode="numeric" class="log-input log-rir" placeholder="RIR" data-set="' + i + '">'
            + ' <span class="delta-badge"></span></div>';
        }
        panel.innerHTML = '<h4>Session Log</h4><div class="set-log-rows">' + rowsHtml + '</div>'
          + '<button type="button" class="warmup-toggle-btn" onclick="toggleWarmupCalc(\'' + exKey + '\')">Warmup %</button>'
          + '<div class="warmup-calc" id="warmupCalc-' + exKey + '"></div>'
          + '<div class="last-log last-note" id="lastNote-' + exKey + '"></div>'
          + '<textarea class="exercise-notes" placeholder="Notes — e.g. elbows flared on set 2, drop 2.5kg next time"></textarea>';
        bodyInner.appendChild(panel);

        panel.querySelectorAll('.log-input').forEach(inp => {
          inp.addEventListener('click', e => e.stopPropagation());
          inp.addEventListener('change', () => saveSetLog(exKey, card));
          // First keystroke on an auto-filled suggestion "confirms" it —
          // drop the dashed/muted styling so it reads as a real entry.
          inp.addEventListener('input', () => inp.classList.remove('log-input-suggested'), { once: true });
        });
        const notesEl = panel.querySelector('.exercise-notes');
        notesEl.addEventListener('click', e => e.stopPropagation());
        // Notes are now dated (today's entry only) rather than one flat
        // string that persists forever — see migrateNotesMapToDated's
        // comment for why. An empty save deletes today's key entirely
        // rather than storing an empty string, so a cleared note doesn't
        // linger as a phantom dated entry.
        notesEl.addEventListener('input', debounce(() => {
          const tKey = todayKey();
          if (!notesMap[exKey]) notesMap[exKey] = {};
          if (notesEl.value) notesMap[exKey][tKey] = notesEl.value;
          else delete notesMap[exKey][tKey];
          saveMap(NOTES_KEY, notesMap);
          renderLastNote(exKey);
        }, 400));
      }

      if (bodyInner && !bodyInner.querySelector('.next-up-teaser')) {
        const teaser = document.createElement('div');
        teaser.className = 'next-up-teaser';
        teaser.id = 'nextUp-' + exKey;
        bodyInner.appendChild(teaser);
      }

      applyStoredLogAndNotes(card, exKey);
    });
  }

  // Reads the RIR meta-pill ("0-1", "2", "FAILURE") and returns the loosest
  // (highest) RIR that's still within the prescribed range — used to flag
  // when a logged set was easier than the exercise called for.
  function getTargetRIRMax(card) {
    const pills = card.querySelectorAll('.exercise-meta .meta-pill');
    for (const pill of pills) {
      const label = pill.querySelector('.label');
      if (label && label.textContent.trim().toUpperCase() === 'RIR') {
        const raw = (pill.querySelector('.value') || {}).textContent || '';
        if (/FAILURE/i.test(raw)) return 0;
        const nums = raw.match(/\d+(\.\d+)?/g);
        if (!nums) return null;
        return Math.max(...nums.map(Number));
      }
    }
    return null;
  }
  function applyRIRFlags(card, exKey) {
    const targetMax = getTargetRIRMax(card);
    if (targetMax === null) return;
    card.querySelectorAll('.set-log-row').forEach(row => {
      const rirVal = parseFloat(row.querySelector('.log-rir').value);
      row.classList.toggle('rir-easy', !isNaN(rirVal) && rirVal > targetMax);
    });
  }

  // Commits just ONE set's row to today's log — used when a set is marked
  // done via its dot. Deliberately narrower than saveSetLog() (which
  // rebuilds every row in the card): calling saveSetLog() here would also
  // persist whatever's sitting in OTHER sets' still-unconfirmed
  // auto-filled suggestions the moment any one set in the card is marked
  // done, fabricating logged entries for sets that haven't actually been
  // performed yet. This only ever touches the row for the set that was
  // just marked done.
  function commitSetLogRow(exKey, card, setIdx) {
    const weightEl = card.querySelector('.log-weight[data-set="' + setIdx + '"]');
    if (!weightEl) return;
    const row = weightEl.closest('.set-log-row');
    if (!row) return;
    const w = row.querySelector('.log-weight').value;
    const r = row.querySelector('.log-reps').value;
    const rir = row.querySelector('.log-rir').value;
    if (!w && !r && !rir) return; // nothing entered/suggested for this set — nothing to commit
    // Snapshot BEFORE mutating, same as saveSetLog's PR-detection wrapper
    // does — checkForPRs excludes whatever's being saved right now from
    // "all previous historical entries" it compares against.
    const priorHistory = logMap[exKey] ? JSON.parse(JSON.stringify(logMap[exKey])) : {};
    if (!logMap[exKey]) logMap[exKey] = {};
    const tKey = todayKey();
    if (!logMap[exKey][tKey]) logMap[exKey][tKey] = {};
    logMap[exKey][tKey][setIdx] = { w, r, rir };
    saveMap(LOG_KEY, logMap);
    row.querySelectorAll('.log-input-suggested').forEach(el => el.classList.remove('log-input-suggested'));
    renderLastLog(exKey);
    renderLastSession(exKey);
    renderEst1RM(exKey);
    renderLoadSparkline(exKey);
    applyRIRFlags(card, exKey);
    renderAllDeltaBadges(card, exKey);
    // PR detection is wired onto saveSetLog via monkey-patch (see the
    // MONKEY-PATCH CHAIN note further down) — this path bypasses
    // saveSetLog entirely by design (see the comment above this
    // function), so it has to call checkForPRs directly or a set marked
    // done via its dot would silently never trigger a PR badge.
    if (typeof checkForPRs === 'function') checkForPRs(exKey, card, priorHistory);
  }

  // ⚠ MONKEY-PATCH CHAIN: also extended later (PR-detection script block,
  // right after this one) — see the "MONKEY-PATCH CHAIN" comment there.
  function saveSetLog(exKey, card) {
    const rows = {};
    card.querySelectorAll('.set-log-row').forEach(row => {
      const w = row.querySelector('.log-weight').value;
      const r = row.querySelector('.log-reps').value;
      const rir = row.querySelector('.log-rir').value;
      const setIdx = row.querySelector('.log-weight').getAttribute('data-set');
      if (w || r || rir) rows[setIdx] = { w, r, rir };
    });
    if (!logMap[exKey]) logMap[exKey] = {};
    const tKey = todayKey();
    if (Object.keys(rows).length) logMap[exKey][tKey] = rows;
    else delete logMap[exKey][tKey]; // every input cleared for today — drop today's entry
    saveMap(LOG_KEY, logMap);
    renderLastLog(exKey);
    renderLastSession(exKey);
    renderEst1RM(exKey);
    renderLoadSparkline(exKey);
    applyRIRFlags(card, exKey);
    renderAllDeltaBadges(card, exKey);
  }

  // Epley formula — chosen over Brzycki because Brzycki breaks down (and
  // eventually divides by a near-zero/negative number) above ~10-12 reps,
  // which this program's failure sets regularly exceed.
  function estimate1RM(w, r) {
    const weight = parseFloat(w), reps = parseFloat(r);
    if (!weight || !reps || reps <= 0) return null;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  }
  function renderEst1RM(exKey) {
    const el = document.getElementById('est1rm-' + exKey);
    if (!el) return;
    const history = logMap[exKey];
    if (!history) { el.textContent = ''; return; }
    const tKey = todayKey();
    const dates = Object.keys(history).sort();
    const useDate = history[tKey] ? tKey : dates.filter(d => d < tKey).pop();
    if (!useDate) { el.textContent = ''; return; }
    let best = null;
    Object.values(history[useDate]).forEach(s => {
      const est = estimate1RM(s.w, s.r);
      if (est && (!best || est > best)) best = est;
    });
    el.textContent = best ? 'Est. 1RM: ~' + (Math.round(best * 10) / 10) + 'kg' : '';
  }

  function renderLoadSparkline(exKey) {
    const el = document.getElementById('loadSpark-' + exKey);
    if (!el) return;
    const history = logMap[exKey];
    el.innerHTML = '';
    if (!history) return;
    const dates = Object.keys(history).sort().slice(-8);
    if (dates.length < 2) return; // not enough data points for a trend to mean anything
    const points = dates.map(d => {
      let best = null;
      Object.values(history[d]).forEach(s => {
        const est = estimate1RM(s.w, s.r);
        if (est && (!best || est > best)) best = est;
      });
      return { d, est: best };
    });
    const max = Math.max(1, ...points.map(p => p.est || 0));
    points.forEach(p => {
      const bar = document.createElement('div');
      bar.className = 'ls-bar';
      bar.style.height = p.est ? Math.max(2, (p.est / max) * 22) + 'px' : '2px';
      bar.title = p.d + (p.est ? ': ~' + Math.round(p.est * 10) / 10 + 'kg e1RM' : ': no weight logged');
      el.appendChild(bar);
    });
  }

  function formatLogRow(row) {
    const parts = [];
    if (row.w) parts.push(row.w + 'kg');
    if (row.r) parts.push('× ' + row.r);
    if (row.rir !== '' && row.rir != null) parts.push('@ ' + row.rir + ' RIR');
    return parts.join(' ');
  }

  function renderLastLog(exKey) {
    const el = document.getElementById('lastLog-' + exKey);
    if (!el) return;
    const rows = logMap[exKey] && logMap[exKey][todayKey()];
    if (!rows) { el.textContent = ''; return; }
    const idxs = Object.keys(rows).map(Number).sort((a, b) => a - b);
    if (!idxs.length) { el.textContent = ''; return; }
    const formatted = formatLogRow(rows[idxs[idxs.length - 1]]);
    el.textContent = formatted ? 'Last: ' + formatted : '';
  }

  // Most recent date strictly before today that has data, then the
  // highest set index logged on that date. ISO YYYY-MM-DD strings sort
  // correctly with plain string comparison, so no Date parsing needed.
  function renderLastSession(exKey) {
    const el = document.getElementById('lastSession-' + exKey);
    if (!el) return;
    const history = logMap[exKey];
    const tKey = todayKey();
    let text = 'Last session: —';
    if (history) {
      const priorDates = Object.keys(history).filter(d => d < tKey).sort();
      const mostRecent = priorDates[priorDates.length - 1];
      if (mostRecent) {
        const rows = history[mostRecent];
        const idxs = Object.keys(rows).map(Number).sort((a, b) => a - b);
        if (idxs.length) {
          const formatted = formatLogRow(rows[idxs[idxs.length - 1]]);
          if (formatted) text = 'Last session: ' + formatted;
        }
      }
    }
    el.textContent = text;
  }

  // Finds the most recent dated entry strictly before `beforeKey` for this
  // exercise+set index. Shared by renderLastSession's text and the
  // auto-fill below so both agree on what "last session" means.
  function findPriorSetEntry(exKey, setIdx, beforeKey) {
    const history = logMap[exKey];
    if (!history) return null;
    const priorDates = Object.keys(history).filter(d => d < beforeKey).sort();
    for (let i = priorDates.length - 1; i >= 0; i--) {
      const entry = history[priorDates[i]] && history[priorDates[i]][setIdx];
      if (entry) return entry;
    }
    return null;
  }

  // The colored ▲/▼ pill next to each set-log row — the actual point of a
  // hypertrophy tracker being "tell me what to beat", instead of making
  // the user mentally diff two numbers from the small "Last session:" text.
  // Same up/down definition as isStrictlyGreater's PR check (weight up, or
  // same weight with more reps), but compared against last session
  // specifically rather than the full historical best.
  function renderDeltaBadge(row, exKey, setIdx) {
    let badge = row.querySelector('.delta-badge');
    if (!badge) return;
    const w = parseFloat(row.querySelector('.log-weight').value);
    const r = parseFloat(row.querySelector('.log-reps').value);
    const prior = findPriorSetEntry(exKey, setIdx, todayKey());
    const priorW = prior ? parseFloat(prior.w) : NaN;
    const priorR = prior ? parseFloat(prior.r) : NaN;
    badge.className = 'delta-badge';
    if (isNaN(w) || isNaN(r) || isNaN(priorW) || isNaN(priorR)) {
      badge.textContent = '';
      return;
    }
    if (w > priorW) {
      const diff = Math.round((w - priorW) * 10) / 10;
      badge.textContent = '▲ +' + diff + 'kg ready';
      badge.classList.add('delta-up');
    } else if (w === priorW && r > priorR) {
      const diff = r - priorR;
      badge.textContent = '▲ +' + diff + ' rep' + (diff > 1 ? 's' : '');
      badge.classList.add('delta-up');
    } else if (w === priorW && r === priorR) {
      badge.textContent = '— hold, rebuild reps';
      badge.classList.add('delta-flat');
    } else {
      badge.textContent = '▼ below last time';
      badge.classList.add('delta-down');
    }
  }
  function renderAllDeltaBadges(card, exKey) {
    card.querySelectorAll('.set-log-row').forEach(row => {
      const setIdx = row.querySelector('.log-weight').getAttribute('data-set');
      renderDeltaBadge(row, exKey, setIdx);
    });
  }

  function applyStoredLogAndNotes(card, exKey) {
    const tKey = todayKey();
    const dayRows = logMap[exKey] && logMap[exKey][tKey];
    card.querySelectorAll('.set-log-row').forEach(row => {
      const setIdx = row.querySelector('.log-weight').getAttribute('data-set');
      const wEl = row.querySelector('.log-weight'), rEl = row.querySelector('.log-reps'), rirEl = row.querySelector('.log-rir');
      const data = dayRows && dayRows[setIdx];
      if (data) {
        wEl.value = data.w || ''; rEl.value = data.r || ''; rirEl.value = data.rir || '';
        wEl.classList.remove('log-input-suggested'); rEl.classList.remove('log-input-suggested');
        // Re-render the persistent PR marker on load too, not just live at
        // the moment checkForPRs first detects it — otherwise switching
        // away from an exercise and back (or a page refresh within the
        // same day) would lose the marker even though the underlying
        // logged set is still, in fact, a PR.
        if (typeof setPersistentPRMarker === 'function') setPersistentPRMarker(row, !!data.pr);
      } else {
        // Nothing logged yet today for this set — pre-fill weight/reps from
        // the last time this exact set was logged, as a starting point to
        // beat. RIR is left blank; that's today's judgment call, not a
        // repeat of last time's. Dashed/muted styling marks it as a
        // suggestion until the user actually types into it.
        const prior = findPriorSetEntry(exKey, setIdx, tKey);
        wEl.value = prior && prior.w ? prior.w : '';
        rEl.value = prior && prior.r ? prior.r : '';
        rirEl.value = '';
        wEl.classList.toggle('log-input-suggested', !!(prior && prior.w));
        rEl.classList.toggle('log-input-suggested', !!(prior && prior.r));
        // No confirmed entry today — an unconfirmed suggestion is never a
        // recorded PR, so any leftover marker (e.g. from before the row
        // got cleared) shouldn't stick around.
        if (typeof setPersistentPRMarker === 'function') setPersistentPRMarker(row, false);
      }
    });
    const notesEl = card.querySelector('.exercise-notes');
    if (notesEl) {
      const tKey = todayKey();
      notesEl.value = (notesMap[exKey] && notesMap[exKey][tKey]) || '';
    }
    renderLastLog(exKey);
    renderLastSession(exKey);
    renderEst1RM(exKey);
    renderLoadSparkline(exKey);
    renderLastNote(exKey);
    applyRIRFlags(card, exKey);
    renderAllDeltaBadges(card, exKey);
  }

  // ===== VOLUME AUDIT: SCROLL-ANIMATED BARS + CLICK-TO-HIGHLIGHT =====
  function initVolumeInteractions() {
    document.querySelectorAll('.volume-fill').forEach(fill => {
      const match = (fill.getAttribute('style') || '').match(/scaleX\(([\d.]+)\)/);
      fill.setAttribute('data-target-scale', match ? match[1] : '0');
      fill.style.transform = 'scaleX(0)';
    });
    const volObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.volume-fill');
          if (fill) fill.style.transform = 'scaleX(' + fill.getAttribute('data-target-scale') + ')';
          volObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.volume-card').forEach(card => {
      volObserver.observe(card);
      card.addEventListener('click', () => highlightMuscleExercises(card));
    });

    // Deliberately NOT unobserved (unlike volObserver above) — re-fires
    // every time the section scrolls back into view, so the completed-set
    // counts stay current without costing anything on every single set
    // tap elsewhere in the app (this does a full multi-card scan, which is
    // exactly the kind of cost updateMasterTracker() was reworked earlier
    // to avoid paying on every tap).
    const volumeCompletionObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) renderAllVolumeCompletions();
    }, { threshold: 0.1 });
    const volumeGrid = document.querySelector('.volume-grid');
    if (volumeGrid) volumeCompletionObserver.observe(volumeGrid);
  }

  // Maps each volume-card's muscle name to the .muscle-tag class(es) that
  // count toward it — reuses the SAME muscle-tags highlightMuscleExercises
  // (above) already relies on, rather than a second, separately-authored
  // exercise-to-muscle mapping that could quietly drift out of sync with
  // it. tag-delt covers BOTH front and lateral delts in the markup (only
  // tag-reardelt is split out on its own), so those two need a text-content
  // check on top of the class match to tell them apart.
  const VOLUME_TAG_MAP = {
    'chest': { classes: ['tag-chest'] },
    'front delts': { classes: ['tag-delt'], textIncludes: 'front' },
    'lateral delts': { classes: ['tag-delt'], textIncludes: 'side' },
    'rear delts': { classes: ['tag-reardelt'] },
    'back': { classes: ['tag-lat', 'tag-midback'] },
    'biceps': { classes: ['tag-bicep'] },
    'triceps': { classes: ['tag-tri'] },
    'upper traps': { classes: ['tag-trap'] },
    'forearms': { classes: ['tag-forearm'] },
    'quads': { classes: ['tag-quad'] },
    'hamstrings': { classes: ['tag-ham'] },
    'glutes': { classes: ['tag-glute'] },
    'calves': { classes: ['tag-calf'] },
    'abs / core': { classes: ['tag-core'] }
  };
  function exerciseMatchesMuscle(card, rule) {
    return Array.from(card.querySelectorAll('.muscle-tag')).some(tag => {
      if (!rule.classes.some(c => tag.classList.contains(c))) return false;
      return rule.textIncludes ? tag.textContent.toLowerCase().includes(rule.textIncludes) : true;
    });
  }
  // Searches every exercise card across all 6 days (not just the visible
  // one) — unlike highlightMuscleExercises's scroll-to-match, which only
  // needs the active day, a weekly set count has to include every day the
  // muscle is trained on.
  function computeCompletedSetsForMuscle(muscleName) {
    const rule = VOLUME_TAG_MAP[muscleName.toLowerCase()];
    if (!rule) return null;
    let count = 0;
    document.querySelectorAll('.exercise-card').forEach(card => {
      if (exerciseMatchesMuscle(card, rule)) count += card.querySelectorAll('.set-tracker .set-dot.done').length;
    });
    return count;
  }
  // logMap is the only dated data source available (doneMap has no
  // timestamps at all) — day-granularity only, so this reports "today" /
  // "yesterday" / "N days ago" rather than an hour count, which isn't a
  // real precision this data model can honestly support.
  function computeLastTrainedDate(muscleName) {
    const rule = VOLUME_TAG_MAP[muscleName.toLowerCase()];
    if (!rule) return null;
    let latest = null;
    document.querySelectorAll('.exercise-card').forEach(card => {
      if (!exerciseMatchesMuscle(card, rule)) return;
      const history = logMap[card.getAttribute('data-exercise')];
      if (!history) return;
      Object.keys(history).forEach(date => { if (!latest || date > latest) latest = date; });
    });
    return latest;
  }
  function formatRecency(dateStr) {
    const today = todayKey();
    if (dateStr === today) return 'today';
    // Parsed at UTC midnight for both sides so the day-difference is a
    // clean integer regardless of DST — these are date-only strings with
    // no time-of-day component to begin with.
    const days = Math.round((new Date(today + 'T00:00:00Z') - new Date(dateStr + 'T00:00:00Z')) / 86400000);
    if (days === 1) return 'yesterday';
    if (days > 1) return days + ' days ago';
    return 'recently';
  }

  function renderAllVolumeCompletions() {
    document.querySelectorAll('.volume-card').forEach(vc => {
      const h4 = vc.querySelector('.volume-card-top h4');
      if (!h4) return;
      const muscleName = h4.childNodes[0].textContent.trim();
      const completed = computeCompletedSetsForMuscle(muscleName);
      if (completed === null) return;
      let badge = vc.querySelector('.volume-completed');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'volume-completed';
        const numberEl = vc.querySelector('.volume-number');
        if (numberEl) numberEl.insertAdjacentElement('afterend', badge);
        else vc.appendChild(badge);
      }
      // "so far" rather than a hard "this week" claim — doneMap only
      // resets when the reset button is pressed, not automatically on a
      // calendar boundary, so asserting a strict weekly period here would
      // overstate what the app actually guarantees.
      const lastTrained = computeLastTrainedDate(muscleName);
      badge.textContent = completed + ' logged so far'
        + (lastTrained ? ' · last trained ' + formatRecency(lastTrained) : '');
    });
  }

  // Heuristic match: takes the volume card's muscle name and pulses any
  // exercise card in the CURRENTLY VISIBLE day whose muscle-tag text overlaps
  // with it, then scrolls to the first match. Days are tabbed (only one
  // visible at a time) so cross-day highlighting isn't meaningful here.
  function highlightMuscleExercises(volumeCard) {
    document.querySelectorAll('.volume-card.pulse-highlight').forEach(c => c.classList.remove('pulse-highlight'));
    volumeCard.classList.add('pulse-highlight');
    const h4 = volumeCard.querySelector('h4');
    const muscleName = h4 ? h4.childNodes[0].textContent.trim().toLowerCase() : '';
    if (!muscleName) return;
    const activeDay = document.querySelector('.day-content.active');
    if (!activeDay) return;
    const matches = Array.from(activeDay.querySelectorAll('.exercise-card')).filter(card => {
      return Array.from(card.querySelectorAll('.muscle-tag')).some(tag =>
        tag.textContent.toLowerCase().includes(muscleName.split(' ')[0]) ||
        muscleName.includes(tag.textContent.toLowerCase().split(' ')[0])
      );
    });
    matches.forEach(card => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.boxShadow = 'var(--shadow-3), 0 0 40px -6px var(--accent-glow)';
      setTimeout(() => { card.style.boxShadow = ''; }, 1400);
    });
    if (matches[0]) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ===== SOURCES ACCORDION (collapse long study lists) =====
  function initSourcesAccordion() {
    document.querySelectorAll('.sources-group-panel').forEach(panel => {
      const cards = Array.from(panel.querySelectorAll('.source-card'));
      if (cards.length <= 4) return;
      cards.slice(3).forEach(c => c.classList.add('sources-hidden'));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sources-show-more';
      btn.textContent = 'Show ' + (cards.length - 3) + ' more studies';
      btn.onclick = () => {
        cards.slice(3).forEach(c => c.classList.remove('sources-hidden'));
        btn.remove();
      };
      panel.appendChild(btn);
    });
  }

  // ===== KIOSK / WORKOUT MODE =====
  // Distraction-free view: hides everything except the sticky mini-bar, the
  // active day's exercises (with the logger), and the floating rest timer.
  const KIOSK_SELECTORS = ['.top-nav', '.hero', '#tracker', '#protocol', '#standards', '#gauge', '#volume', '#anatomy', '#sources', '.site-footer', '.standards-fab'];
  let kioskActive = false;
  let kioskTimeout = null;
  let wakeLock = null;
  function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen')
      .then(lock => { wakeLock = lock; })
      .catch(() => { wakeLock = null; }); // e.g. low battery / permission denied — fail silently
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
  }
  // The OS revokes the lock itself on visibility loss, but it won't be
  // reacquired automatically — explicitly clearing our reference here keeps
  // state consistent so exitKioskMode() doesn't try to release a lock the
  // system already dropped.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseWakeLock();
  });

  function kioskElements() {
    return KIOSK_SELECTORS.map(sel => document.querySelector(sel)).filter(Boolean);
  }

  // Auto-collapses + dims a fully-logged exercise while in Kiosk Mode, so the
  // "next" unfinished card is always what's visually prominent. Dimming is
  // pure CSS (scoped to body.kiosk-mode) so this is harmless to call outside
  // kiosk mode too — it just won't be visible.
  function updateCardCompletionState(card, opts) {
    if (!card) return;
    opts = opts || {};
    const dots = card.querySelectorAll('.set-tracker .set-dot');
    const allDone = dots.length > 0 && Array.from(dots).every(d => d.classList.contains('done'));
    const wasComplete = card.classList.contains('exercise-complete');
    card.classList.toggle('kiosk-complete', allDone);
    // Visible in or out of kiosk mode — a small always-on "done" cue so
    // finishing an exercise gets some acknowledgement even outside kiosk mode.
    card.classList.toggle('exercise-complete', allDone);
    // Only announce a genuine not-done -> done transition from an actual
    // set tap — not the bulk { immediate: true } pass used when entering
    // kiosk mode, which would otherwise re-announce every already-finished
    // exercise the moment kiosk mode opens.
    if (allDone && !wasComplete && !opts.immediate) {
      const h3 = card.querySelector('.exercise-info h3');
      const live = document.getElementById('a11yLiveRegion');
      if (live) live.textContent = (h3 ? h3.textContent.trim() : 'Exercise') + ' complete.';
    }
    if (!kioskActive || !allDone) return;
    const collapse = () => {
      if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        const header = card.querySelector('.exercise-header');
        if (header) header.setAttribute('aria-expanded', 'false');
        setExerciseBodyHeight(card, false);
      }
    };
    if (opts.immediate) collapse(); else setTimeout(collapse, 450);
  }

  function toggleKioskMode() {
    if (kioskActive) exitKioskMode(); else enterKioskMode();
  }

  function enterKioskMode() {
    kioskActive = true;
    document.body.classList.add('kiosk-mode');
    requestWakeLock();
    clearTimeout(kioskTimeout);
    const els = kioskElements();
    els.forEach(el => {
      el.classList.add('kiosk-fade');
      el.classList.remove('kiosk-collapsed');
      void el.offsetWidth; // force reflow so the fade actually plays
      el.classList.add('kiosk-hidden-fade');
    });
    kioskTimeout = setTimeout(() => {
      els.forEach(el => el.classList.add('kiosk-collapsed'));
    }, 380);

    document.getElementById('sessionMinibar').classList.add('visible');
    updateKioskButtons();
    hideRestTimer();

    // Tunnel-vision cleanup: any exercise already fully logged before you
    // even hit "Start Workout" collapses and dims immediately, no delay.
    document.querySelectorAll('.exercise-card').forEach(card => updateCardCompletionState(card, { immediate: true }));

    const dayEl = document.getElementById(currentGroup + currentDay);
    if (dayEl) setTimeout(() => dayEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function exitKioskMode() {
    kioskActive = false;
    document.body.classList.remove('kiosk-mode');
    releaseWakeLock();
    clearTimeout(kioskTimeout);
    const els = kioskElements();
    els.forEach(el => {
      el.classList.remove('kiosk-collapsed');
      void el.offsetWidth;
      el.classList.remove('kiosk-hidden-fade');
    });
    // One-off layout read on mode exit only (not per scroll tick, so this is
    // cheap) — restores mini-bar visibility to match current scroll position,
    // since the IntersectionObserver above skips updates while kiosk was active.
    const hero = document.querySelector('.hero');
    const bar = document.getElementById('sessionMinibar');
    if (hero && bar) bar.classList.toggle('visible', hero.getBoundingClientRect().bottom < 120);
    updateKioskButtons();
  }

  function updateKioskButtons() {
    document.querySelectorAll('.minibar-kiosk-btn, .progress-kiosk-btn').forEach(btn => {
      btn.textContent = kioskActive ? 'Finish Workout' : 'Start Workout';
    });
  }

  function initKioskButtons() {
    document.querySelectorAll('.progress-bar-wrap').forEach(wrap => {
      if (wrap.querySelector('.progress-kiosk-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'progress-kiosk-btn';
      btn.textContent = 'Start Workout';
      btn.onclick = toggleKioskMode;
      wrap.appendChild(btn);
    });
  }

  // ===== INIT =====
  if (!restoreFromHash()) {
    switchGroup('legs');
  }
  applyStoredCompletion();
  initExerciseEnhancements();
  initVolumeInteractions();
  initSourcesAccordion();
  initKioskButtons();
  initAutoRestToggle();
  updateAudioBtn();
  applyHighContrast();
  renderMesocycleBanner();
  updateActiveDayIndicator();
  updateSessionMinibar();

  window.addEventListener('hashchange', restoreFromHash);

  // ===== KIOSK-MODE SWIPE NAVIGATION (Day A <-> Day B) =====
  // Gated on document.body's kiosk-mode class rather than adding/removing
  // listeners on enter/exit — one always-on listener, checked cheaply.
  // Useful when the phone's on the floor mid-set and reaching the top
  // toggle isn't practical.
  (function initKioskSwipe() {
    let touchStartX = 0, touchStartY = 0, touchActive = false;
    document.addEventListener('touchstart', e => {
      if (!document.body.classList.contains('kiosk-mode')) return;
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchActive = true;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (!touchActive) return;
      touchActive = false;
      if (!document.body.classList.contains('kiosk-mode')) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      // Require a clearly horizontal, deliberate swipe — steep or short
      // gestures are left alone so normal scrolling isn't hijacked.
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) switchDay('B'); else switchDay('A');
    }, { passive: true });
  })();

  // ===== SERVICE WORKER REGISTRATION (offline PWA support) =====
  // Requires being served over https:// (or http://localhost) — service
  // workers cannot register on a page opened directly via file://.
  // Service worker registration removed during the Next.js port; returns with the PWA step.


;
(function() {
  // ⚠ MONKEY-PATCH CHAIN (PR detection): this IIFE reassigns saveSetLog
  // (originally defined earlier in the file) to add a PR-detection step
  // around it, rather than editing that function directly. This works
  // correctly today, but it's fragile in a way worth knowing about:
  //   - It's order-dependent: this script block must run AFTER saveSetLog's
  //     original definition, or `originalSaveSetLog` captures `undefined`.
  //   - A typo'd reassignment (e.g. a stray `const` before `saveSetLog =`)
  //     would silently create a new local variable instead of patching the
  //     global one — no error, the patch just quietly doesn't apply.
  //   - Any NEW code path that mutates logMap without calling saveSetLog
  //     (see commitSetLogRow, used by toggleSet) has to know to call
  //     checkForPRs itself, or PR detection silently doesn't fire for it —
  //     this already happened once (commitSetLogRow originally didn't).
  // Left as-is rather than restructured into an event/pub-sub system,
  // since that would mean touching saveSetLog/toggleSet's core logic again
  // for a maintainability improvement with no functional bug behind it —
  // this comment (and the matching ones above the 4 original functions
  // this file wraps this way) is the safer fix: make the dependency
  // impossible to miss on either end, instead of restructuring how it works.
  const originalSaveSetLog = saveSetLog;

  saveSetLog = function(exKey, card) {
    // Snapshot history BEFORE this save mutates logMap, so "all previous
    // historical entries" excludes the set(s) being saved right now.
    const priorHistory = logMap[exKey]
      ? JSON.parse(JSON.stringify(logMap[exKey]))
      : {};
    originalSaveSetLog(exKey, card);
    checkForPRs(exKey, card, priorHistory);
  };

  function flattenHistoricalSets(history) {
    const sets = [];
    Object.keys(history || {}).forEach(dateKey => {
      const dayRows = history[dateKey];
      Object.keys(dayRows || {}).forEach(setIdx => {
        const entry = dayRows[setIdx];
        const w = parseFloat(entry && entry.w);
        const r = parseFloat(entry && entry.r);
        if (!isNaN(w) && !isNaN(r)) sets.push({ w, r });
      });
    });
    return sets;
  }

  // Strictly greater = higher weight, OR same weight with higher reps.
  function isStrictlyGreater(newSet, oldSet) {
    return newSet.w > oldSet.w || (newSet.w === oldSet.w && newSet.r > oldSet.r);
  }

  function showPRBadge(row) {
    row.querySelectorAll('.pr-badge').forEach(b => b.remove());
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    const live = document.getElementById('a11yLiveRegion');
    if (live) live.textContent = 'Personal record.';
    const badge = document.createElement('span');
    badge.className = 'pr-badge';
    badge.textContent = '\uD83C\uDFC6 PR';
    badge.style.cssText = 'margin-left:8px;padding:2px 8px;border-radius:999px;'
      + 'background:var(--gold);color:#1a1400;font-weight:700;font-size:11px;'
      + 'display:inline-block;opacity:1;transition:opacity 0.6s ease;';
    row.appendChild(badge);
    setTimeout(() => {
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 650);
    }, 3000);
  }

  function clearPRBadge(row) {
    row.querySelectorAll('.pr-badge').forEach(b => b.remove());
  }

  // Small lasting marker, separate from showPRBadge's flashy 3.65s-then-gone
  // celebration — without this, once that badge faded there was no trace
  // left that a set was a PR; the user had to remember or re-derive it.
  // A real DOM element with real text (not CSS ::after content, which
  // screen readers expose inconsistently) so it's genuinely accessible,
  // not just visually present.
  function setPersistentPRMarker(row, isPR) {
    let marker = row.querySelector('.pr-persistent-badge');
    if (isPR) {
      if (!marker) {
        marker = document.createElement('span');
        marker.className = 'pr-persistent-badge';
        marker.setAttribute('aria-label', 'Personal record');
        marker.textContent = 'PR';
        row.appendChild(marker);
      }
    } else if (marker) {
      marker.remove();
    }
  }

  function checkForPRs(exKey, card, priorHistory) {
    const tKey = todayKey();
    const todayRows = logMap[exKey] && logMap[exKey][tKey];
    if (!todayRows) return;

    const historicalSets = flattenHistoricalSets(priorHistory);
    if (!historicalSets.length) return; // nothing to compare against yet

    let anyChanged = false;
    card.querySelectorAll('.set-log-row').forEach(row => {
      const weightInput = row.querySelector('.log-weight');
      if (!weightInput) return;
      const setIdx = weightInput.getAttribute('data-set');
      const entry = todayRows[setIdx];
      if (!entry) { clearPRBadge(row); setPersistentPRMarker(row, false); return; }

      const w = parseFloat(entry.w);
      const r = parseFloat(entry.r);
      if (isNaN(w) || isNaN(r)) { clearPRBadge(row); setPersistentPRMarker(row, false); return; }

      const newSet = { w, r };
      const isPR = historicalSets.every(oldSet => isStrictlyGreater(newSet, oldSet));

      if (isPR) showPRBadge(row); else clearPRBadge(row);
      setPersistentPRMarker(row, isPR);
      if (!!entry.pr !== isPR) { entry.pr = isPR; anyChanged = true; }
    });
    // Persist the pr flags too — cheap even with the debounce active
    // (marks dirty and reschedules, doesn't force an extra write), and
    // makes correctness here not depend on reasoning about exactly when
    // the debounced flush from saveSetLog's own save fires relative to
    // this running.
    if (anyChanged) saveMap(LOG_KEY, logMap);
  }
})();

;
(function() {
  // ⚠ MONKEY-PATCH CHAIN (session timer): this IIFE reassigns toggleSet,
  // resetDay, and updateSessionMinibar (all originally defined earlier in
  // the file) to hook the session stopwatch into them, rather than editing
  // those functions directly. Same fragility profile as the PR-detection
  // block above this one: order-dependent (must run after all three
  // originals are defined), and a typo'd reassignment fails silently
  // rather than throwing. See that block's comment for the full reasoning
  // on why this is documented rather than restructured.
  // Persisted per the site owner's explicit call: this trains in a gym
  // where a dropped connection or accidental tab refresh mid-session is a
  // real risk, and losing elapsed time to that is worse than the modest
  // localStorage write cost. Reverses the prior "in-memory only, per 'do
  // not change the database'" constraint — see below for the staleness
  // guard that keeps a forgotten timer from yesterday showing an absurd
  // elapsed time today.
  const SESSION_TIMER_KEY = 'hb_sessionTimerStarts_v1';
  const SESSION_TIMER_STALE_MS = 6 * 60 * 60 * 1000; // 6h — generous for any real session, short enough to catch "forgot to reset yesterday"
  function loadSessionTimerStarts() {
    try {
      const raw = JSON.parse(localStorage.getItem(SESSION_TIMER_KEY) || '{}');
      const now = Date.now();
      const clean = {};
      Object.keys(raw).forEach(dayId => {
        const ts = raw[dayId];
        if (typeof ts === 'number' && (now - ts) < SESSION_TIMER_STALE_MS) clean[dayId] = ts;
      });
      return clean;
    } catch (e) { return {}; }
  }
  function saveSessionTimerStarts() {
    try { localStorage.setItem(SESSION_TIMER_KEY, JSON.stringify(sessionTimerStarts)); }
    catch (e) { handleStorageWriteError(e); }
  }
  const sessionTimerStarts = loadSessionTimerStarts(); // dayId -> start timestamp (ms)
  let sessionTimerInterval = null;

  function pad2(n) { return String(n).padStart(2, '0'); }

  function formatTimer(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return pad2(m) + ':' + pad2(s);
  }

  // Injected at runtime next to the existing progress text, same pattern
  // the app already uses for .last-log / .set-log-panel — no static HTML touched.
  function ensureSessionTimerEl() {
    let el = document.getElementById('mbSessionTimer');
    if (!el) {
      const progressEl = document.getElementById('mbProgress');
      const bar = document.getElementById('sessionMinibar');
      el = document.createElement('span');
      el.id = 'mbSessionTimer';
      el.style.cssText = 'color: var(--accent-bright); font-family: var(--font-mono); font-weight: 700; margin-left: 8px;';
      el.textContent = '00:00';
      if (progressEl && progressEl.parentNode) {
        progressEl.parentNode.insertBefore(el, progressEl.nextSibling);
      } else if (bar) {
        bar.appendChild(el);
      }
    }
    return el;
  }

  function refreshSessionTimerDisplay() {
    const el = ensureSessionTimerEl();
    const dayId = currentGroup + currentDay;
    const start = sessionTimerStarts[dayId];
    el.textContent = start ? formatTimer(Date.now() - start) : '00:00';
  }

  function ensureSessionTimerInterval() {
    if (!sessionTimerInterval) {
      sessionTimerInterval = setInterval(refreshSessionTimerDisplay, 1000);
    }
  }

  // ----- Start counting the moment the very first set-dot of a day is marked done -----
  const originalToggleSet = toggleSet;
  toggleSet = function(dot) {
    const dayEl = dot.closest('.day-content');
    const dayId = dayEl ? dayEl.id : null;
    const wasAlreadyRunning = dayId ? !!sessionTimerStarts[dayId] : true;

    originalToggleSet(dot);

    if (dayId && !wasAlreadyRunning) {
      const doneNow = dayEl.querySelectorAll('.set-dot.done').length;
      if (doneNow > 0) {
        sessionTimerStarts[dayId] = Date.now();
        saveSessionTimerStarts();
        ensureSessionTimerInterval();
      }
    }
    refreshSessionTimerDisplay();
  };

  // ----- Clear/reset the timer when the user resets the day -----
  const originalResetDay = resetDay;
  resetDay = function(dayId) {
    originalResetDay(dayId);
    delete sessionTimerStarts[dayId];
    saveSessionTimerStarts();
    refreshSessionTimerDisplay();
  };

  // ----- "Reset Entire Week" clears every day's timer, not just one -----
  const originalResetAllProgress = resetAllProgress;
  resetAllProgress = function() {
    originalResetAllProgress();
    Object.keys(sessionTimerStarts).forEach(k => delete sessionTimerStarts[k]);
    saveSessionTimerStarts();
    refreshSessionTimerDisplay();
  };

  // ----- Resume a still-fresh timer across a reload/reconnect -----
  if (Object.keys(sessionTimerStarts).length) ensureSessionTimerInterval();
  refreshSessionTimerDisplay();

  // ----- Keep the timer in sync whenever the visible day/group changes -----
  const originalUpdateSessionMinibar = updateSessionMinibar;
  updateSessionMinibar = function() {
    originalUpdateSessionMinibar();
    refreshSessionTimerDisplay();
  };

  function initSessionTimerUI() {
    ensureSessionTimerEl();
    refreshSessionTimerDisplay();
  }

  if (document.readyState === 'loading') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSessionTimerUI); else initSessionTimerUI();
  } else {
    initSessionTimerUI();
  }
})();
