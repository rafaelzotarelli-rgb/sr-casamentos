// Schemas zod usados no cliente (formulários) e no servidor (Edge Functions).
import { z } from 'zod';
import { normalizePhone } from './phone';

export const WEDDING_STYLES = [
  'classico',
  'rustico',
  'praia',
  'minimalista',
  'boho',
  'moderno',
  'outro',
] as const;
export type WeddingStyle = (typeof WEDDING_STYLES)[number];

export const WEDDING_STYLE_LABELS: Record<WeddingStyle, string> = {
  classico: 'Clássico',
  rustico: 'Rústico',
  praia: 'Praia',
  minimalista: 'Minimalista',
  boho: 'Boho',
  moderno: 'Moderno',
  outro: 'Outro',
};

const personName = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 letras.')
  .max(60, 'Use no máximo 60 caracteres.');

/** Data `YYYY-MM-DD` válida no calendário. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Data inválida.');

/** Onboarding dos noivos (briefing, 2.1). `weddingDate: null` = "ainda não definimos". */
export const onboardingSchema = z.object({
  partner1Name: personName,
  partner2Name: personName,
  weddingDate: isoDate.nullable(),
  city: z.string().trim().min(2, 'Informe a cidade.').max(80),
  estimatedGuests: z
    .number({ error: 'Informe um número.' })
    .int('Use um número inteiro.')
    .min(1, 'Pelo menos 1 convidado.')
    .max(5_000, 'Máximo de 5.000 convidados.'),
  /** Em centavos. */
  estimatedBudgetCents: z
    .number({ error: 'Informe um valor.' })
    .int()
    .min(0, 'O orçamento não pode ser negativo.')
    .max(100_000_000_00, 'Valor muito alto.'),
  style: z.enum(WEDDING_STYLES),
  /** Local da cerimônia/festa, ex.: "Fazenda Serra dos Cocais". Opcional. */
  venueName: z
    .string()
    .trim()
    .min(2, 'Informe pelo menos 2 letras.')
    .max(120, 'Use no máximo 120 caracteres.')
    .optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * WhatsApp com DDI: "+55 (19) 99123-4567", "+351 912 345 678" ou, sem "+",
 * número brasileiro com DDD. Resultado: DDI + número só com dígitos.
 */
export const phoneSchema = z.string().transform((value, ctx) => {
  const normalized = normalizePhone(value);
  if (!normalized) {
    ctx.addIssue({
      code: 'custom',
      message: 'WhatsApp inválido. Confira o DDI e o número (no Brasil, com DDD).',
    });
    return z.NEVER;
  }
  return normalized;
});

/**
 * Casamento criado pelo assessor: os mesmos campos, com cidade e orçamento
 * opcionais, mais o contato de um dos noivos (para enviar o convite).
 */
export const plannerWeddingSchema = onboardingSchema.extend({
  city: onboardingSchema.shape.city.optional(),
  estimatedGuests: onboardingSchema.shape.estimatedGuests.optional(),
  estimatedBudgetCents: onboardingSchema.shape.estimatedBudgetCents.optional(),
  style: onboardingSchema.shape.style.optional(),
  contactEmail: z.email('E-mail inválido.').max(254).toLowerCase().optional(),
  contactPhone: phoneSchema.optional(),
});
export type PlannerWeddingInput = z.infer<typeof plannerWeddingSchema>;

export const INVITE_KINDS = ['couple', 'partner', 'staff'] as const;
export type InviteKind = (typeof INVITE_KINDS)[number];

/** Token de convite: 32 bytes em base64url (43 caracteres). */
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Convite inválido.');

/** Prazo de validade padrão dos convites. */
export const INVITE_TTL_DAYS = 7;

/**
 * Versão dos Termos de Uso e da Política de Privacidade aceita no cadastro.
 * Mude ao publicar uma versão nova: o consentimento é registrado por versão.
 */
export const LEGAL_DOCS_VERSION = '2026-10-rascunho';

/** Carência antes da exclusão definitiva da conta (docs/decisoes.md, D09). */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;
