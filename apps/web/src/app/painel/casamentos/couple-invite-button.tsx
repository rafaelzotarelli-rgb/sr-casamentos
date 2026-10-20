'use client';

import { useActionState } from 'react';
import { createCoupleInvite } from '../actions';
import { InviteLink } from '../invite-link';

export function CoupleInviteButton({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState(createCoupleInvite, { error: null });

  if (state.link) return <InviteLink link={state.link} />;

  return (
    <form action={action}>
      <input type="hidden" name="weddingId" value={weddingId} />
      <button className="button secondary" type="submit" disabled={pending}>
        {pending ? 'Gerando…' : 'Convidar noivos'}
      </button>
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
