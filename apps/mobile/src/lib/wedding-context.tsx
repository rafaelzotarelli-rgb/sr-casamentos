import type { AccessLevel } from '@sr/db';
import {
  BUDGET_CATEGORY_KEYS,
  generateChecklist,
  suggestBudget,
  type WeddingModule,
  type WeddingStyle,
} from '@sr/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { type MyWedding, useMyWedding } from './use-wedding';

type Access = Record<WeddingModule, AccessLevel>;

const NO_ACCESS: Access = {
  tasks: 'none',
  budget: 'none',
  payments: 'none',
  vendors: 'none',
  contracts: 'none',
  guests: 'none',
  tables: 'none',
  site: 'none',
};

interface WeddingContextValue {
  data: MyWedding | null;
  access: Access;
  loading: boolean;
  /** Recarrega casamento e permissões (após editar dados ou permissões). */
  reload: () => void;
}

const WeddingContext = createContext<WeddingContextValue>({
  data: null,
  access: NO_ACCESS,
  loading: true,
  reload: () => undefined,
});

/** Cria checklist e orçamento sugeridos no primeiro acesso (uma vez por casamento). */
async function initializePlan({ wedding }: MyWedding): Promise<void> {
  const tasks = generateChecklist(wedding.wedding_date).map((t) => ({
    title: t.title,
    category: t.category,
    phase: t.phase,
    due_date: t.dueDate,
  }));
  const budget =
    wedding.estimated_budget_cents !== null
      ? suggestBudget(wedding.estimated_budget_cents, wedding.style as WeddingStyle | null).map(
          (line) => ({
            key: line.key,
            name: line.label,
            planned_cents: line.plannedCents,
            sort_order: BUDGET_CATEGORY_KEYS.indexOf(line.key),
          }),
        )
      : [];
  await supabase.rpc('initialize_wedding_plan', {
    p_wedding_id: wedding.id,
    p_tasks: tasks,
    p_budget: budget,
  });
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useMyWedding();
  const [access, setAccess] = useState<{ weddingId: string; levels: Access } | null>(null);
  const weddingId = data?.wedding.id;
  const needsPlan = data?.role === 'couple' && data.wedding.starter_initialized_at === null;

  useEffect(() => {
    if (!weddingId) return;
    let active = true;
    void supabase.rpc('my_module_access', { p_wedding_id: weddingId }).then(({ data: levels }) => {
      if (active) setAccess({ weddingId, levels: { ...NO_ACCESS, ...(levels as Access) } });
    });
    return () => {
      active = false;
    };
  }, [weddingId]);

  useEffect(() => {
    if (data && needsPlan) void initializePlan(data).then(reload);
  }, [data, needsPlan, reload]);

  const currentAccess = access && access.weddingId === weddingId ? access.levels : null;

  return (
    <WeddingContext.Provider
      value={{
        data,
        access: currentAccess ?? NO_ACCESS,
        loading: loading || (Boolean(weddingId) && currentAccess === null) || Boolean(needsPlan),
        reload,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  return useContext(WeddingContext);
}

export const canEdit = (level: AccessLevel) => level === 'edit';
export const canView = (level: AccessLevel) => level !== 'none';
