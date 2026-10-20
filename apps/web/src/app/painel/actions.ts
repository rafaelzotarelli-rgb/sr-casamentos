'use server';

import { errorMessage, WEDDING_MODULES } from '@sr/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPanelContext } from '@/lib/agency';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { parsePlannerWedding } from '@/lib/wedding-form';

export type FormState = { error: string | null; message?: string; link?: string };

export async function createWedding(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, agency } = await getPanelContext();
  if (!agency) return { error: errorMessage('sem_permissao') };

  const parsed = parsePlannerWedding(formData);
  if (!parsed.ok) return { error: parsed.error };

  const input = parsed.data;
  const { data: weddingId, error } = await supabase.rpc('create_agency_wedding', {
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
    ...(input.venueName ? { p_venue_name: input.venueName } : {}),
    ...(input.contactEmail ? { p_contact_email: input.contactEmail } : {}),
    ...(input.contactPhone ? { p_contact_phone: input.contactPhone } : {}),
  });
  if (error || !weddingId) return { error: errorMessage(error) };

  revalidatePath('/painel', 'layout');
  redirect(`/painel/casamentos/${weddingId}`);
}

export async function updateWedding(_prev: FormState, formData: FormData): Promise<FormState> {
  const weddingId = z.uuid().safeParse(formData.get('weddingId'));
  if (!weddingId.success) return { error: errorMessage('sem_permissao') };
  const parsed = parsePlannerWedding(formData);
  if (!parsed.ok) return { error: parsed.error };

  const input = parsed.data;
  const { supabase } = await getPanelContext();
  // A RLS só deixa atualizar quem tem acesso pela assessoria ou é noivo.
  const { data, error } = await supabase
    .from('weddings')
    .update({
      partner1_name: input.partner1Name,
      partner2_name: input.partner2Name,
      wedding_date: input.weddingDate,
      venue_name: input.venueName ?? null,
      city: input.city ?? null,
      estimated_guests: input.estimatedGuests ?? null,
      estimated_budget_cents: input.estimatedBudgetCents ?? null,
      style: input.style ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
    })
    .eq('id', weddingId.data)
    .select('id');
  if (error) return { error: errorMessage(error) };
  if (!data?.length) return { error: errorMessage('sem_permissao') };

  revalidatePath('/painel', 'layout');
  redirect(`/painel/casamentos/${weddingId.data}`);
}

export async function deleteWedding(_prev: FormState, formData: FormData): Promise<FormState> {
  const weddingId = z.uuid().safeParse(formData.get('weddingId'));
  if (!weddingId.success || formData.get('confirm') !== 'on') {
    return { error: 'Confirme a exclusão marcando a caixa.' };
  }
  const { supabase } = await getPanelContext();
  const { error } = await supabase.rpc('delete_agency_wedding', { p_wedding_id: weddingId.data });
  if (error) return { error: errorMessage(error) };

  revalidatePath('/painel', 'layout');
  redirect('/painel/casamentos');
}

/** O que os noivos veem e editam em cada módulo (só quem tem acesso pela assessoria). */
export async function setCouplePermission(formData: FormData) {
  const parsed = z
    .object({
      weddingId: z.uuid(),
      module: z.enum(WEDDING_MODULES),
      level: z.enum(['none', 'view', 'edit']),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { supabase } = await getPanelContext();
  const { weddingId, module, level } = parsed.data;
  await supabase
    .from('couple_permissions')
    .upsert({ wedding_id: weddingId, module, level }, { onConflict: 'wedding_id,module' });
  revalidatePath(`/painel/casamentos/${weddingId}`);
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
  const state = await inviteLink('couple', { weddingId: weddingId.data });
  revalidatePath(`/painel/casamentos/${weddingId.data}`);
  return state;
}

export async function createStaffInvite(_prev: FormState): Promise<FormState> {
  const { agency } = await getPanelContext();
  if (!agency || agency.role !== 'owner') return { error: errorMessage('sem_permissao') };
  return inviteLink('staff', { agencyId: agency.id });
}

export async function revokeInvite(formData: FormData) {
  const parsed = z
    .object({ inviteId: z.uuid(), weddingId: z.uuid() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { supabase } = await getPanelContext();
  await supabase.rpc('revoke_invite', { p_invite_id: parsed.data.inviteId });
  revalidatePath(`/painel/casamentos/${parsed.data.weddingId}`);
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
  const next = formData.get('next');
  redirect(
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? `/entrar?next=${encodeURIComponent(next)}`
      : '/entrar',
  );
}
