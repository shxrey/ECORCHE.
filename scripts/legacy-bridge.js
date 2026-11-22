
;
// ===== CLOUD SYNC BRIDGE =====
// Appended by scripts/extract-legacy.mjs (source: scripts/legacy-bridge.js).
// Gives the React sync engine (src/lib/sync) a small, explicit window into the
// original app, without touching any of its logic:
//   readState()    a copy of every map + preference the app persists
//   applyState(s)  replace them and re-render, the same way "Import Backup" does
//   'legacy:change'  fired after any save, so the engine knows to sync
(function () {
  var applying = false;
  function notify() {
    if (!applying) window.dispatchEvent(new Event('legacy:change'));
  }
  function thenNotify(fn) {
    return function () {
      var result = fn.apply(this, arguments);
      notify();
      return result;
    };
  }
  // Every write the app makes goes through one of these. Reassigning the
  // global binding is the same monkey-patch pattern the app itself uses.
  saveUnifiedState = thenNotify(saveUnifiedState);
  saveAutoRest = thenNotify(saveAutoRest);
  saveAudioEnabled = thenNotify(saveAudioEnabled);
  saveHighContrast = thenNotify(saveHighContrast);
  saveMesocycleWeek = thenNotify(saveMesocycleWeek);

  window.__legacyBridge = {
    readState: function () {
      return JSON.parse(JSON.stringify({
        doneMap: doneMap,
        logMap: logMap,
        notesMap: notesMap,
        sessionsMap: sessionsMap,
        prefs: {
          autoRest: autoRestEnabled,
          audio: audioEnabled,
          highContrast: highContrastEnabled,
          mesocycleWeek: mesocycleWeek
        }
      }));
    },
    applyState: function (s) {
      applying = true;
      try {
        doneMap = s.doneMap;
        logMap = s.logMap;
        notesMap = s.notesMap;
        sessionsMap = s.sessionsMap;
        saveUnifiedState();
        flushUnifiedState();

        var p = s.prefs;
        if (p) {
          autoRestEnabled = !!p.autoRest;
          saveAutoRest(autoRestEnabled);
          var toggle = document.getElementById('autoRestToggle');
          if (toggle) toggle.checked = autoRestEnabled;

          audioEnabled = !!p.audio;
          saveAudioEnabled(audioEnabled);
          updateAudioBtn();

          highContrastEnabled = !!p.highContrast;
          saveHighContrast(highContrastEnabled);
          applyHighContrast();

          mesocycleWeek = p.mesocycleWeek;
          saveMesocycleWeek(mesocycleWeek);
          renderMesocycleBanner();
        }

        // Same refresh sequence importProgress() uses after a restore.
        document.querySelectorAll('.set-dot.done').forEach(function (d) {
          d.classList.remove('done');
          updateSetDotAria(d);
        });
        applyStoredCompletion();
        initExerciseEnhancements();
        renderHistory();
      } finally {
        applying = false;
      }
    }
  };
  window.dispatchEvent(new Event('legacy:ready'));
})();
