/**
 * Supabase connection settings. Both values are public by design: the
 * publishable key only grants what row-level security allows, which is
 * "your own rows, after you sign in". See supabase/migrations/0001_init.sql.
 *
 * When they are missing (e.g. a fresh clone), the app still runs exactly as
 * before with local-only storage, and account features stay hidden.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
