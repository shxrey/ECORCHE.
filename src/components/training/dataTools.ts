/**
 * The tracker's data buttons on the rebuilt training core: View History,
 * Export Backup, Export CSV, Auto-Backup and Import Backup. The file formats
 * are lib/training/backup.ts and csv.ts (unchanged, so old files still
 * import); this is the browser side: downloads, the file picker, the
 * "Are you sure?" step and the toasts.
 */
import { askToConfirm, showToast } from '@/components/overlays/feedback';
import { exercises } from '@/content/program';
import { createSignal } from '@/lib/signal';
import { backupFileName, buildBackup, MAX_IMPORT_BYTES, readBackup } from '@/lib/training/backup';
import { trainingStore } from '@/lib/training/client';
import { csvFileName, logToCsv } from '@/lib/training/csv';
import { dateKey } from '@/lib/training/dates';

// ---------- View History ----------

const historyOpen = createSignal(false);
export const openHistory = () => historyOpen.set(true);
export const closeHistory = () => historyOpen.set(false);
export const useHistoryOpen = () => historyOpen.use();

// ---------- exports ----------

/** Everything, as the backup file's text (pretty-printed, as ever). */
const backupText = () => JSON.stringify(buildBackup(trainingStore().getState(), new Date()), null, 2);

/** Saves `text` as a download named `name`. */
function download(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** "Export Backup": a .json file of everything, which Import Backup reads back. */
export function exportBackup(): void {
  download(backupText(), 'application/json', backupFileName(dateKey()));
}

/** "Export CSV": every logged set, one row each, weights in the shown unit. */
export function exportCsv(): void {
  const { logMap, prefs } = trainingStore().getState();
  download(logToCsv(logMap, prefs.unit), 'text/csv', csvFileName(dateKey()));
}

// ---------- Auto-Backup ----------

/** Chrome and Edge's save dialog (File System Access); Safari and Firefox don't have it. */
type SavePicker = (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle>;

const autoBackupOn = createSignal(false);
export const useAutoBackupOn = () => autoBackupOn.use();

/** The file chosen for this visit. A file handle can't go in localStorage, so a reload turns it off. */
let handle: FileSystemFileHandle | null = null;
let writeTimer: ReturnType<typeof setTimeout> | undefined;
let stopWatching: (() => void) | null = null;

/** Rewrites the file with everything; if that fails (file moved, permission taken back) auto-backup turns off. */
async function writeAutoBackup() {
  const target = handle;
  if (!target) return;
  try {
    const writable = await target.createWritable();
    await writable.write(backupText());
    await writable.close();
  } catch {
    if (handle === target) stopAutoBackup();
  }
}

/** Five seconds after the last change, so a run of taps is one write. */
function scheduleWrite() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(writeAutoBackup, 5000);
}

/** Turns auto-backup off quietly (also when leaving the page). */
export function stopAutoBackup(): void {
  handle = null;
  clearTimeout(writeTimer);
  stopWatching?.();
  stopWatching = null;
  autoBackupOn.set(false);
}

/** "Enable Auto-Backup": pick a file, write it now, and again after every change, for this visit. */
export async function toggleAutoBackup(): Promise<void> {
  if (handle) {
    stopAutoBackup();
    showToast('Auto-backup turned off.');
    return;
  }
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker !== 'function') {
    showToast('Auto-backup needs a browser with File System Access support (Chrome or Edge) — Export Backup still works here.');
    return;
  }
  let chosen: FileSystemFileHandle;
  try {
    chosen = await picker.call(window, {
      suggestedName: 'ecorche-autobackup.json',
      types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }],
    });
  } catch {
    return; // the dialog was cancelled: auto-backup stays off
  }
  handle = chosen;
  stopWatching = trainingStore().subscribe(scheduleWrite);
  autoBackupOn.set(true);
  await writeAutoBackup();
  if (handle) showToast('Auto-backup enabled for this session.');
}

// ---------- Import Backup ----------

const EXERCISE_KEYS: ReadonlySet<string> = new Set(exercises.map((e) => e.key));
const NOT_A_BACKUP = 'Could not import this file — it does not look like a valid backup.';

/**
 * "Import Backup": checks the whole file first, says what's in it, and
 * replaces the current progress only once the lifter confirms.
 */
export async function importBackupFile(file: File | undefined): Promise<void> {
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showToast('That file is too large to be a valid backup.');
    return;
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    showToast(NOT_A_BACKUP);
    return;
  }
  const result = readBackup(text, EXERCISE_KEYS, dateKey(), file.size);
  if (!result.ok) {
    showToast(result.reason === 'too-large' ? 'That file is too large to be a valid backup.' : NOT_A_BACKUP);
    return;
  }
  askToConfirm(result.summary, () => {
    trainingStore().importBackup(result.contents);
    showToast('Progress imported successfully.');
  });
}
