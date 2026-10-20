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
      <label htmlFor="consent" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          style={{ minHeight: 24, width: 24 }}
        />
        <span>
          Li e aceito os{' '}
          <a href="/termos" target="_blank">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank">
            Política de Privacidade
          </a>
        </span>
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
