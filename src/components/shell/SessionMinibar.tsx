/**
 * The sticky session bar: the shown day's name and progress, the rest
 * countdown, and the voice / high-contrast / tempo / Workout Mode buttons.
 *
 * Markup only, for now: public/legacy/protocol.js fills it in, shows it once
 * the hero scrolls away, and handles its buttons (the data-legacy-onclick
 * attributes become real handlers when it boots), until the training core
 * moves to React (Phase 3c).
 */
export function SessionMinibar() {
  return (
    <div className="session-minibar" id="sessionMinibar">
      <span className="mb-day" id="mbDay">
        Leg Day A
      </span>{' '}
      <span className="mb-progress" id="mbProgress">
        0/21 sets
      </span>
      <div className="mb-progress-ring" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle className="mb-ring-track" cx="15" cy="15" r="12" />
          <circle className="mb-ring-fill" id="mbRingFill" cx="15" cy="15" r="12" strokeDasharray="75.4" strokeDashoffset="75.4" />
        </svg>
        <span className="mb-ring-text" id="mbRingText">
          0%
        </span>
      </div>
      <span className="mb-rest" id="mbRest" />
      <button
        type="button"
        className="mb-audio-btn"
        id="mbAudioBtn"
        data-legacy-onclick="toggleAudioAnnouncements()"
        aria-label="Toggle rest-timer voice announcements"
        title="Rest-timer voice announcements"
        aria-pressed="true"
      >
        <svg id="mbAudioIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>
      <button
        type="button"
        className="mb-audio-btn"
        id="mbHighContrastBtn"
        data-legacy-onclick="toggleHighContrast()"
        aria-label="Toggle high contrast gym mode"
        title="High contrast gym mode"
        aria-pressed="false"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <button
        type="button"
        className="mb-audio-btn"
        id="mbTempoBtn"
        data-legacy-onclick="toggleTempoPacer()"
        aria-label="Toggle tempo pacer (3 second lower, 1 second stretch hold, explosive up)"
        title="Tempo pacer: 3-1-X"
        aria-pressed="false"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      <button type="button" className="minibar-kiosk-btn" id="kioskMinibarBtn" data-legacy-onclick="toggleKioskMode()">
        Start Workout
      </button>
    </div>
  );
}
