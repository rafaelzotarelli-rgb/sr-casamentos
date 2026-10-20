'use client';

import { useActionState } from 'react';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { acceptTerms } from './actions';

export function ConsentForm() {
  const [state, action, pending] = useActionState(acceptTerms, { error: null });

  return (
    <form action={action} className="card stack">
      <p>
        Usamos seus dados para organizar o seu casamento. Os dados dos seus convidados são usados só
        para os convites e a confirmação de presença. Não vendemos dados e não usamos rastreamento
        de anúncios.
      </p>
      <ConsentCheckbox />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          Continuar
        </button>
      </div>
    </form>
  );
}
