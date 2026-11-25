/**
 * Spoken cues ("Rest over. Next up: Leg Press", the tempo pacer's "Down /
 * Hold / Up") with the browser's speech synthesis, when it has one.
 */

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

/** The voice list loads late in most browsers: asking once early means it's ready by the first cue. */
export function warmUpVoices(): void {
  if (supported()) window.speechSynthesis.getVoices();
}

/**
 * An on-device voice if there is one, so a cue doesn't lag or fail on patchy
 * gym Wi-Fi (network voices are common Android defaults); English first.
 */
function preferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices() ?? [];
  return (
    voices.find((v) => v.localService && v.lang?.startsWith('en')) ??
    voices.find((v) => v.localService) ??
    voices.find((v) => v.lang?.startsWith('en')) ??
    voices[0] ??
    null
  );
}

/** Says `text`, cutting off anything still being said. Silently does nothing without speech. */
export function speak(text: string, rate = 1): void {
  if (!supported()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = 1;
    const voice = preferredVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech unavailable: the beep, buzz and on-screen state still land */
  }
}

/** Stops speaking. */
export function hush(): void {
  if (!supported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* nothing to stop */
  }
}
