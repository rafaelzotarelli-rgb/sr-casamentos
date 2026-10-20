import type { Wedding } from '@sr/db';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';

export interface MyWedding {
  wedding: Wedding;
  role: 'couple' | 'family';
  coupleAccounts: number;
  agencyName: string | null;
}

type Result = { data: MyWedding | null; error: boolean };

async function fetchMyWedding(userId: string): Promise<Result> {
  const { data: membership, error } = await supabase
    .from('wedding_members')
    .select('role, weddings(*, agencies(name), wedding_members(role))')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: true };
  if (!membership?.weddings) return { data: null, error: false };

  const { agencies, wedding_members: members, ...wedding } = membership.weddings;
  return {
    data: {
      wedding,
      role: membership.role,
      coupleAccounts: members.filter((m) => m.role === 'couple').length,
      agencyName: agencies?.name ?? null,
    },
    error: false,
  };
}

/** Casamento do usuário logado (o primeiro vínculo, se houver mais de um). */
export function useMyWedding() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [state, setState] = useState<Result & { userId: string | null }>({
    data: null,
    error: false,
    userId: null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void fetchMyWedding(userId).then((result) => {
      if (active) setState({ ...result, userId });
    });
    return () => {
      active = false;
    };
  }, [userId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Resultado de outro usuário (troca de conta) ainda não vale para o atual.
  const current = state.userId === userId;
  return {
    data: current ? state.data : null,
    error: current && state.error,
    loading: Boolean(userId) && !current,
    reload,
  };
}
