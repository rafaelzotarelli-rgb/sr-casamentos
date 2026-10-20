'use client';

import type { Wedding } from '@sr/db';
import Link from 'next/link';
import { useActionState } from 'react';
import { WeddingFields } from '@/components/wedding-fields';
import { updateWedding } from '../../../actions';

export function EditWeddingForm({ wedding }: { wedding: Wedding }) {
  const [state, action, pending] = useActionState(updateWedding, { error: null });

  return (
    <form action={action} className="stack">
      <input type="hidden" name="weddingId" value={wedding.id} />
      <WeddingFields mode="planner" defaults={wedding} />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar alterações'}
        </button>
        <Link className="button secondary" href={`/painel/casamentos/${wedding.id}`}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
