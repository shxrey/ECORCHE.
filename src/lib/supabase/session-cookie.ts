/**
 * Supabase keeps the sign-in session in a cookie named after the project,
 * "sb-<project ref>-auth-token", split into "….0", "….1" when it's long.
 * Checking the cookie names tells whether someone might be signed in
 * without loading the client library at all.
 */
export function sessionCookieName(supabaseUrl: string): string | null {
  try {
    return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return null;
  }
}

/** True if `cookies` (a document.cookie string) holds this project's session cookie. */
export function hasSessionCookie(cookies: string, supabaseUrl: string): boolean {
  const name = sessionCookieName(supabaseUrl);
  if (!name) return false;
  return cookies.split(';').some(pair => {
    const key = pair.split('=', 1)[0].trim();
    return key === name || (key.startsWith(`${name}.`) && /^\d+$/.test(key.slice(name.length + 1)));
  });
}
