'use client';

import { useActionState } from 'react';
import { signInWithPassword } from './actions';

export function PasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, { error: null });

  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label>
        E-mail
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
