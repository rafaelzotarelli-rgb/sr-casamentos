'use server';

import type { AcceptInviteResult } from '@sr/db';
import { errorMessage, inviteTokenSchema } from '@sr/shared';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AcceptState = { error: string | null; accepted?: 'couple' };

export async function acceptInvite(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = inviteTokenSchema.safeParse(formData.get('token'));
  if (!token.success) return { error: errorMessage('convite_invalido') };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('accept_invite', { p_token: token.data });
  if (error) return { error: errorMessage(error) };

  const result = data as AcceptInviteResult;
  if (!result.ok) return { error: errorMessage(result.error) };

  if (result.kind === 'staff') redirect('/painel');
  return { error: null, accepted: 'couple' };
}
