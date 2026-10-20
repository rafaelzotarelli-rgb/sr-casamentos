import 'server-only';
import { cache } from 'react';
import type { Enums } from '@sr/db';
import { requireUser } from './supabase/server';

export interface CurrentAgency {
  id: string;
  name: string;
  planCode: string;
  role: Enums<'agency_role'>;
}

/** Usuário logado e a assessoria dele (null se ainda não tem). Cacheado por requisição. */
export const getPanelContext = cache(async (next = '/painel') => {
  const { supabase, user } = await requireUser(next);

  const { data } = await supabase
    .from('agency_members')
    .select('role, agencies(id, name, plan_code)')
    .eq('user_id', user.id)
    // Dono primeiro: quem é dono de uma assessoria e equipe de outra vê a própria.
    .order('role', { ascending: true })
    .limit(1)
    .maybeSingle();

  const agency: CurrentAgency | null = data?.agencies
    ? {
        id: data.agencies.id,
        name: data.agencies.name,
        planCode: data.agencies.plan_code,
        role: data.role,
      }
    : null;

  return { supabase, user, agency };
});
