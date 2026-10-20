'use client';

import { useActionState } from 'react';
import { InviteLink } from '@/components/invite-link';
import { createPartnerInvite } from './actions';

export function PartnerInvite({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(createPartnerInvite, { error: null });

  if (state.link) {
    return (
      <InviteLink
        link={state.link}
        whatsappMessage={`Vamos planejar nosso casamento juntos no Sr. Casamentos: ${state.link}`}
      />
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="weddingId" value={weddingId} />
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Gerando…' : 'Gerar convite para meu par'}
        </button>
      </div>
    </form>
  );
}
