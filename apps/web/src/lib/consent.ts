import 'server-only';
import { LEGAL_DOCS_VERSION } from '@sr/shared';
import type { createClient } from './supabase/server';

type Client = Awaited<ReturnType<typeof createClient>>;

/** Registra o aceite de Termos e Política na versão atual (D23). */
export async function recordConsent(supabase: Client, userId: string): Promise<boolean> {
  const { error } = await supabase.from('consents').upsert(
    (['terms', 'privacy'] as const).map((document) => ({
      user_id: userId,
      document,
      version: LEGAL_DOCS_VERSION,
    })),
    { onConflict: 'user_id,document,version', ignoreDuplicates: true },
  );
  return !error;
}
