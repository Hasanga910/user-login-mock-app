import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

// Service-role client: bypasses RLS. Server-side only; Supabase Auth is not used.
export function db(): SupabaseClient {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env();
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
