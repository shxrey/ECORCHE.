/**
 * In-the-gym tools for the rebuilt training core: the rest timer, the tempo
 * pacer and Workout Mode, as small shared stores with their rules. Drawn by
 * Overlays (timer and pacer), TrainingMinibar and TrainingWorkout; the
 * page-wide side of Workout Mode is WorkoutRuntime.
 */
import { announce } from '@/components/overlays/feedback';
import { displayName } from '@/content/names';
import { days, exerciseByKey } from '@/content/program';
import { trainingStore } from '@/lib/training/client';
import { setKey } from '@/lib/training/progress';
import { createSignal } from '@/lib/signal';
import { viewStore } from '@/lib/view';
import { hush, speak } from './voice';

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
};
const audioOn = () => trainingStore().getState().prefs.audio;

/** A rest countdown: "1:30". */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The workout timer: "07:05" (minutes keep counting past 99). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// ---------- rest timer ----------

export interface Rest {
  visible: boolean;
  /** Reached 0:00 (red, chimed). */
  done: boolean;
  /** When it reaches zero (ms since epoch). */
  endTime: number;
  /** Whole seconds left, as shown. */
  remaining: number;
}

// Hidden, showing the original page's "1:30" until first used.
const rest = createSignal<Rest>({ visible: false, done: false, endTime: 0, remaining: 90 });
export const useRest = () => rest.use();

let ticker: ReturnType<typeof setInterval> | null = null;
let audio: AudioContext | null = null;

function startTicking() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(tickRest, 1000);
}
function stopTicking() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

/**
 * Starts a rest of `seconds`. Counted from its end time, not by ticks, so it
 * stays right when the phone throttles a background tab. Call it from a tap:
 * that's when the browser lets the chime's audio start.
 */
export function startRest(seconds: number): void {
  rest.set({ visible: true, done: false, endTime: Date.now() + seconds * 1000, remaining: seconds });
  announce(`Resting ${seconds} seconds.`);
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    else if (audio?.state === 'suspended') void audio.resume().catch(() => {});
  } catch {
    audio = null;
  }
  startTicking();
}

/** Recomputes from the clock (each second, and on returning to the tab). */
export function tickRest(): void {
  const r = rest.get();
  if (!r.visible || r.done) return;
  const remaining = Math.max(0, Math.round((r.endTime - Date.now()) / 1000));
  if (remaining > 0) {
    if (remaining !== r.remaining) rest.set({ ...r, remaining });
    return;
  }
  rest.set({ ...r, remaining: 0, done: true });
  stopTicking();
  chime();
  sayRestOver();
  announce('Rest over.');
}

/** ±15 s. A finished timer counts on from now, not from when it ended. */
export function adjustRest(deltaSeconds: number): void {
  vibrate(12);
  const r = rest.get();
  const now = Date.now();
  const endTime = Math.max(r.endTime, now) + deltaSeconds * 1000;
  const remaining = Math.max(0, Math.round((endTime - now) / 1000));
  rest.set({ ...r, endTime, remaining, done: remaining > 0 ? false : r.done });
  if (remaining > 0 && !ticker) startTicking();
}

export function hideRest(): void {
  stopTicking();
  const r = rest.get();
  if (r.visible || r.done) rest.set({ ...r, visible: false, done: false });
}

/** A short rising double beep, made on the spot (no sound file). */
function chime() {
  if (!audio) return;
  try {
    const ctx = audio;
    const beep = (start: number, freq: number) => {
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
    beep(ctx.currentTime, 880);
    beep(ctx.currentTime + 0.18, 1175);
  } catch {
    /* no audio: the timer still shows it's done */
  }
}

/** The shown day's first exercise with a set still to tick, by name. */
function nextExerciseName(): string | null {
  const { group, day: letter } = viewStore.get();
  const day = days.find((d) => d.id === `${group}${letter}`);
  const done = trainingStore().getState().doneMap;
  for (const key of day?.exerciseKeys ?? []) {
    const ex = exerciseByKey[key];
    if (!ex.setDots.every((dot) => done[setKey(ex.key, dot.idx)])) return displayName(ex);
  }
  return null;
}

/** "Rest over. Next up: …", only with voice cues on and the page in front of the lifter. */
function sayRestOver() {
  if (!audioOn() || document.visibilityState !== 'visible') return;
  const next = nextExerciseName();
  speak(next ? `Rest over. Next up: ${next}` : 'Rest over.');
}

// ---------- tempo pacer (3 s down, 1 s hold, explosive up, looped) ----------

export const TEMPO_PHASES = [
  { key: 'lower', label: 'Lower', seconds: '3s', duration: 3000, buzz: 200 as number | number[], say: 'Down' },
  { key: 'hold', label: 'Hold', seconds: '1s', duration: 1000, buzz: 80 as number | number[], say: 'Hold' },
  { key: 'drive', label: 'Drive', seconds: 'X', duration: 700, buzz: [60, 40, 60] as number | number[], say: 'Up' },
] as const;

const tempo = createSignal<{ active: boolean; phase: number }>({ active: false, phase: 0 });
export const useTempo = () => tempo.use();
let tempoTimer: ReturnType<typeof setTimeout> | null = null;

function runPhase(index: number) {
  if (!tempo.get().active) return;
  const phase = index % TEMPO_PHASES.length;
  tempo.set({ active: true, phase });
  vibrate(TEMPO_PHASES[phase].buzz);
  if (audioOn()) speak(TEMPO_PHASES[phase].say, 1.3);
  tempoTimer = setTimeout(() => runPhase(index + 1), TEMPO_PHASES[phase].duration);
}

export function startTempo(): void {
  if (tempo.get().active) return; // a double tap never starts a second loop
  tempo.set({ active: true, phase: 0 });
  runPhase(0);
}

export function stopTempo(): void {
  if (tempoTimer) clearTimeout(tempoTimer);
  tempoTimer = null;
  const t = tempo.get();
  if (t.active) tempo.set({ ...t, active: false });
  hush();
}

export const toggleTempo = () => (tempo.get().active ? stopTempo() : startTempo());
export const tempoActive = () => tempo.get().active;

// ---------- Workout Mode ----------

const workoutMode = createSignal(false);
export const useWorkoutMode = () => workoutMode.use();
export const inWorkoutMode = () => workoutMode.get();
export const subscribeWorkoutMode = workoutMode.subscribe;

/** Workout Mode: everything but the shown day fades away, and the screen stays on. */
export function startWorkoutMode(): void {
  if (workoutMode.get()) return;
  hideRest();
  keepScreenOn();
  workoutMode.set(true);
}
export function finishWorkoutMode(): void {
  if (!workoutMode.get()) return;
  letScreenSleep();
  workoutMode.set(false);
}
export const toggleWorkoutMode = () => (workoutMode.get() ? finishWorkoutMode() : startWorkoutMode());

// ---------- keeping the screen awake (Workout Mode) ----------

let wakeLock: WakeLockSentinel | null = null;

export function keepScreenOn(): void {
  if (!('wakeLock' in navigator)) return;
  navigator.wakeLock
    .request('screen')
    .then((lock) => {
      wakeLock = lock;
    })
    .catch(() => {
      wakeLock = null; // low battery, permission refused: just no wake lock
    });
}

export function letScreenSleep(): void {
  if (wakeLock) void wakeLock.release().catch(() => {});
  wakeLock = null;
}
