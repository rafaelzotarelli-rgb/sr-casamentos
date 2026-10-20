'use client';

import type { Wedding } from '@sr/db';
import Link from 'next/link';
import { useActionState } from 'react';
import { WeddingFields } from '@/components/wedding-fields';
import { updateCoupleWedding } from './actions';

export function EditCoupleWedding({ wedding }: { wedding: Wedding }) {
  const [state, action, pending] = useActionState(updateCoupleWedding, { error: null });

  return (
    <form action={action} className="stack">
      <input type="hidden" name="weddingId" value={wedding.id} />
      <WeddingFields mode="couple" defaults={wedding} />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
        <Link className="button secondary" href="/casamento">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
