'use client';

import { useActionState } from 'react';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { WeddingFields } from '@/components/wedding-fields';
import { createCoupleWedding } from './actions';

export function CoupleOnboardingForm() {
  const [state, action, pending] = useActionState(createCoupleWedding, { error: null });

  return (
    <form action={action} className="stack">
      <WeddingFields mode="couple" />
      <ConsentCheckbox />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Criando…' : 'Criar nosso casamento'}
        </button>
      </div>
    </form>
  );
}
