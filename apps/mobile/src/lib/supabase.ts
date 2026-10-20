import type { Database } from '@sr/db';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { encryptedStorage } from './secure-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Configure EXPO_PUBLIC_SUPABASE_URL e _PUBLISHABLE_KEY (apps/mobile/.env.example)',
  );
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    // Na web (só para desenvolvimento) não há Keychain; o navegador guarda a sessão.
    ...(Platform.OS === 'web' ? {} : { storage: encryptedStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova o token só com o app em primeiro plano (recomendação do Supabase para RN).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
