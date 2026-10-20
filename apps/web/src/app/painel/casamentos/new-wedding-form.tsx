'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { WeddingFields } from '@/components/wedding-fields';
import { createWedding } from '../actions';

export function NewWeddingForm() {
  const [state, action, pending] = useActionState(createWedding, { error: null });

  return (
    <form action={action} className="stack">
      <WeddingFields mode="planner" />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Cadastrar casamento'}
        </button>
        <Link className="button secondary" href="/painel/casamentos">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
