import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Target of the "Sign in" link in the login email. Verifying a token_hash
 * works on any device or browser (unlike a PKCE code, which only works in
 * the browser that requested it), so tapping the link in a phone's mail
 * app signs you in there.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  if (!isSupabaseConfigured) return NextResponse.redirect(new URL('/login', origin));

  const supabase = await createSupabaseServerClient();
  let error: unknown = null;
  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    error = new Error('missing token');
  }

  if (error) return NextResponse.redirect(new URL('/login?error=link', origin));
  return NextResponse.redirect(new URL(next, origin));
}

/** Only allow same-site relative redirects ("/", "/account"), never "//evil.com". */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
