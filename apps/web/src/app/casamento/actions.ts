'use server';

import { errorMessage } from '@sr/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserContext } from '@/lib/agency';
import { recordConsent } from '@/lib/consent';
import { env } from '@/lib/env';
import { parseCoupleWedding } from '@/lib/wedding-form';

export type FormState = { error: string | null; link?: string };

export async function acceptTerms(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get('consent') !== 'on') {
    return { error: 'Para continuar, aceite os Termos de Uso e a Política de Privacidade.' };
  }
  const { supabase, user } = await getUserContext('/casamento');
  if (!(await recordConsent(supabase, user.id))) return { error: errorMessage(null) };
  revalidatePath('/casamento');
  return { error: null };
}

export async function updateCoupleWedding(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const weddingId = z.uuid().safeParse(formData.get('weddingId'));
  const parsed = parseCoupleWedding(formData);
  if (!weddingId.success) return { error: errorMessage('sem_permissao') };
  if (!parsed.ok) return { error: parsed.error };

  const input = parsed.data;
  const { supabase } = await getUserContext('/casamento');
  const { data, error } = await supabase
    .from('weddings')
    .update({
      partner1_name: input.partner1Name,
      partner2_name: input.partner2Name,
      wedding_date: input.weddingDate,
      venue_name: input.venueName ?? null,
      city: input.city,
      estimated_guests: input.estimatedGuests,
      estimated_budget_cents: input.estimatedBudgetCents,
      style: input.style,
    })
    .eq('id', weddingId.data)
    .select('id');
  if (error) return { error: errorMessage(error) };
  if (!data?.length) return { error: errorMessage('sem_permissao') };

  redirect('/casamento');
}

export async function createPartnerInvite(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const weddingId = z.uuid().safeParse(formData.get('weddingId'));
  if (!weddingId.success) return { error: errorMessage('sem_permissao') };
  const { supabase } = await getUserContext('/casamento');
  const { data: token, error } = await supabase.rpc('create_invite', {
    p_kind: 'partner',
    p_wedding_id: weddingId.data,
  });
  if (error || !token) return { error: errorMessage(error) };
  return { error: null, link: `${env.siteUrl}/convite/${token}` };
}
