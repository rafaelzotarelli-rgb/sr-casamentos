// Tabela central de capacidades por plano (briefing, seção 5).
// É a ÚNICA fonte das regras de plano: app, web e servidor leem daqui.
// A migration `plan_capabilities` replica estes valores no banco; o teste
// `plans.sync.test.ts` falha se os dois divergirem.

/** Valores em centavos de real. */
export type Cents = number;

export const COUPLE_PLAN_CODES = ['couple_free', 'couple_plus', 'couple_premium'] as const;
export type CouplePlanCode = (typeof COUPLE_PLAN_CODES)[number];

export const PLANNER_PLAN_CODES = [
  'planner_free',
  'planner_essencial',
  'planner_profissional',
  'planner_agencia',
] as const;
export type PlannerPlanCode = (typeof PLANNER_PLAN_CODES)[number];

export type PlanCode = CouplePlanCode | PlannerPlanCode;

export type WeddingSiteLevel = 'basic' | 'full';

export interface CouplePlan {
  code: CouplePlanCode;
  audience: 'couple';
  name: string;
  /** Pagamento único por casamento. */
  priceCents: Cents;
  weddingSite: WeddingSiteLevel;
  calendarSync: boolean;
  familyAccess: boolean;
  aiAssistant: boolean;
  aiContractAnalysis: boolean;
  whatsappRsvp: boolean;
  /** Franquia de mensagens de WhatsApp por casamento. */
  whatsappMessages: number;
  proactiveAi: boolean;
}

export interface PlannerPlan {
  code: PlannerPlanCode;
  audience: 'planner';
  name: string;
  /** Assinatura mensal. */
  monthlyPriceCents: Cents;
  /** `null` = ilimitado (com uso justo, ver `fairUse`). */
  maxActiveEvents: number | null;
  /** `null` = ilimitado. */
  maxVendors: number | null;
  /** `null` = ilimitado. */
  maxTeamLogins: number | null;
  eventDayAdvanced: boolean;
  aiForPlanner: boolean;
  /** Plano que os noivos dos casamentos deste assessor recebem incluído. */
  includedCouplePlan: CouplePlanCode;
  customBranding: boolean;
  fairUse: { activeEventsThreshold: number; extraEventMonthlyCents: Cents } | null;
}

export const COUPLE_PLANS: Record<CouplePlanCode, CouplePlan> = {
  couple_free: {
    code: 'couple_free',
    audience: 'couple',
    name: 'Free',
    priceCents: 0,
    weddingSite: 'basic',
    calendarSync: false,
    familyAccess: false,
    aiAssistant: false,
    aiContractAnalysis: false,
    whatsappRsvp: false,
    whatsappMessages: 0,
    proactiveAi: false,
  },
  couple_plus: {
    code: 'couple_plus',
    audience: 'couple',
    name: 'Plus',
    priceCents: 14_900,
    weddingSite: 'full',
    calendarSync: true,
    familyAccess: true,
    aiAssistant: true,
    aiContractAnalysis: true,
    whatsappRsvp: false,
    whatsappMessages: 0,
    proactiveAi: false,
  },
  couple_premium: {
    code: 'couple_premium',
    audience: 'couple',
    name: 'Premium',
    priceCents: 29_900,
    weddingSite: 'full',
    calendarSync: true,
    familyAccess: true,
    aiAssistant: true,
    aiContractAnalysis: true,
    whatsappRsvp: true,
    whatsappMessages: 1_000,
    proactiveAi: true,
  },
};

export const PLANNER_PLANS: Record<PlannerPlanCode, PlannerPlan> = {
  planner_free: {
    code: 'planner_free',
    audience: 'planner',
    name: 'Free',
    monthlyPriceCents: 0,
    maxActiveEvents: 5,
    maxVendors: 20,
    maxTeamLogins: 1,
    eventDayAdvanced: false,
    aiForPlanner: false,
    includedCouplePlan: 'couple_free',
    customBranding: false,
    fairUse: null,
  },
  planner_essencial: {
    code: 'planner_essencial',
    audience: 'planner',
    name: 'Essencial',
    monthlyPriceCents: 14_900,
    maxActiveEvents: 30,
    maxVendors: null,
    maxTeamLogins: 1,
    eventDayAdvanced: true,
    aiForPlanner: true,
    includedCouplePlan: 'couple_plus',
    customBranding: false,
    fairUse: null,
  },
  planner_profissional: {
    code: 'planner_profissional',
    audience: 'planner',
    name: 'Profissional',
    monthlyPriceCents: 29_900,
    maxActiveEvents: 40,
    maxVendors: null,
    maxTeamLogins: 3,
    eventDayAdvanced: true,
    aiForPlanner: true,
    includedCouplePlan: 'couple_premium',
    customBranding: true,
    fairUse: null,
  },
  planner_agencia: {
    code: 'planner_agencia',
    audience: 'planner',
    name: 'Agência',
    monthlyPriceCents: 59_900,
    maxActiveEvents: null,
    maxVendors: null,
    maxTeamLogins: null,
    eventDayAdvanced: true,
    aiForPlanner: true,
    includedCouplePlan: 'couple_premium',
    customBranding: true,
    fairUse: { activeEventsThreshold: 80, extraEventMonthlyCents: 800 },
  },
};

const COUPLE_PLAN_RANK: Record<CouplePlanCode, number> = {
  couple_free: 0,
  couple_plus: 1,
  couple_premium: 2,
};

/**
 * Plano efetivo dos noivos: o maior entre o plano comprado pelo casal e o
 * plano incluído pelo assessor (quando houver).
 */
export function effectiveCouplePlan(
  purchased: CouplePlanCode,
  plannerPlan: PlannerPlanCode | null,
): CouplePlan {
  const included = plannerPlan ? PLANNER_PLANS[plannerPlan].includedCouplePlan : 'couple_free';
  const best = COUPLE_PLAN_RANK[included] > COUPLE_PLAN_RANK[purchased] ? included : purchased;
  return COUPLE_PLANS[best];
}

/** Diferença a pagar num upgrade de plano dos noivos (nunca negativa). */
export function coupleUpgradePriceCents(from: CouplePlanCode, to: CouplePlanCode): Cents {
  return Math.max(0, COUPLE_PLANS[to].priceCents - COUPLE_PLANS[from].priceCents);
}

/**
 * Pode criar um novo evento? Ao atingir o limite, bloqueia apenas a criação;
 * o acesso aos eventos existentes nunca é bloqueado (briefing, seção 5).
 */
export function canCreateActiveEvent(plan: PlannerPlanCode, currentActiveEvents: number): boolean {
  const max = PLANNER_PLANS[plan].maxActiveEvents;
  return max === null || currentActiveEvents < max;
}

/** Custo mensal adicional por uso justo (plano Agência acima do limite). */
export function fairUseExtraMonthlyCents(plan: PlannerPlanCode, activeEvents: number): Cents {
  const fairUse = PLANNER_PLANS[plan].fairUse;
  if (!fairUse) return 0;
  return Math.max(0, activeEvents - fairUse.activeEventsThreshold) * fairUse.extraEventMonthlyCents;
}
