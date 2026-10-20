'use client';

import { useActionState } from 'react';
import { createAgency } from './actions';

export function CreateAgencyForm() {
  const [state, action, pending] = useActionState(createAgency, { error: null });

  return (
    <form action={action} className="stack">
      <label>
        Nome da assessoria
        <input name="name" required minLength={2} maxLength={80} autoComplete="organization" />
      </label>
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Criando…' : 'Criar assessoria'}
      </button>
    </form>
  );
}
