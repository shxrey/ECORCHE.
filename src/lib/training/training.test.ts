/**
 * Unit tests for the training rules (npm run test:unit). The same rules are
 * also checked against the running old app in e2e/parity.spec.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { exercises } from '@/content/program';
import { applyBackup, buildBackup, cleanLogMap, hasUnsafeKeys, importSummary, readBackup } from './backup';
import { csvCell, logToCsv } from './csv';
import { dateKey, daysBetween, formatRecency } from './dates';
import { formatLogEntry, lastEarlierNote, lastLoggedText, lastSessionText, lastTimeThisSet, setBoxes } from './history';
import { isEasierThanPrescribed, restSeconds, targetRirMax, warmupSteps } from './prescription';
import { addSetsOn, dayProgress, nextTrainingWeek, recentDays, startOfWeek, trainingWeekBanner, weekProgress, weeklySetCounts } from './progress';
import { compareToLastTime, currentEstimate, estimate1RM, isPersonalRecord, loadTrend, shownSets } from './strength';
import { emptyTrainingState } from './store';
import type { ExerciseLog, LogMap } from './types';
import { formatEstimate, inputToKg, toUnit, weightBoxToKg, weightToInput } from './units';
import { completedSetsFor, exercisesFor, lastTrainedDate, volumeLine } from './volume';

const EXERCISES = new Set(exercises.map((e) => e.key));

describe('dates', () => {
  test('date keys are local calendar dates', () => {
    assert.equal(dateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
    assert.equal(dateKey(new Date(2026, 10, 24, 0, 0)), '2026-11-24');
  });
  test('recency', () => {
    assert.equal(formatRecency('2026-11-24', '2026-11-24'), 'today');
    assert.equal(formatRecency('2026-11-23', '2026-11-24'), 'yesterday');
    assert.equal(formatRecency('2026-10-25', '2026-11-24'), '30 days ago');
    assert.equal(formatRecency('2026-11-25', '2026-11-24'), 'recently');
    assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2); // across a DST change in Europe
  });
});

describe('kg and lb', () => {
  test('kg is shown and saved exactly as typed', () => {
    assert.equal(weightToInput('102.5', 'kg'), '102.5');
    assert.equal(weightToInput(100, 'kg'), '100');
    assert.equal(weightToInput('', 'kg'), '');
    assert.equal(weightToInput(null, 'kg'), '');
    assert.equal(inputToKg('102.50', 'kg'), '102.50');
  });
  test('lb is shown to the nearest 0.05 and saved as kg to 2 decimals', () => {
    assert.equal(toUnit('100', 'lb'), 220.45);
    assert.equal(weightToInput('100', 'lb'), '220.45');
    assert.equal(inputToKg('225', 'lb'), '102.06');
    assert.equal(inputToKg('', 'lb'), '');
    assert.equal(inputToKg('abc', 'lb'), 'abc');
    assert.ok(Number.isNaN(toUnit('', 'lb')));
  });
  test("an untouched box keeps the exact kg it was filled with (100 kg isn't re-saved as 99.99)", () => {
    assert.equal(inputToKg('220.45', 'lb'), '99.99');
    assert.equal(weightBoxToKg('220.45', '100', 'lb'), '100');
    assert.equal(weightBoxToKg('225', '100', 'lb'), '102.06');
    assert.equal(weightBoxToKg('105', '100', 'kg'), '105');
  });
  test('estimates', () => {
    assert.equal(formatEstimate(126.666, 'kg'), '126.7kg');
    assert.equal(formatEstimate(100, 'lb'), '220.5lb');
  });
});

describe('strength', () => {
  test('Epley e1RM', () => {
    assert.equal(estimate1RM('100', '1'), 100);
    assert.equal(estimate1RM('100', '8')!.toFixed(3), '126.667');
    assert.equal(estimate1RM('', '8'), null);
    assert.equal(estimate1RM('100', '0'), null);
    assert.equal(estimate1RM('100', ''), null);
  });

  const history: ExerciseLog = {
    '2026-11-17': { 1: { w: '100', r: '8' }, 2: { w: '102.5', r: '6' } },
    '2026-11-20': { 1: { w: '105', r: '5' } },
  };
  test("est. 1RM uses today's sets once there are any, else the last earlier session's", () => {
    assert.equal(currentEstimate(history, '2026-11-24')!.toFixed(2), '122.50'); // 105 × (1 + 5/30)
    assert.equal(currentEstimate({ ...history, '2026-11-24': { 1: { w: '60', r: '10' } } }, '2026-11-24'), 80);
    assert.equal(currentEstimate(history, '2026-11-16'), null); // nothing yet
    assert.equal(currentEstimate(undefined, '2026-11-24'), null);
  });
  test('the load trend needs 2 days and keeps the last 8', () => {
    assert.deepEqual(loadTrend({ '2026-11-17': history['2026-11-17'] }), []);
    const trend = loadTrend(history);
    assert.deepEqual(trend.map((p) => p.date), ['2026-11-17', '2026-11-20']);
    assert.equal(trend[0].height, 22); // 100 × 8 → 126.7 is the best day
    const many: ExerciseLog = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`2026-11-${10 + i}`, { 1: { w: '50', r: '' } }]));
    const flat = loadTrend(many);
    assert.equal(flat.length, 8);
    assert.deepEqual([flat[0].date, flat[0].est, flat[0].height], ['2026-11-12', null, 2]);
  });
  test('▲ / ▼ against last time', () => {
    const last = { w: '100', r: '8' };
    assert.deepEqual(compareToLastTime('105', '8', last, 'kg'), { kind: 'up', className: 'delta-up', text: '▲ +5kg ready' });
    assert.equal(compareToLastTime('100', '9', last, 'kg')!.text, '▲ +1 rep');
    assert.equal(compareToLastTime('100', '10', last, 'kg')!.text, '▲ +2 reps');
    assert.equal(compareToLastTime('100', '8', last, 'kg')!.text, '— hold, rebuild reps');
    assert.equal(compareToLastTime('95', '12', last, 'kg')!.text, '▼ below last time');
    assert.equal(compareToLastTime('100', '7', last, 'kg')!.kind, 'down');
    // 100 kg shows as 220.45 lb; typing 225 lb (saved as 102.06 kg) is +4.55 lb.
    assert.equal(compareToLastTime('102.06', '8', last, 'lb')!.text, '▲ +4.55lb ready');
    assert.equal(compareToLastTime('', '8', last, 'kg'), null);
    assert.equal(compareToLastTime('100', '8', null, 'kg'), null);
    assert.equal(compareToLastTime('100', '8', { w: '100', r: '' }, 'kg'), null);
  });
  test('a PR beats every earlier set: heavier, or the same weight for more reps', () => {
    const earlier = shownSets(history, 'kg');
    assert.equal(earlier.length, 3);
    assert.equal(isPersonalRecord({ w: '107.5', r: '1' }, earlier, 'kg'), true);
    assert.equal(isPersonalRecord({ w: '105', r: '6' }, earlier, 'kg'), true);
    assert.equal(isPersonalRecord({ w: '105', r: '5' }, earlier, 'kg'), false); // ties aren't records
    assert.equal(isPersonalRecord({ w: '100', r: '12' }, earlier, 'kg'), false);
    assert.equal(isPersonalRecord({ w: '110', r: '' }, earlier, 'kg'), null);
    assert.equal(isPersonalRecord({ w: '110', r: '5' }, [], 'kg'), null); // a first session sets no records
  });
});

describe('looking back', () => {
  const log: ExerciseLog = {
    '2026-11-10': { 1: { w: '90', r: '8', rir: '1' }, 2: { w: '90', r: '7', rir: '' } },
    '2026-11-17': { 1: { w: '95', r: '8', rir: '0' } },
    '2026-11-24': { 1: { w: '100', r: '6', rir: '2', pr: true } },
  };
  test('last time this set skips days the set was not logged', () => {
    assert.deepEqual(lastTimeThisSet(log, 1, '2026-11-24'), { w: '95', r: '8', rir: '0' });
    assert.deepEqual(lastTimeThisSet(log, '2', '2026-11-24'), { w: '90', r: '7', rir: '' });
    assert.equal(lastTimeThisSet(log, 3, '2026-11-24'), null);
    assert.equal(lastTimeThisSet(log, 1, '2026-11-10'), null);
  });
  test('log lines', () => {
    assert.equal(formatLogEntry({ w: '100', r: '6', rir: '2' }, 'kg'), '100kg × 6 @ 2 RIR');
    assert.equal(formatLogEntry({ w: '100', r: '', rir: '' }, 'lb'), '220.45lb');
    assert.equal(formatLogEntry({ w: '', r: '8', rir: 0 }, 'kg'), '× 8 @ 0 RIR');
    assert.equal(lastLoggedText(log, '2026-11-24', 'kg'), 'Last: 100kg × 6 @ 2 RIR');
    assert.equal(lastLoggedText(log, '2026-11-25', 'kg'), '');
    assert.equal(lastSessionText(log, '2026-11-24', 'kg'), 'Last session: 95kg × 8 @ 0 RIR');
    assert.equal(lastSessionText(log, '2026-11-10', 'kg'), 'Last session: —');
    assert.equal(lastSessionText(log, '2026-11-11', 'kg'), 'Last session: 90kg × 7'); // highest-numbered set
  });
  test("today's boxes: saved numbers, else last time's weight and reps as a suggestion (never RIR)", () => {
    assert.deepEqual(setBoxes(log, 1, '2026-11-24', 'kg'), {
      weight: '100', weightKg: '100', reps: '6', rir: '2', suggested: { weight: false, reps: false }, pr: true,
    });
    assert.deepEqual(setBoxes(log, 2, '2026-11-24', 'lb'), {
      weight: '198.4', weightKg: '90', reps: '7', rir: '', suggested: { weight: true, reps: true }, pr: false,
    });
    assert.deepEqual(setBoxes(log, 3, '2026-11-24', 'kg'), {
      weight: '', weightKg: '', reps: '', rir: '', suggested: { weight: false, reps: false }, pr: false,
    });
  });
  test('last earlier note', () => {
    const notes = { '2026-11-10': 'old', '2026-11-17': 'newer', '2026-11-24': 'today' };
    assert.deepEqual(lastEarlierNote(notes, '2026-11-24'), { date: '2026-11-17', text: 'newer' });
    assert.equal(lastEarlierNote(notes, '2026-11-10'), null);
  });
});

describe('prescriptions', () => {
  test('rest is set by the low end of the rep range', () => {
    assert.equal(restSeconds('4-6'), 180);
    assert.equal(restSeconds('To Fail'), 180);
    assert.equal(restSeconds('8-10'), 120);
    assert.equal(restSeconds('8-10/Fail'), 120);
    assert.equal(restSeconds('10-12'), 75);
    assert.equal(restSeconds('15-20+'), 75);
  });
  test('RIR target and the "easier than prescribed" flag', () => {
    assert.equal(targetRirMax('0-1'), 1);
    assert.equal(targetRirMax('1-2→0'), 2);
    assert.equal(targetRirMax('FAILURE'), 0);
    assert.equal(targetRirMax('—'), null);
    assert.equal(isEasierThanPrescribed('2', 1), true);
    assert.equal(isEasierThanPrescribed('1', 1), false);
    assert.equal(isEasierThanPrescribed('', 1), false);
    assert.equal(isEasierThanPrescribed('3', null), false);
  });
  test('warm-ups: 50 / 75 / 90% rounded to the plate jump', () => {
    assert.deepEqual(warmupSteps('100', 'kg')!.map((s) => s.weight), [50, 75, 90]);
    assert.deepEqual(warmupSteps('105', 'kg')!.map((s) => s.weight), [52.5, 80, 95]);
    assert.deepEqual(warmupSteps('225', 'lb')!.map((s) => s.weight), [115, 170, 205]);
    assert.equal(warmupSteps('', 'kg'), null);
    assert.equal(warmupSteps('0', 'kg'), null);
  });
});

describe('progress', () => {
  test('only set dots in the program count (old saves hold ticks for removed sets)', () => {
    const done = { 'legs-a1-set1': true, 'legs-a1-set2': true, 'legs-a8-set1': true, 'legs-a7-set4': true, 'push-a1-set1': true };
    assert.deepEqual(dayProgress(done, 'legsA'), { done: 2, total: 21, complete: false });
    const week = weekProgress(done);
    assert.equal(week.done, 3);
    assert.equal(week.total, 132);
    assert.equal(week.days.pushA.done, 1);
  });
  test('a day is complete when every set is ticked', () => {
    const all = Object.fromEntries(exercises.filter((e) => e.key.startsWith('pull-a')).flatMap((e) => e.setDots.map((d) => [`${e.key}-set${d.idx}`, true])));
    assert.deepEqual(dayProgress(all, 'pullA'), { done: 24, total: 24, complete: true });
  });
  test('training week 1 → 6 (deload) → 1', () => {
    assert.equal(nextTrainingWeek(1), 2);
    assert.equal(nextTrainingWeek(6), 1);
    assert.deepEqual(trainingWeekBanner(3), { text: 'Week 3 of 6', deload: false });
    assert.equal(trainingWeekBanner(6).deload, true);
  });
  test('daily set counts', () => {
    assert.deepEqual(addSetsOn({}, '2026-11-24', 1), { '2026-11-24': 1 });
    assert.deepEqual(addSetsOn({ '2026-11-24': 1 }, '2026-11-24', -1), {});
    assert.deepEqual(addSetsOn({ '2026-11-24': 2 }, '2026-11-24', -5), {});
    const days = recentDays({ '2026-11-24': 5, '2026-11-11': 3, '2026-11-10': 9 }, new Date(2026, 10, 24, 12));
    assert.equal(days.length, 14);
    assert.deepEqual(days[0], { date: '2026-11-11', sets: 3 });
    assert.deepEqual(days[13], { date: '2026-11-24', sets: 5 });
  });
  test('weeks run Monday to Sunday, Sunday included', () => {
    const sessions = { '2026-11-15': 1, '2026-11-16': 10, '2026-11-22': 100, '2026-11-23': 1000, '2026-11-29': 10000 };
    // Sunday 29 Nov, 3pm: the week is Mon 23 – Sun 29.
    assert.deepEqual(weeklySetCounts(sessions, new Date(2026, 10, 29, 15)), { thisWeek: 11000, lastWeek: 110 });
    // Tuesday 24 Nov.
    assert.deepEqual(weeklySetCounts(sessions, new Date(2026, 10, 24, 9)), { thisWeek: 11000, lastWeek: 110 });
    assert.deepEqual(startOfWeek(new Date(2026, 10, 23, 0, 0)), new Date(2026, 10, 23));
  });
});

describe('volume', () => {
  test('muscles map to the cards’ muscle tags', () => {
    const has = (muscle: string, label: string) => exercisesFor(muscle)!.every((e) => e.tags.some((t) => t.label === label));
    assert.ok(has('Front Delts', 'Front Delt'));
    assert.ok(has('Lateral Delts', 'Side Delt'));
    assert.ok(exercisesFor('Back')!.length > exercisesFor('Rear Delts')!.length);
    assert.equal(exercisesFor('Neck'), null);
  });
  test('sets so far and last trained', () => {
    const quads = exercisesFor('quads')!;
    const done = { [`${quads[0].key}-set1`]: true, [`${quads[1].key}-set1`]: true, 'legs-a8-set1': true };
    assert.equal(completedSetsFor('Quads', done), 2);
    const log: LogMap = { [quads[1].key]: { '2026-11-22': { 1: { w: '1' } } }, [quads[0].key]: { '2026-11-20': { 1: { w: '1' } } } };
    assert.equal(lastTrainedDate('quads', log), '2026-11-22');
    assert.equal(volumeLine('Quads', done, log, '2026-11-24'), '2 logged so far · last trained 2 days ago');
    assert.equal(volumeLine('Calves', {}, {}, '2026-11-24'), '0 logged so far');
    assert.equal(volumeLine('Neck', {}, {}, '2026-11-24'), null);
  });
});

describe('CSV', () => {
  test('cells are quoted only when needed', () => {
    assert.equal(csvCell('plain'), 'plain');
    assert.equal(csvCell('a,b'), '"a,b"');
    assert.equal(csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(csvCell('two\nlines'), '"two\nlines"');
  });
  test('rows are sorted by exercise, date and set; empty sets are skipped', () => {
    const csv = logToCsv({
      'push-a1': { '2026-11-20': { 10: { w: '50', r: '8', rir: '' }, 2: { w: '60', r: '8', rir: '1' }, 3: { w: '', r: '', rir: '' } } },
      'legs-a1': { '2026-11-21': { 1: { w: '100', r: '5', rir: 0 } } },
    }, 'lb');
    assert.deepEqual(csv.split('\r\n'), [
      'date,exercise,set,weight_lb,reps,rir',
      '2026-11-21,legs-a1,1,220.45,5,',
      '2026-11-20,push-a1,2,132.3,8,1',
      '2026-11-20,push-a1,10,110.25,8,',
    ]);
  });
});

describe('backups', () => {
  const dir = join(process.cwd(), 'src/lib/training/fixtures');
  const fixture = (name: string) => readFileSync(join(dir, name), 'utf8');
  const TODAY = '2026-11-24';

  test('every format ever exported still imports', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    assert.equal(files.length, 6);
    for (const f of files) assert.equal(readBackup(fixture(f), EXERCISES, TODAY).ok, true, f);
  });

  test('the oldest bare doneMap: ticks kept, false and removed exercises dropped, old set numbers kept', () => {
    const r = readBackup(fixture('1-bare-donemap.json'), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(r.contents, {
      doneMap: { 'push-a1-set1': true, 'push-a1-set2': true, 'push-b6-set5': true },
      logMap: null, notesMap: null, sessionsMap: null, preferences: null,
    });
    assert.equal(r.summary, "This backup contains 3 completed sets. Importing will replace your current progress with this data — this can't be undone. Continue?");
  });

  test('a sets-only backup replaces the ticks and keeps the current logs', () => {
    const r = readBackup(fixture('2-sets-only-2026-07.json'), EXERCISES, TODAY);
    assert.ok(r.ok);
    const before = { ...emptyTrainingState(), logMap: { 'legs-a1': { '2026-11-20': { 1: { w: '100', r: '5' } } } }, sessionsMap: { '2026-11-20': 4 } };
    const after = applyBackup(before, r.contents);
    assert.deepEqual(Object.keys(after.doneMap), ['legs-a1-set1', 'legs-a1-set2', 'legs-a2-set1', 'push-b3-set3']);
    assert.equal(after.logMap, before.logMap);
    assert.equal(after.sessionsMap, before.sessionsMap);
    assert.deepEqual(after.prefs, before.prefs);
  });

  test('schema 2: undated notes are filed under today, preferences apply', () => {
    const r = readBackup(fixture('4-schema2-2026-08-17.json'), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(r.contents.notesMap, { 'legs-a1': { [TODAY]: 'knees out on the way up' } });
    assert.deepEqual(r.contents.doneMap, { 'legs-a1-set1': true, 'legs-a1-set3': true, 'push-a7-set5': true });
    const after = applyBackup(emptyTrainingState(), r.contents);
    assert.deepEqual(after.prefs, { autoRest: false, audio: true, highContrast: false, mesocycleWeek: 1, unit: 'kg' });
    assert.match(r.summary, /3 completed sets, 1 logged entry across 1 exercise, 1 note, your saved preferences\./);
  });

  test('logs from before they were dated are filed under today', () => {
    const r = readBackup(fixture('5-undated-logs.json'), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(r.contents.logMap, {
      'pull-a1': { [TODAY]: { 1: { w: '60', r: '10', rir: '2', pr: false }, 2: { w: '60', r: '9', rir: '1', pr: false } } },
    });
  });

  test('today’s format: bad entries are dropped, the rest imports', () => {
    const r = readBackup(fixture('6-schema3-current.json'), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(r.contents.logMap, {
      'pull-b1': {
        '2026-11-13': { 1: { w: '70', r: '8', rir: '1', pr: false } },
        '2026-11-20': { 1: { w: '72.5', r: '8', rir: '1', pr: true }, 2: { w: '72.5', r: '7', rir: '0', pr: false } },
      },
      'pull-b2': { '2026-11-20': { 3: { w: '30', r: '12', rir: '', pr: false } } },
    });
    assert.deepEqual(r.contents.notesMap, { 'pull-b1': { '2026-11-20': 'strap up on set 2' } });
    assert.equal(applyBackup(emptyTrainingState(), r.contents).prefs.unit, 'lb');
  });

  test('files that are not backups are refused', () => {
    const no = (text: string) => assert.deepEqual(readBackup(text, EXERCISES, TODAY), { ok: false, reason: 'not-a-backup' });
    no('{"hello":1}');
    no('not json');
    no('null');
    no('42');
    no('{"app":"something-else","doneMap":{}}');
    no('{"app":"hypertrophy-blueprint"}');
    no('{"app":"hypertrophy-blueprint","doneMap":{"__proto__":{"polluted":true}}}');
    assert.deepEqual(readBackup('{}', EXERCISES, TODAY, 6 * 1024 * 1024), { ok: false, reason: 'too-large' });
    assert.equal(hasUnsafeKeys(JSON.parse('{"a":{"b":{"constructor":1}}}')), true);
  });

  test('a badly written date drops only that day (the old page filed the whole exercise under today, then crashed)', () => {
    const r = readBackup(JSON.stringify({
      app: 'hypertrophy-blueprint',
      doneMap: {},
      logMap: { 'push-a1': { '2026-11-20': { 1: { w: '50', r: '8' } }, '2026-11-2': { 1: { w: '50', r: '8' } }, 'x': { 1: { w: '1' } } } },
    }), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(r.contents.logMap, { 'push-a1': { '2026-11-20': { 1: { w: '50', r: '8', rir: undefined, pr: false } } } });
  });

  test('ranges: weight 0–2000, reps 0–100, RIR 0–20, each may be blank', () => {
    const clean = cleanLogMap({ 'push-a1': { [TODAY]: {
      1: { w: '2000', r: '100', rir: '20' }, 2: { w: '-1', r: '8' }, 3: { w: '50', r: '101' }, 4: { w: '50', rir: '21' }, 5: { r: '8' }, 6: 'junk',
    } } }, EXERCISES);
    assert.deepEqual(Object.keys(clean['push-a1'][TODAY]), ['1', '5']);
  });

  test('an export round-trips through import', () => {
    const state = { ...emptyTrainingState(), doneMap: { 'pull-b1-set1': true as const }, logMap: { 'pull-b1': { [TODAY]: { 1: { w: '72.5', r: '8', rir: '1', pr: true } } } }, notesMap: { 'pull-b1': { [TODAY]: 'ok' } }, sessionsMap: { [TODAY]: 1 } };
    state.prefs = { ...state.prefs, autoRest: false, unit: 'lb' };
    const file = buildBackup(state, new Date('2026-11-24T10:00:00Z'));
    assert.equal(file.exportedAt, '2026-11-24T10:00:00.000Z');
    const r = readBackup(JSON.stringify(file, null, 2), EXERCISES, TODAY);
    assert.ok(r.ok);
    assert.deepEqual(applyBackup(emptyTrainingState(), r.contents), { ...state, timers: {} });
    assert.equal(importSummary(r.contents).startsWith('This backup contains 1 completed set, 1 logged entry across 1 exercise, 1 note'), true);
  });
});
