'use client';

import { useEffect, useRef, useState } from 'react';
import { announce } from '@/components/overlays/feedback';
import type { Exercise } from '@/content/types';
import { trainingStore, useToday, useTraining } from '@/lib/training/client';
import { lastEarlierNote, lastLoggedText, lastSessionText, lastTimeThisSet, setBoxes } from '@/lib/training/history';
import { isEasierThanPrescribed, targetRirMax } from '@/lib/training/prescription';
import { compareToLastTime, currentEstimate, loadTrend, type Delta } from '@/lib/training/strength';
import type { WeightUnit } from '@/lib/training/types';
import { weightBoxToKg } from '@/lib/training/units';

export type LogField = 'weight' | 'reps' | 'rir';

/** One set's row of boxes, as shown. */
export interface LogRow {
  idx: string;
  /** Box text, in the lifter's unit. */
  weight: string;
  /** The kg value the weight box was filled with ('' if none): kept exactly if untouched. */
  weightKg: string;
  reps: string;
  rir: string;
  /** Holds last time's number, not yet typed over (shown dashed). */
  suggested: { weight: boolean; reps: boolean };
  /** ▲ / — / ▼ against the same set last time. */
  delta: Delta | null;
  /** RIR above the prescription: easier than it should have been. */
  easy: boolean;
  /** Today's saved entry is a PR (the lasting tag). */
  pr: boolean;
  /** The "🏆 PR" celebration: shown, then fading, then gone. */
  celebration: 'shown' | 'fading' | null;
}

interface Edit {
  /** What the row's sources were when the lifter started typing: stale once they change. */
  basis: string;
  weight: string;
  reps: string;
  rir: string;
  typed: Partial<Record<LogField, true>>;
}

const NOTE_SAVE_DELAY_MS = 400;

/** A copy of `record` without `key`. */
function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...record };
  delete rest[key];
  return rest;
}

/**
 * Everything a card's session log shows and does. Boxes start from today's
 * saved set, or else last time's weight and reps as a dashed suggestion; the
 * lifter's typing stays in the row until it's confirmed (leaving the row's
 * box, Enter, or ticking the set), and only that one set is saved. Notes save
 * as they're typed (after a short pause).
 *
 * Typing is kept per row, against what the row was showing; if what it's
 * built from changes (that set saved, a unit switch, a sync from another
 * device), the row simply shows the new values.
 */
export function useExerciseLog(ex: Exercise) {
  const history = useTraining((s) => s.logMap[ex.key]);
  const notes = useTraining((s) => s.notesMap[ex.key]);
  const unit = useTraining((s) => s.prefs.unit);
  const today = useToday();
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [celebrations, setCelebrations] = useState<Record<string, 'shown' | 'fading'>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const target = targetRirMax(ex.rir);

  const rows = ex.setDots.map((dot) => {
    const saved = history?.[today]?.[dot.idx];
    const last = lastTimeThisSet(history, dot.idx, today);
    const basis = JSON.stringify([today, unit, saved ?? null, last]);
    const fresh = setBoxes(history, dot.idx, today, unit);
    const edit = edits[dot.idx]?.basis === basis ? edits[dot.idx] : null;
    const weight = edit ? edit.weight : fresh.weight;
    const reps = edit ? edit.reps : fresh.reps;
    const rir = edit ? edit.rir : fresh.rir;
    const row: LogRow = {
      idx: dot.idx,
      weight,
      weightKg: fresh.weightKg,
      reps,
      rir,
      suggested: { weight: fresh.suggested.weight && !edit?.typed.weight, reps: fresh.suggested.reps && !edit?.typed.reps },
      delta: compareToLastTime(weightBoxToKg(weight, fresh.weightKg, unit), reps, last, unit),
      easy: isEasierThanPrescribed(rir, target),
      pr: fresh.pr,
      celebration: celebrations[dot.idx] ?? null,
    };
    return { row, basis, edited: !!edit && Object.keys(edit.typed).length > 0 };
  });

  const find = (idx: string) => rows.find((r) => r.row.idx === idx)!;

  /** A keystroke in one of a row's boxes. */
  const type = (idx: string, field: LogField, value: string) => {
    const { row, basis } = find(idx);
    setEdits((all) => {
      const current = all[idx]?.basis === basis ? all[idx] : { basis, weight: row.weight, reps: row.reps, rir: row.rir, typed: {} };
      return { ...all, [idx]: { ...current, [field]: value, typed: { ...current.typed, [field]: true } } };
    });
  };

  /** "🏆 PR" for 3 seconds, then a fade, a buzz and a word to screen readers. */
  const celebrate = (idx: string) => {
    setCelebrations((all) => ({ ...all, [idx]: 'shown' }));
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    announce('Personal record.');
    timers.current.push(
      setTimeout(() => setCelebrations((all) => (all[idx] ? { ...all, [idx]: 'fading' } : all)), 3000),
      setTimeout(() => setCelebrations((all) => without(all, idx)), 3650),
    );
  };

  /**
   * Saves a row: after typing (`whenEdited`), or because its set was ticked
   * (saves whatever the boxes hold, suggestions included). All-blank removes it.
   */
  const commit = (idx: string, { whenEdited }: { whenEdited: boolean }) => {
    const { row, edited } = find(idx);
    if (whenEdited && !edited) return;
    const blank = !row.weight && !row.reps && !row.rir;
    if (!whenEdited && blank) return; // ticked with nothing in the boxes: nothing to log
    const pr = trainingStore().logSet(ex.key, idx, { w: weightBoxToKg(row.weight, row.weightKg, unit), r: row.reps, rir: row.rir });
    if (pr) celebrate(idx);
    else setCelebrations((all) => without(all, idx));
  };

  // ---------- notes ----------
  const savedNote = notes?.[today] ?? '';
  const [noteEdit, setNoteEdit] = useState<{ basis: string; text: string } | null>(null);
  const note = noteEdit && noteEdit.basis === savedNote ? noteEdit.text : savedNote;
  const pendingNote = useRef<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNote = () => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = null;
    if (pendingNote.current === null) return;
    trainingStore().setNote(ex.key, pendingNote.current);
    pendingNote.current = null;
  };
  const typeNote = (text: string) => {
    setNoteEdit({ basis: savedNote, text });
    pendingNote.current = text;
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(saveNote, NOTE_SAVE_DELAY_MS);
  };
  // Leaving the page (or this card unmounting) saves a note still waiting.
  const saveNoteRef = useRef(saveNote);
  useEffect(() => {
    saveNoteRef.current = saveNote;
  });
  useEffect(() => {
    const pending = timers.current;
    return () => {
      saveNoteRef.current();
      pending.forEach(clearTimeout);
    };
  }, []);

  // ---------- warm-ups ----------
  // Open for the unit it was opened in: switching kg/lb closes it, as before.
  const [warmupUnit, setWarmupUnit] = useState<WeightUnit | null>(null);
  const warmupOpen = warmupUnit === unit;

  const estimate = currentEstimate(history, today);
  const earlierNote = lastEarlierNote(notes, today);
  return {
    unit,
    rows: rows.map((r) => r.row),
    type,
    commit,
    lastLogged: lastLoggedText(history, today, unit),
    lastSession: lastSessionText(history, today, unit),
    estimate,
    trend: loadTrend(history),
    note,
    typeNote,
    saveNote,
    lastNote: earlierNote ? `Last note (${earlierNote.date}): ${earlierNote.text}` : '',
    warmupOpen,
    toggleWarmup: () => setWarmupUnit(warmupOpen ? null : unit),
  };
}

export type ExerciseLog = ReturnType<typeof useExerciseLog>;
