'use server';

import { errorMessage, LEGAL_DOCS_VERSION, plannerWeddingSchema, reaisToCents } from '@sr/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPanelContext } from '@/lib/agency';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type FormState = { error: string | null; message?: string; link?: string };

const agencyNameSchema = z.string().trim().min(2, 'Use pelo menos 2 letras.').max(80);

export async function createAgency(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = agencyNameSchema.safeParse(formData.get('name'));
  if (!name.success) return { error: name.error.issues[0]?.message ?? 'Nome inválido.' };
  if (formData.get('consent') !== 'on') {
    return { error: 'Para continuar, aceite os Termos de Uso e a Política de Privacidade.' };
  }

  const { supabase, user } = await getPanelContext();
  const { error: consentError } = await supabase.from('consents').upsert(
    (['terms', 'privacy'] as const).map((document) => ({
      user_id: user.id,
      document,
      version: LEGAL_DOCS_VERSION,
    })),
    { onConflict: 'user_id,document,version', ignoreDuplicates: true },
  );
  if (consentError) return { error: errorMessage(consentError) };

  const { error } = await supabase.rpc('create_agency', { p_name: name.data });
  if (error) return { error: errorMessage(error) };

  revalidatePath('/painel', 'layout');
  return { error: null };
}

export async function createWedding(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, agency } = await getPanelContext();
  if (!agency) return { error: errorMessage('sem_permissao') };

  const raw = Object.fromEntries(formData);
  const guests = raw.estimatedGuests ? Number(raw.estimatedGuests) : undefined;
  const budget = raw.estimatedBudget ? reaisToCents(Number(raw.estimatedBudget)) : undefined;
  const parsed = plannerWeddingSchema.safeParse({
    partner1Name: raw.partner1Name,
    partner2Name: raw.partner2Name,
    weddingDate: raw.weddingDate ? raw.weddingDate : null,
    city: raw.city || undefined,
    estimatedGuests: guests,
    estimatedBudgetCents: budget,
    style: raw.style || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const input = parsed.data;
  const { error } = await supabase.rpc('create_agency_wedding', {
    p_agency_id: agency.id,
    p_partner1_name: input.partner1Name,
    p_partner2_name: input.partner2Name,
    // A RPC aceita null; os tipos gerados não marcam parâmetros opcionais como nulos.
    p_wedding_date: input.weddingDate as string,
    ...(input.city ? { p_city: input.city } : {}),
    ...(input.estimatedGuests ? { p_estimated_guests: input.estimatedGuests } : {}),
    ...(input.estimatedBudgetCents !== undefined
      ? { p_estimated_budget_cents: input.estimatedBudgetCents }
      : {}),
    ...(input.style ? { p_style: input.style } : {}),
  });
  if (error) return { error: errorMessage(error) };

  revalidatePath('/painel', 'layout');
  return { error: null, message: 'Casamento cadastrado.' };
}

async function inviteLink(
  kind: 'couple' | 'staff',
  target: { weddingId?: string; agencyId?: string },
): Promise<FormState> {
  const { supabase } = await getPanelContext();
  const { data: token, error } = await supabase.rpc('create_invite', {
    p_kind: kind,
    ...(target.weddingId ? { p_wedding_id: target.weddingId } : {}),
    ...(target.agencyId ? { p_agency_id: target.agencyId } : {}),
  });
  if (error || !token) return { error: errorMessage(error) };

  // O token só existe aqui: o banco guarda apenas o hash. Mostramos uma vez.
  return { error: null, link: `${env.siteUrl}/convite/${token}` };
}

export async function createCoupleInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const weddingId = z.uuid().safeParse(formData.get('weddingId'));
  if (!weddingId.success) return { error: errorMessage('sem_permissao') };
  return inviteLink('couple', { weddingId: weddingId.data });
}

export async function createStaffInvite(_prev: FormState): Promise<FormState> {
  const { agency } = await getPanelContext();
  if (!agency || agency.role !== 'owner') return { error: errorMessage('sem_permissao') };
  return inviteLink('staff', { agencyId: agency.id });
}

/** Libera ou retira um membro da equipe de um casamento (só o dono; a RLS confere). */
export async function toggleStaffAssignment(formData: FormData) {
  const ids = z
    .object({ weddingId: z.uuid(), userId: z.uuid(), assigned: z.enum(['0', '1']) })
    .safeParse(Object.fromEntries(formData));
  if (!ids.success) return;

  const { supabase } = await getPanelContext();
  const { weddingId, userId, assigned } = ids.data;
  if (assigned === '1') {
    await supabase
      .from('agency_wedding_staff')
      .delete()
      .eq('wedding_id', weddingId)
      .eq('user_id', userId);
  } else {
    await supabase.from('agency_wedding_staff').insert({ wedding_id: weddingId, user_id: userId });
  }
  revalidatePath('/painel/equipe');
}

export async function removeStaff(formData: FormData) {
  const { supabase, agency } = await getPanelContext();
  const userId = z.uuid().safeParse(formData.get('userId'));
  if (!agency || !userId.success) return;
  await supabase
    .from('agency_members')
    .delete()
    .eq('agency_id', agency.id)
    .eq('user_id', userId.data)
    .eq('role', 'staff');
  revalidatePath('/painel/equipe');
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  // "Sair de todos os aparelhos" revoga todas as sessões do usuário (briefing, 9).
  await supabase.auth.signOut({ scope: formData.get('everywhere') ? 'global' : 'local' });
  redirect('/entrar');
}
