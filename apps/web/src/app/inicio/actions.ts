'use server';

import { errorMessage } from '@sr/shared';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getUserContext } from '@/lib/agency';
import { recordConsent } from '@/lib/consent';
import { parseCoupleWedding } from '@/lib/wedding-form';

export type FormState = { error: string | null };

const CONSENT_REQUIRED = 'Para continuar, aceite os Termos de Uso e a Política de Privacidade.';

/** Noivos sem assessor criam o próprio casamento (mesma RPC do app). */
export async function createCoupleWedding(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (formData.get('consent') !== 'on') return { error: CONSENT_REQUIRED };
  const parsed = parseCoupleWedding(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { supabase, user, wedding } = await getUserContext();
  if (wedding) redirect('/casamento');
  if (!(await recordConsent(supabase, user.id))) return { error: errorMessage(null) };

  const input = parsed.data;
  const { error } = await supabase.rpc('create_couple_wedding', {
    p_partner1_name: input.partner1Name,
    p_partner2_name: input.partner2Name,
    // A RPC aceita null ("ainda não definimos"); o tipo gerado não marca isso.
    p_wedding_date: input.weddingDate as string,
    p_city: input.city,
    p_estimated_guests: input.estimatedGuests,
    p_estimated_budget_cents: input.estimatedBudgetCents,
    p_style: input.style,
    ...(input.venueName ? { p_venue_name: input.venueName } : {}),
  });
  if (error) return { error: errorMessage(error) };

  redirect('/casamento');
}

const agencyNameSchema = z.string().trim().min(2, 'Use pelo menos 2 letras.').max(80);

/** Escolha explícita "Sou assessor(a)": cria a assessoria e abre o painel. */
export async function createAgency(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = agencyNameSchema.safeParse(formData.get('name'));
  if (!name.success) return { error: name.error.issues[0]?.message ?? 'Nome inválido.' };
  if (formData.get('consent') !== 'on') return { error: CONSENT_REQUIRED };

  const { supabase, user } = await getUserContext();
  if (!(await recordConsent(supabase, user.id))) return { error: errorMessage(null) };

  const { error } = await supabase.rpc('create_agency', { p_name: name.data });
  if (error) return { error: errorMessage(error) };

  redirect('/painel');
}
