'use client';

import { useActionState } from 'react';
import { createStaffInvite } from '../actions';
import { InviteLink } from '@/components/invite-link';

export function StaffInviteButton() {
  const [state, action, pending] = useActionState(createStaffInvite, { error: null });

  if (state.link) return <InviteLink link={state.link} />;

  return (
    <form action={action} className="stack">
      <div>
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Gerando…' : 'Convidar para a equipe'}
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
