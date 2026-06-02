/**
 * Single source of truth for whether Supabase is configured. When the two
 * public env vars are absent the app runs in OFFLINE DEMO mode (seed data),
 * so the UI is previewable without a database — see src/lib/data/*.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);
