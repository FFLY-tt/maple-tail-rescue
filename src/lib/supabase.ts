import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * The browser Supabase client, created on first use. Uses only the publishable
 * (anon) key: what a visitor or staff member can do is decided by the Row Level
 * Security policies in supabase/migrations, never by anything in this app.
 *
 * Created lazily so a missing .env.local fails when something tries to use it
 * (and is handled there), not while the static pages are being built.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  // Written out in full so Next.js can inline them into the browser bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  client = createClient(url, key);
  return client;
}
