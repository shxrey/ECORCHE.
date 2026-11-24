import { SUPPORT_EMAIL } from './site';

/*
 * "Send feedback" links open the lifter's email app with a message to
 * support@ecorche.app already started: a prompt, then the page, device and
 * app version, which is what it takes to reproduce a bug. Nothing is sent
 * until they press send, and they can edit or delete any of it.
 */

const SUBJECT = 'ÉCORCHÉ feedback';

/** The plain version, for the link's href. FeedbackLinks adds the details when it's clicked. */
export const FEEDBACK_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;

/** "Chrome 131 on Android 14" from a user-agent string (best effort; never throws). */
export function describeDevice(ua: string): string {
  const os =
    match(ua, /Android (\d+(?:\.\d+)?)/, v => `Android ${v}`) ??
    match(ua, /(?:iPhone|iPad|iPod).*? OS (\d+)_(\d+)/, (a, b) => `iOS ${a}.${b}`) ??
    match(ua, /CrOS/, () => 'ChromeOS') ??
    match(ua, /Windows NT/, () => 'Windows') ??
    match(ua, /Mac OS X/, () => 'macOS') ??
    match(ua, /Linux/, () => 'Linux') ??
    'unknown system';
  const browser =
    match(ua, /EdgA?\/(\d+)/, v => `Edge ${v}`) ??
    match(ua, /SamsungBrowser\/(\d+)/, v => `Samsung Internet ${v}`) ??
    match(ua, /OPR\/(\d+)/, v => `Opera ${v}`) ??
    match(ua, /(?:Firefox|FxiOS)\/(\d+)/, v => `Firefox ${v}`) ??
    match(ua, /CriOS\/(\d+)/, v => `Chrome ${v}`) ??
    match(ua, /Chrome\/(\d+)/, v => `Chrome ${v}`) ??
    match(ua, /Version\/(\d+(?:\.\d+)?).*Safari/, v => `Safari ${v}`) ??
    'unknown browser';
  return `${browser} on ${os}`;
}

function match(ua: string, re: RegExp, format: (...groups: string[]) => string): string | null {
  const m = re.exec(ua);
  return m ? format(...m.slice(1)) : null;
}

export interface FeedbackContext {
  /** e.g. "ecorche.app/#legsA" */
  page: string;
  userAgent: string;
  /** Window width in CSS pixels. */
  width: number;
  /** Short commit id of the running version, when known. */
  version?: string;
}

/** The full link: subject plus a started message with the details needed to fix a bug. */
export function feedbackMailto(ctx: FeedbackContext): string {
  const lines = [
    'What happened, or what would you like to see?',
    '',
    '',
    '',
    '-- Details that help fix bugs (edit or delete freely) --',
    `Page: ${ctx.page}`,
    `Device: ${describeDevice(ctx.userAgent)}, ${Math.round(ctx.width)}px wide`,
  ];
  if (ctx.version) lines.push(`Version: ${ctx.version}`);
  // Mail links want CRLF line breaks (RFC 6068).
  return `${FEEDBACK_HREF}&body=${encodeURIComponent(lines.join('\r\n'))}`;
}
