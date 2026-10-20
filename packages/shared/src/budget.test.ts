import { describe, expect, it } from 'vitest';
import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_KEYS,
  categoryStatus,
  costPerGuestCents,
  simulateGuests,
  suggestBudget,
} from './budget';
import { WEDDING_STYLES } from './schemas';

describe('calculadora orçamentária', () => {
  it('as participações padrão somam 100%', () => {
    const total = BUDGET_CATEGORY_KEYS.reduce((s, k) => s + BUDGET_CATEGORIES[k].shareBps, 0);
    expect(total).toBe(10_000);
  });

  it.each([...WEDDING_STYLES, null])('a sugestão soma exatamente o total (estilo %s)', (style) => {
    const lines = suggestBudget(8_000_037, style);
    expect(lines.reduce((s, l) => s + l.plannedCents, 0)).toBe(8_000_037);
    expect(lines.every((l) => l.plannedCents >= 0)).toBe(true);
  });

  it('cobre as 11 categorias do briefing', () => {
    expect(suggestBudget(100_000_00, null).map((l) => l.label)).toEqual([
      'Local',
      'Buffet',
      'Bebidas',
      'Decoração',
      'Foto e vídeo',
      'Música',
      'Vestido e traje',
      'Convites',
      'Lembrancinhas',
      'Lua de mel',
      'Reserva para imprevistos',
    ]);
  });

  it('casamento na praia gasta menos com decoração', () => {
    const classic = suggestBudget(100_000_00, 'classico');
    const beach = suggestBudget(100_000_00, 'praia');
    const deco = (lines: typeof classic) => lines.find((l) => l.key === 'decoracao')?.plannedCents;
    expect(deco(beach)).toBeLessThan(deco(classic) ?? 0);
  });

  it('calcula o custo por convidado', () => {
    expect(costPerGuestCents(80_000_00, 160)).toBe(500_00);
    expect(costPerGuestCents(80_000_00, 0)).toBe(0);
  });

  it('simula mais convidados aumentando só o que depende deles', () => {
    const lines = suggestBudget(100_000_00, 'classico');
    const { lines: simulated, totalCents } = simulateGuests(lines, 100, 150);
    const get = (key: string) => simulated.find((l) => l.key === key)?.plannedCents;
    expect(get('buffet')).toBe(42_000_00); // 28.000 × 1,5
    expect(get('local')).toBe(12_000_00); // não muda
    expect(totalCents).toBeGreaterThan(100_000_00);
  });

  it('mostra a pagar e o estouro da categoria', () => {
    expect(
      categoryStatus({ plannedCents: 10_000_00, contractedCents: 12_000_00, paidCents: 4_000_00 }),
    ).toEqual({ toPayCents: 8_000_00, overBudgetCents: 2_000_00 });
  });
});
