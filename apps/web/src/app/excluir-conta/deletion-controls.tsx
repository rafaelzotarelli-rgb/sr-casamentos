'use client';

import { useActionState, useState } from 'react';
import { cancelDeletion, requestDeletion } from './actions';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function DeletionControls({
  email,
  scheduledFor,
}: {
  email: string;
  scheduledFor: string | null;
}) {
  const [requestState, request, requesting] = useActionState(requestDeletion, { error: null });
  const [cancelState, cancel, cancelling] = useActionState(cancelDeletion, { error: null });
  const [confirmed, setConfirmed] = useState(false);
  const error = requestState.error ?? cancelState.error;

  if (scheduledFor) {
    return (
      <form action={cancel} className="card stack">
        <p className="alert" role="status">
          A conta <strong>{email}</strong> será excluída em{' '}
          {dateFormat.format(new Date(scheduledFor))}.
        </p>
        {error ? <p className="alert">{error}</p> : null}
        <button className="button" type="submit" disabled={cancelling}>
          {cancelling ? 'Cancelando…' : 'Cancelar a exclusão'}
        </button>
      </form>
    );
  }

  return (
    <form action={request} className="card stack">
      <label
        htmlFor="confirm-deletion"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <input
          id="confirm-deletion"
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ minHeight: 24, width: 24 }}
        />
        Entendi e quero excluir a conta {email}
      </label>
      {error ? <p className="alert">{error}</p> : null}
      <button className="button danger" type="submit" disabled={!confirmed || requesting}>
        {requesting ? 'Enviando…' : 'Excluir minha conta'}
      </button>
    </form>
  );
}
