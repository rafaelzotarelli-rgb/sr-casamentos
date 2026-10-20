import { describe, expect, it } from 'vitest';
import { formatBRL, parseBrMoney, reaisToCents } from './money';

describe('valor digitado em reais', () => {
  it.each([
    ['65.500,00', 6_550_000],
    ['65500,5', 6_550_050],
    ['R$ 1.234', 123_400],
    ['65.500', 6_550_000],
    ['80000.5', 8_000_050],
    ['80000', 8_000_000],
  ])('%s → %i centavos', (input, cents) => {
    expect(parseBrMoney(input)).toBe(cents);
  });

  it.each(['', 'abc', '1,2,3', '10,999', '-5'])('rejeita "%s"', (input) => {
    expect(parseBrMoney(input)).toBeNull();
  });
});
import { inviteTokenSchema, onboardingSchema } from './schemas';

const valid = {
  partner1Name: 'Ana',
  partner2Name: 'Pedro',
  weddingDate: '2027-05-15',
  city: 'Campinas',
  estimatedGuests: 150,
  estimatedBudgetCents: 8_000_000,
  style: 'classico',
} as const;

describe('onboarding', () => {
  it('aceita dados válidos', () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true);
  });

  it('aceita "ainda não definimos" a data', () => {
    expect(onboardingSchema.safeParse({ ...valid, weddingDate: null }).success).toBe(true);
  });

  it('rejeita data inexistente', () => {
    expect(onboardingSchema.safeParse({ ...valid, weddingDate: '2027-02-30' }).success).toBe(false);
  });

  it('rejeita convidados zero ou fracionados', () => {
    expect(onboardingSchema.safeParse({ ...valid, estimatedGuests: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, estimatedGuests: 10.5 }).success).toBe(false);
  });

  it('rejeita orçamento negativo e estilo desconhecido', () => {
    expect(onboardingSchema.safeParse({ ...valid, estimatedBudgetCents: -1 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...valid, style: 'gótico' }).success).toBe(false);
  });

  it('remove espaços dos nomes', () => {
    const parsed = onboardingSchema.parse({ ...valid, partner1Name: '  Ana  ' });
    expect(parsed.partner1Name).toBe('Ana');
  });
});

describe('token de convite', () => {
  it('aceita 43 caracteres base64url', () => {
    expect(inviteTokenSchema.safeParse('a'.repeat(43)).success).toBe(true);
  });

  it('rejeita tamanho errado ou caracteres inválidos', () => {
    expect(inviteTokenSchema.safeParse('a'.repeat(42)).success).toBe(false);
    expect(inviteTokenSchema.safeParse(`${'a'.repeat(42)}=`).success).toBe(false);
  });
});

describe('dinheiro', () => {
  it('formata em reais', () => {
    expect(formatBRL(14_900)).toBe('R$ 149,00');
    expect(formatBRL(123_456_78)).toBe('R$ 123.456,78');
  });

  it('converte reais em centavos sem erro de arredondamento', () => {
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
    expect(reaisToCents(149.9)).toBe(14_990);
  });
});
