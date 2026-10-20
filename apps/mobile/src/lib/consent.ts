import { LEGAL_DOCS_VERSION } from '@sr/shared';
import { supabase } from './supabase';

/** O usuário já aceitou Termos e Política na versão atual? */
export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('consents')
    .select('document')
    .eq('user_id', userId)
    .eq('version', LEGAL_DOCS_VERSION);
  const docs = new Set((data ?? []).map((c) => c.document));
  return docs.has('terms') && docs.has('privacy');
}

export async function recordConsent(userId: string): Promise<boolean> {
  const { error } = await supabase.from('consents').upsert(
    [
      { user_id: userId, document: 'terms', version: LEGAL_DOCS_VERSION },
      { user_id: userId, document: 'privacy', version: LEGAL_DOCS_VERSION },
    ],
    { onConflict: 'user_id,document,version', ignoreDuplicates: true },
  );
  return !error;
}
