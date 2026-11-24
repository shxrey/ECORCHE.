/**
 * Turns a Supabase sign-in error into a sentence a lifter can act on.
 *
 * Before this, anything mentioning "email" became "Enter a valid email
 * address", including "Error sending magic link email", which is what
 * people see when the daily email allowance (Resend's free plan: 100 a day)
 * runs out. Codes are checked first; messages are the fallback for older
 * servers that don't send codes.
 */
export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

const KEEP_TRAINING = 'Your progress keeps saving on this device in the meantime.';

export function friendlyAuthError(error: AuthErrorLike): string {
  const message = error.message ?? '';
  const m = message.toLowerCase();
  const code = error.code ?? '';

  // The same address asked again too soon: "…you can only request this after 37 seconds."
  const wait = /after (\d+) seconds?/i.exec(message);
  if (wait) return `Please wait ${wait[1]} seconds, then request a new code.`;

  // The whole site's email allowance (per hour, or the email service's per day).
  if (code === 'over_email_send_rate_limit' || m.includes('email rate limit')) {
    return `Sign-in emails are busy right now. Try again in a little while. ${KEEP_TRAINING}`;
  }
  // Too many attempts from one network (a shared campus Wi-Fi can hit this).
  if (code === 'over_request_rate_limit' || m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts from this network. Wait a few minutes, then try again.';
  }
  // The email couldn't be sent at all (e.g. the email service refused it).
  if (/error sending .*email/.test(m) || (error.status ?? 0) >= 500) {
    return `We couldn't send the email just now. Try again in a few minutes. ${KEEP_TRAINING}`;
  }
  // A wrong, used or expired code.
  if (code === 'otp_expired' || m.includes('expired') || m.includes('invalid otp') || m.includes('token')) {
    return "That code didn't work. Check it, or request a new one.";
  }
  // No connection.
  if ((error.status === 0 && !code) || /failed to fetch|network|load failed/.test(m)) {
    return "Can't reach the server. Check your connection and try again.";
  }
  // A badly typed address.
  if (code === 'email_address_invalid' || code === 'validation_failed' || /invalid (format|email)|email address .* is invalid|validate email/.test(m)) {
    return 'Enter a valid email address.';
  }
  return message || 'Something went wrong. Please try again.';
}
