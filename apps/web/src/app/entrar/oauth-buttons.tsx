'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'apple';

export function OAuthButtons({ next }: { next: string }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setPending(provider);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthError) {
      setError(
        oauthError.message.includes('not enabled')
          ? 'Este login ainda não foi configurado.'
          : 'Não foi possível entrar. Tente novamente.',
      );
      setPending(null);
    }
  }

  return (
    <div className="stack">
      <button
        type="button"
        className="button secondary"
        disabled={pending !== null}
        onClick={() => signIn('google')}
      >
        {pending === 'google' ? 'Abrindo o Google…' : 'Continuar com Google'}
      </button>
      <button
        type="button"
        className="button secondary"
        disabled={pending !== null}
        onClick={() => signIn('apple')}
      >
        {pending === 'apple' ? 'Abrindo a Apple…' : 'Continuar com Apple'}
      </button>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
