'use client';

import { WEDDING_STYLE_LABELS, WEDDING_STYLES } from '@sr/shared';
import { useActionState } from 'react';
import { createWedding } from '../actions';

export function NewWeddingForm() {
  const [state, action, pending] = useActionState(createWedding, { error: null });

  return (
    <form action={action} className="stack">
      <div className="row">
        <label style={{ flex: '1 1 200px' }}>
          Nome de um dos noivos
          <input name="partner1Name" required minLength={2} maxLength={60} />
        </label>
        <label style={{ flex: '1 1 200px' }}>
          Nome do(a) outro(a)
          <input name="partner2Name" required minLength={2} maxLength={60} />
        </label>
      </div>
      <div className="row">
        <label style={{ flex: '1 1 160px' }}>
          Data (deixe vazio se não definida)
          <input name="weddingDate" type="date" />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Cidade
          <input name="city" maxLength={80} />
        </label>
      </div>
      <div className="row">
        <label style={{ flex: '1 1 120px' }}>
          Convidados (estimativa)
          <input name="estimatedGuests" type="number" min={1} max={5000} inputMode="numeric" />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Orçamento (R$)
          <input name="estimatedBudget" type="number" min={0} step="0.01" inputMode="decimal" />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Estilo
          <select name="style" defaultValue="">
            <option value="">—</option>
            {WEDDING_STYLES.map((style) => (
              <option key={style} value={style}>
                {WEDDING_STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="success" role="status">
          {state.message}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Cadastrar casamento'}
        </button>
      </div>
    </form>
  );
}
