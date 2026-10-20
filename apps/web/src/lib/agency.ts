import 'server-only';
import { cache } from 'react';
import type { Enums, Wedding } from '@sr/db';
import { LEGAL_DOCS_VERSION } from '@sr/shared';
import { requireUser } from './supabase/server';

export interface CurrentAgency {
  id: string;
  name: string;
  planCode: string;
  role: Enums<'agency_role'>;
}

export interface CurrentWedding {
  wedding: Wedding;
  role: Enums<'wedding_role'>;
  coupleAccounts: number;
  agencyName: string | null;
}

/**
 * Usuário logado com seus dois vínculos possíveis: assessoria (painel) e
 * casamento (noivos/família). Cacheado por requisição.
 */
export const getUserContext = cache(async (next = '/inicio') => {
  const { supabase, user } = await requireUser(next);

  const [{ data: member }, { data: membership }, { data: consents }] = await Promise.all([
    supabase
      .from('agency_members')
      .select('role, agencies(id, name, plan_code)')
      .eq('user_id', user.id)
      // Dono primeiro: quem é dono de uma assessoria e equipe de outra vê a própria.
      .order('role', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('wedding_members')
      .select('role, weddings(*, agencies(name), wedding_members(role))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('consents')
      .select('document')
      .eq('user_id', user.id)
      .eq('version', LEGAL_DOCS_VERSION),
  ]);

  const agency: CurrentAgency | null = member?.agencies
    ? {
        id: member.agencies.id,
        name: member.agencies.name,
        planCode: member.agencies.plan_code,
        role: member.role,
      }
    : null;

  let wedding: CurrentWedding | null = null;
  if (membership?.weddings) {
    const { agencies, wedding_members: members, ...row } = membership.weddings;
    wedding = {
      wedding: row,
      role: membership.role,
      coupleAccounts: members.filter((m) => m.role === 'couple').length,
      agencyName: agencies?.name ?? null,
    };
  }

  const docs = new Set((consents ?? []).map((c) => c.document));
  const hasConsent = docs.has('terms') && docs.has('privacy');

  return { supabase, user, agency, wedding, hasConsent };
});

/** Contexto do painel do assessor (mesmos dados; nome mantido pelas páginas do painel). */
export const getPanelContext = (next = '/painel') => getUserContext(next);
