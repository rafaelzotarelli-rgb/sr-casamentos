// Calculadora orçamentária (briefing, 2.4). Valores em centavos; percentuais em
// pontos-base (1% = 100) para não ter erro de arredondamento.
import type { Cents } from './plans';
import type { WeddingStyle } from './schemas';

export const BUDGET_CATEGORY_KEYS = [
  'local',
  'buffet',
  'bebidas',
  'decoracao',
  'foto_video',
  'musica',
  'vestido_traje',
  'convites',
  'lembrancinhas',
  'lua_de_mel',
  'reserva',
] as const;
export type BudgetCategoryKey = (typeof BUDGET_CATEGORY_KEYS)[number];

interface CategoryInfo {
  label: string;
  /** Participação padrão no total, em pontos-base (soma = 10.000). */
  shareBps: number;
  /** O custo cresce com o número de convidados (entra na simulação de cenários). */
  perGuest: boolean;
}

export const BUDGET_CATEGORIES: Record<BudgetCategoryKey, CategoryInfo> = {
  local: { label: 'Local', shareBps: 1_200, perGuest: false },
  buffet: { label: 'Buffet', shareBps: 2_800, perGuest: true },
  bebidas: { label: 'Bebidas', shareBps: 800, perGuest: true },
  decoracao: { label: 'Decoração', shareBps: 1_200, perGuest: false },
  foto_video: { label: 'Foto e vídeo', shareBps: 1_000, perGuest: false },
  musica: { label: 'Música', shareBps: 600, perGuest: false },
  vestido_traje: { label: 'Vestido e traje', shareBps: 700, perGuest: false },
  convites: { label: 'Convites', shareBps: 200, perGuest: true },
  lembrancinhas: { label: 'Lembrancinhas', shareBps: 200, perGuest: true },
  lua_de_mel: { label: 'Lua de mel', shareBps: 800, perGuest: false },
  reserva: { label: 'Reserva para imprevistos', shareBps: 500, perGuest: false },
};

/** Ajustes por estilo (cada linha soma zero). */
const STYLE_ADJUSTMENTS: Partial<Record<WeddingStyle, Partial<Record<BudgetCategoryKey, number>>>> =
  {
    praia: { decoracao: -200, local: 100, bebidas: 100 },
    rustico: { decoracao: 100, local: -100 },
    minimalista: { decoracao: -300, foto_video: 100, lua_de_mel: 200 },
    boho: { decoracao: 100, convites: -100 },
    moderno: { musica: 100, convites: -100 },
  };

export interface BudgetLine {
  key: BudgetCategoryKey;
  label: string;
  plannedCents: Cents;
}

/** Distribuição sugerida do total por categoria. A soma é sempre exatamente o total. */
export function suggestBudget(totalCents: Cents, style: WeddingStyle | null): BudgetLine[] {
  const adjustments = (style && STYLE_ADJUSTMENTS[style]) ?? {};
  const lines = BUDGET_CATEGORY_KEYS.map((key) => {
    const bps = BUDGET_CATEGORIES[key].shareBps + (adjustments[key] ?? 0);
    return {
      key,
      label: BUDGET_CATEGORIES[key].label,
      plannedCents: Math.floor((totalCents * bps) / 10_000),
    };
  });
  // Centavos que sobram do arredondamento vão para a reserva.
  const rest = totalCents - lines.reduce((sum, l) => sum + l.plannedCents, 0);
  const reserve = lines.find((l) => l.key === 'reserva');
  if (reserve) reserve.plannedCents += rest;
  return lines;
}

export function costPerGuestCents(totalCents: Cents, guests: number): Cents {
  return guests > 0 ? Math.round(totalCents / guests) : 0;
}

/**
 * "E se forem N convidados?": categorias por convidado crescem na proporção;
 * as demais não mudam.
 */
export function simulateGuests(
  lines: { key: string; plannedCents: Cents }[],
  currentGuests: number,
  newGuests: number,
): { lines: { key: string; plannedCents: Cents }[]; totalCents: Cents } {
  const factor = currentGuests > 0 ? newGuests / currentGuests : 1;
  const simulated = lines.map((line) => ({
    key: line.key,
    plannedCents:
      BUDGET_CATEGORIES[line.key as BudgetCategoryKey]?.perGuest === true
        ? Math.round(line.plannedCents * factor)
        : line.plannedCents,
  }));
  return { lines: simulated, totalCents: simulated.reduce((s, l) => s + l.plannedCents, 0) };
}

export interface CategoryTotals {
  plannedCents: Cents;
  contractedCents: Cents;
  paidCents: Cents;
}

/** Resumo de uma categoria: a pagar e quanto passou do previsto. */
export function categoryStatus({ plannedCents, contractedCents, paidCents }: CategoryTotals) {
  return {
    toPayCents: Math.max(0, contractedCents - paidCents),
    overBudgetCents: Math.max(0, contractedCents - plannedCents),
  };
}
