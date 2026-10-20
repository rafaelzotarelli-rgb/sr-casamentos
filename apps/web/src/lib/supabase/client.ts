import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@sr/db';
import { env } from '../env';

/** Cliente Supabase no navegador (login OAuth). */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
}
