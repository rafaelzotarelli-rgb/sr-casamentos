'use client';

import { useActionState } from 'react';
import { acceptInvite } from './actions';

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvite, { error: null });

  if (state.accepted) {
    return (
      <div className="success stack" role="status">
        <strong>Pronto! Você já faz parte do casamento.</strong>
        <span>
          Baixe o app Sr. Casamentos no iPhone ou Android e entre com esta mesma conta para começar
          o planejamento.
        </span>
      </div>
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Aceitando…' : 'Aceitar convite'}
      </button>
    </form>
  );
}
