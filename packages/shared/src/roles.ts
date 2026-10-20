// Papéis e permissões (briefing, seções 1, 2.12 e 9).

/** Vínculo usuário ↔ casamento. */
export const WEDDING_ROLES = ['couple', 'family'] as const;
export type WeddingRole = (typeof WEDDING_ROLES)[number];

/** Vínculo usuário ↔ assessoria. */
export const AGENCY_ROLES = ['owner', 'staff'] as const;
export type AgencyRole = (typeof AGENCY_ROLES)[number];

/** Máximo de contas de noivos por casamento. */
export const MAX_COUPLE_ACCOUNTS = 2;

/**
 * Módulos do casamento sobre os quais o assessor define o que os noivos
 * veem e editam. Usado também para o acesso limitado da família (Etapa 2).
 */
export const WEDDING_MODULES = [
  'tasks',
  'budget',
  'payments',
  'vendors',
  'contracts',
  'guests',
  'tables',
  'site',
] as const;
export type WeddingModule = (typeof WEDDING_MODULES)[number];

export type AccessLevel = 'none' | 'view' | 'edit';

export const WEDDING_MODULE_LABELS: Record<WeddingModule, string> = {
  tasks: 'Tarefas',
  budget: 'Orçamento',
  payments: 'Pagamentos',
  vendors: 'Fornecedores',
  contracts: 'Contratos',
  guests: 'Convidados',
  tables: 'Mesas',
  site: 'Site do casamento',
};

/** Sem assessor, ou quando o assessor não restringiu nada, os noivos editam tudo. */
export const DEFAULT_COUPLE_ACCESS: Record<WeddingModule, AccessLevel> = {
  tasks: 'edit',
  budget: 'edit',
  payments: 'edit',
  vendors: 'edit',
  contracts: 'edit',
  guests: 'edit',
  tables: 'edit',
  site: 'edit',
};

export function canView(level: AccessLevel): boolean {
  return level !== 'none';
}

export function canEdit(level: AccessLevel): boolean {
  return level === 'edit';
}
