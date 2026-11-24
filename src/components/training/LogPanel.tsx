'use client';

import type { KeyboardEvent } from 'react';
import { warmupSteps } from '@/lib/training/prescription';
import { formatEstimate, notesPlaceholder } from '@/lib/training/units';
import type { ExerciseLog, LogField, LogRow } from './useExerciseLog';

const PR_CELEBRATION = {
  marginLeft: '8px',
  padding: '2px 8px',
  borderRadius: '999px',
  background: 'var(--gold)',
  color: '#1a1400',
  fontWeight: 700,
  fontSize: '11px',
  display: 'inline-block',
  transition: 'opacity 0.6s ease',
} as const;

/** "Last:" under the exercise name: today's highest-numbered logged set. */
export function LastLogged({ exKey, log }: { exKey: string; log: ExerciseLog }) {
  return (
    <div className="last-log" id={`lastLog-${exKey}`}>
      {log.lastLogged}
    </div>
  );
}

/**
 * The open card's logging area, below the exercise details: last session,
 * estimated 1RM, the load trend, and the session log (a row of boxes per
 * set, warm-up steps, and today's note). Same markup as the original page.
 */
export function LogPanel({ exKey, name, log }: { exKey: string; name: string; log: ExerciseLog }) {
  const { unit } = log;
  const unitWord = unit === 'lb' ? 'pounds' : 'kilograms';
  const steps = log.warmupOpen ? warmupSteps(log.rows[0]?.weight ?? '', unit) : null;
  return (
    <>
      <div className="last-log last-session" id={`lastSession-${exKey}`}>
        {log.lastSession}
      </div>
      <div className="last-log est-1rm" id={`est1rm-${exKey}`}>
        {log.estimate ? `Est. 1RM: ~${formatEstimate(log.estimate, unit)}` : ''}
      </div>
      <div className="load-sparkline" id={`loadSpark-${exKey}`}>
        {log.trend.map((p) => (
          <div
            key={p.date}
            className="ls-bar"
            style={{ height: `${p.height}px` }}
            title={p.date + (p.est ? `: ~${formatEstimate(p.est, unit)} e1RM` : ': no weight logged')}
          />
        ))}
      </div>
      {/* data-rebuilt: lets a long ▲/▼ badge wrap under the boxes on phones (overrides.css). */}
      <div className="set-log-panel" data-rebuilt="">
        <h4>Session Log</h4>
        <div className="set-log-rows">
          {log.rows.map((row) => (
            <SetRow key={row.idx} row={row} log={log} label={`${name}, set ${row.idx}`} unitWord={unitWord} />
          ))}
        </div>
        <button type="button" className="warmup-toggle-btn" onClick={log.toggleWarmup}>
          Warmup %
        </button>
        <div className={log.warmupOpen ? 'warmup-calc open' : 'warmup-calc'} id={`warmupCalc-${exKey}`}>
          {!log.warmupOpen ? null : steps ? (
            steps.map((s) => (
              <span key={s.pct} className="warmup-step">
                {s.pct}%: <b>{`${s.weight}${unit}`}</b>
              </span>
            ))
          ) : (
            <span className="warmup-hint">{"Enter set 1's weight first."}</span>
          )}
        </div>
        <div className="last-log last-note" id={`lastNote-${exKey}`}>
          {log.lastNote}
        </div>
        <textarea
          className="exercise-notes"
          placeholder={notesPlaceholder(unit)}
          aria-label={`${name}, notes for today`}
          value={log.note}
          onChange={(e) => log.typeNote(e.target.value)}
          onBlur={log.saveNote}
        />
      </div>
    </>
  );
}

function SetRow({ row, log, label, unitWord }: { row: LogRow; log: ExerciseLog; label: string; unitWord: string }) {
  const box = (field: LogField) => ({
    'data-set': row.idx,
    onChange: (e: { target: { value: string } }) => log.type(row.idx, field, e.target.value),
    onBlur: () => log.commit(row.idx, { whenEdited: true }),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') log.commit(row.idx, { whenEdited: true });
    },
  });
  const suggested = (on: boolean) => (on ? ' log-input-suggested' : '');
  return (
    <div className={row.easy ? 'set-log-row rir-easy' : 'set-log-row'}>
      Set {row.idx}:{' '}
      <input
        type="number"
        step="any"
        inputMode="decimal"
        className={`log-input log-weight${suggested(row.suggested.weight)}`}
        placeholder={log.unit}
        data-kg={row.weightKg}
        aria-label={`${label}, weight in ${unitWord}`}
        value={row.weight}
        {...box('weight')}
      />{' '}
      <input
        type="number"
        inputMode="numeric"
        className={`log-input log-reps${suggested(row.suggested.reps)}`}
        placeholder="reps"
        aria-label={`${label}, reps`}
        value={row.reps}
        {...box('reps')}
      />{' '}
      <input
        type="number"
        inputMode="numeric"
        className="log-input log-rir"
        placeholder="RIR"
        aria-label={`${label}, reps in reserve`}
        value={row.rir}
        {...box('rir')}
      />{' '}
      <span className={row.delta ? `delta-badge ${row.delta.className}` : 'delta-badge'}>{row.delta?.text}</span>
      {row.celebration ? (
        <span className="pr-badge" style={{ ...PR_CELEBRATION, opacity: row.celebration === 'fading' ? 0 : 1 }}>
          🏆 PR
        </span>
      ) : null}
      {row.pr ? (
        <span className="pr-persistent-badge" aria-label="Personal record">
          PR
        </span>
      ) : null}
    </div>
  );
}
