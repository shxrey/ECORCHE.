'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { answerConfirm, dismissToast, useAnnouncement, useConfirmation, useToasts } from './feedback';

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: '0',
} as const;

const CloseIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/**
 * Everything that floats over the page, in the original order: rest timer,
 * tempo pacer, toasts, the screen-reader announcer, the "?" quick reference,
 * session history and the "Are you sure?" dialog.
 *
 * Rebuilt training core (/preview). The rest timer and tempo pacer (Phase 3c)
 * and session history (3d) are still their markup only.
 */
export function Overlays() {
  const toasts = useToasts();
  const announcement = useAnnouncement();
  const confirmation = useConfirmation();
  const [helpOpen, setHelpOpen] = useState(false);

  // Escape closes whichever dialog is open; for "Are you sure?" that means no.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.getElementById('mobileDrawer')?.classList.contains('open')) return; // the menu closes itself
      setHelpOpen(false);
      answerConfirm(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /** Closes a dialog when its dimmed backdrop (not the box) is clicked. */
  const onBackdrop = (close: () => void) => (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      <div className="rest-timer" id="restTimer">
        <div>
          <div className="rt-time" id="rtTime">
            1:30
          </div>
          <div className="rt-label">Rest</div>
        </div>
        <button className="rt-btn" aria-label="Subtract 15 seconds">
          −15
        </button>
        <button className="rt-btn" aria-label="Add 15 seconds">
          +15
        </button>
        <button className="rt-close" aria-label="Dismiss timer">
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="rest-timer tempo-pacer" id="tempoPacer">
        <div>
          <div className="rt-time" id="tpPhaseLabel">
            Lower
          </div>
          <div className="rt-label" id="tpPhaseSeconds">
            3s
          </div>
        </div>
        <button className="rt-close" aria-label="Stop tempo pacer">
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="toast-stack" id="toastStack">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <span>{toast.message}</span>
            {toast.undo ? (
              <button
                onClick={() => {
                  dismissToast(toast.id);
                  toast.undo!();
                }}
              >
                Undo
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {/* Milestones only (an exercise completed, a PR), not every tap. */}
      <div id="a11yLiveRegion" aria-live="polite" role="status" style={VISUALLY_HIDDEN}>
        {announcement}
      </div>

      <button className="standards-fab" id="standardsFab" onClick={() => setHelpOpen(true)} aria-label="Quick reference: rest, RIR and deload standards">
        ?
      </button>

      <div
        className={helpOpen ? 'app-modal-overlay open' : 'app-modal-overlay'}
        id="standardsModalOverlay"
        role="dialog"
        aria-modal="true"
        aria-label="Programming standards quick reference"
        onClick={onBackdrop(() => setHelpOpen(false))}
      >
        <div className="app-modal">
          <button className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Close">
            <CloseIcon size={16} />
          </button>
          <h3>Quick Reference</h3>
          <div className="modal-standard-row">
            <h4>Rest Periods</h4>
            <p>
              Heavy compounds &amp; singles: <strong style={{ color: 'var(--ink)' }}>2–3 min</strong>. Standard isolation: <strong style={{ color: 'var(--ink)' }}>60–90 sec</strong>. Superset pairs: <strong style={{ color: 'var(--ink)' }}>15–20 sec</strong> between A→B, then 90 sec after the pair.
            </p>
          </div>
          <div className="modal-standard-row">
            <h4>RIR (Reps in Reserve)</h4>
            <p>0-1 RIR = pushing right up to the wall. 1-2 RIR = one clean rep left in the tank. FAILURE = absolute, 0 RIR, technical form breaks next rep.</p>
          </div>
          <div className="modal-standard-row">
            <h4>Double Progression</h4>
            <p>Hit the top of the rep range at your target RIR on every set → add weight next session. Fall below the bottom of the range → hold the load and rebuild reps first.</p>
          </div>
          <div className="modal-standard-row">
            <h4>Deload — Every 6th Week</h4>
            <p>Cut volume ~60% (drop 1-2 sets/exercise), stay 3+ RIR, skip all FAILURE/PEAK sets.</p>
          </div>
          <a
            href="#standards"
            onClick={() => setHelpOpen(false)}
            style={{ display: 'inline-block', marginTop: '8px', color: 'var(--accent-bright)', fontSize: '13px', fontWeight: '600' }}
          >
            Jump to full Standards section →
          </a>
        </div>
      </div>

      <div className="app-modal-overlay" id="historyModalOverlay" role="dialog" aria-modal="true" aria-label="Session history">
        <div className="app-modal">
          <button className="modal-close" aria-label="Close">
            <CloseIcon size={16} />
          </button>
          <h3>Session History</h3>
          <div className="history-week-compare">
            <div className="history-week-stat">
              <div className="num" id="histThisWeek">
                0
              </div>
              <div className="lbl">Sets This Week</div>
            </div>
            <div className="history-week-stat">
              <div className="num" id="histLastWeek">
                0
              </div>
              <div className="lbl">Sets Last Week</div>
            </div>
          </div>
          <div className="history-sparkline" id="historySparkline" />
          <p style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>Last 14 days · sets completed per day, stored locally in this browser.</p>
        </div>
      </div>

      <div
        className={confirmation.open ? 'app-modal-overlay open' : 'app-modal-overlay'}
        id="confirmModalOverlay"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm action"
        onClick={onBackdrop(() => answerConfirm(false))}
      >
        <div className="app-modal confirm-modal">
          <button className="modal-close" onClick={() => answerConfirm(false)} aria-label="Cancel">
            <CloseIcon size={16} />
          </button>
          <h3>Are you sure?</h3>
          <p id="confirmModalMessage">{confirmation.message}</p>
          <div className="confirm-modal-actions">
            <button className="reset-btn" onClick={() => answerConfirm(false)}>
              Cancel
            </button>
            <button className="reset-btn confirm-danger-btn" onClick={() => answerConfirm(true)}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
