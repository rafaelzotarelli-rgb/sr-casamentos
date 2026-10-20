'use client';

import { useActionState } from 'react';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { createAgency } from './actions';

export function CreateAgencyForm() {
  const [state, action, pending] = useActionState(createAgency, { error: null });

  return (
    <form action={action} className="stack">
      <label>
        Nome da assessoria
        <input name="name" required minLength={2} maxLength={80} autoComplete="organization" />
      </label>
      <ConsentCheckbox />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Criando…' : 'Criar assessoria'}
        </button>
      </div>
    </form>
  );
}
