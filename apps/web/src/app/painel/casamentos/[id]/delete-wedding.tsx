'use client';

import { useActionState, useState } from 'react';
import { deleteWedding } from '../../actions';

export function DeleteWedding({
  weddingId,
  names,
  hasCouple,
}: {
  weddingId: string;
  names: string;
  hasCouple: boolean;
}) {
  const [state, action, pending] = useActionState(deleteWedding, { error: null });
  const [open, setOpen] = useState(false);

  return (
    <div id="excluir" className="card stack" style={{ borderColor: 'var(--color-danger)' }}>
      <h2>Excluir casamento</h2>
      {open ? (
        <form action={action} className="stack">
          <input type="hidden" name="weddingId" value={weddingId} />
          <p>
            Isso apaga definitivamente o casamento de <strong>{names}</strong> e todos os dados
            dele.
            {hasCouple ? ' Os noivos perdem o acesso a este casamento no app.' : ''} Não é possível
            desfazer.
          </p>
          <label
            htmlFor="confirm-delete"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <input
              id="confirm-delete"
              name="confirm"
              type="checkbox"
              required
              style={{ minHeight: 24, width: 24 }}
            />
            Entendo que a exclusão é definitiva
          </label>
          {state.error ? (
            <p className="alert" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="row">
            <button className="button danger" type="submit" disabled={pending}>
              {pending ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button className="button danger" type="button" onClick={() => setOpen(true)}>
            Excluir este casamento
          </button>
        </div>
      )}
    </div>
  );
}
