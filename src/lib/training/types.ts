/**
 * The training data, exactly as the app saves it today (in localStorage and in
 * backup files). The sync engine's model defines the shapes; this file gives
 * them the names the rebuilt app uses.
 *
 *   doneMap      "legs-a1-set2" → true                      ticked set dots, this training week
 *   logMap       exercise → "YYYY-MM-DD" → set → entry     weight (kg), reps, RIR, PR flag
 *   notesMap     exercise → "YYYY-MM-DD" → text
 *   sessionsMap  "YYYY-MM-DD" → sets ticked that day        drives View History
 *   timers       "legsA" → start time (ms)                  running workout timers
 *   prefs        auto-rest, voice, high contrast, training week, kg/lb
 *
 * Saved values keep the types they were typed with (usually strings such as
 * "102.5"), because old backups and synced rows depend on them.
 */
import type { LegacyLogEntry, LegacyPrefs, LegacyState, WeightUnit } from '../sync/model';

export type { WeightUnit };
export type LogEntry = LegacyLogEntry;
export type Prefs = LegacyPrefs;
export type TrainingState = LegacyState;

export type DoneMap = TrainingState['doneMap'];
export type LogMap = TrainingState['logMap'];
export type NotesMap = TrainingState['notesMap'];
export type SessionsMap = TrainingState['sessionsMap'];

/** One exercise's log: date → set index → entry. */
export type ExerciseLog = LogMap[string];
/** One day's sets for one exercise: set index → entry. */
export type DayLog = ExerciseLog[string];

/** A saved or typed weight: kg as text or a number; blank is '' or null. */
export type WeightValue = string | number | null | undefined;
