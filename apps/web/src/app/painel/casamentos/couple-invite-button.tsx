'use client';

import { useActionState } from 'react';
import { InviteLink } from '@/components/invite-link';
import { createCoupleInvite } from '../actions';

export function CoupleInviteButton({
  weddingId,
  phone,
  message,
}: {
  weddingId: string;
  phone: string | null;
  message: string;
}) {
  const [state, action, pending] = useActionState(createCoupleInvite, { error: null });

  if (state.link) {
    return (
      <InviteLink link={state.link} phone={phone} whatsappMessage={`${message} ${state.link}`} />
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="weddingId" value={weddingId} />
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Gerando…' : 'Gerar convite para os noivos'}
        </button>
      </div>
      {state.error ? (
        <p className="alert" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
