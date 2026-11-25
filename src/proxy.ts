import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config';

/**
 * Keeps the Supabase session fresh: on each page request, an expiring access
 * token is refreshed and the new auth cookies are written to the response.
 * This only maintains the session. Data access is enforced by row-level
 * security in Postgres, not here.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Stops CDNs from caching a response that carries someone's session.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the token and triggers a refresh when it is close to expiry.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    // Pages only: skip build assets, images and other static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|txt|xml|json)$).*)',
  ],
};
