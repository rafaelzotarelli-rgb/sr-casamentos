'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { acceptInvite } from './actions';

export function AcceptInviteForm({ token, askConsent }: { token: string; askConsent: boolean }) {
  const [state, action, pending] = useActionState(acceptInvite, { error: null });

  if (state.accepted) {
    return (
      <div className="success stack" role="status">
        <strong>Pronto! Você já faz parte do casamento.</strong>
        <span>
          O planejamento completo fica no app Sr. Casamentos (iPhone e Android): entre com esta
          mesma conta.
        </span>
        <Link href="/casamento">Ver o casamento</Link>
      </div>
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="token" value={token} />
      {askConsent ? <ConsentCheckbox /> : null}
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Aceitando…' : 'Aceitar convite'}
        </button>
      </div>
    </form>
  );
}
