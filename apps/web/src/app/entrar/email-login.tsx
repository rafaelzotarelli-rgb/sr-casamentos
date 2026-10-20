'use client';

import { useActionState } from 'react';
import { type EmailState, sendEmailCode, verifyEmailCode } from './email-actions';

export function EmailLogin({ next }: { next: string }) {
  const [sendState, send, sending] = useActionState(sendEmailCode, { error: null });
  const [verifyState, verify, verifying] = useActionState<EmailState, FormData>(verifyEmailCode, {
    error: null,
  });

  if (sendState.sent) {
    return (
      <form action={verify} className="stack">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={sendState.email} />
        <p className="success" role="status">
          Enviamos um código para <strong>{sendState.email}</strong>. Digite-o abaixo ou clique no
          link do e-mail.
        </p>
        <label>
          Código de 6 dígitos
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
          />
        </label>
        {verifyState.error ? (
          <p className="alert" role="alert">
            {verifyState.error}
          </p>
        ) : null}
        <button className="button" type="submit" disabled={verifying}>
          {verifying ? 'Confirmando…' : 'Confirmar e entrar'}
        </button>
      </form>
    );
  }

  return (
    <form action={send} className="stack">
      <input type="hidden" name="next" value={next} />
      <label>
        Seu e-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={sendState.email ?? ''}
        />
      </label>
      {sendState.error ? (
        <p className="alert" role="alert">
          {sendState.error}
        </p>
      ) : null}
      <button className="button secondary" type="submit" disabled={sending}>
        {sending ? 'Enviando…' : 'Receber código por e-mail'}
      </button>
    </form>
  );
}
