import { onboardingSchema, plannerWeddingSchema, reaisToCents } from '@sr/shared';

/** Lê o FormData de WeddingFields; campos vazios viram `undefined`. */
function readForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === 'string' && value.trim() !== '' ? value : undefined;
  };
  const number = (name: string) => {
    const value = text(name);
    return value === undefined ? undefined : Number(value);
  };
  const budget = number('estimatedBudget');
  // DDI do seletor + número; se o número já vier com "+", ele manda.
  const phone = text('contactPhone');
  const country = text('contactPhoneCountry') ?? '55';
  const contactPhone =
    phone === undefined ? undefined : phone.trim().startsWith('+') ? phone : `+${country} ${phone}`;
  return {
    partner1Name: text('partner1Name') ?? '',
    partner2Name: text('partner2Name') ?? '',
    weddingDate: text('weddingDate') ?? null,
    venueName: text('venueName'),
    city: text('city'),
    estimatedGuests: number('estimatedGuests'),
    estimatedBudgetCents: budget === undefined ? undefined : reaisToCents(budget),
    style: text('style'),
    contactEmail: text('contactEmail'),
    contactPhone,
  };
}

const firstIssue = (issues: { message: string }[]) => issues[0]?.message ?? 'Dados inválidos.';

export function parsePlannerWedding(formData: FormData) {
  const result = plannerWeddingSchema.safeParse(readForm(formData));
  return result.success
    ? { ok: true as const, data: result.data }
    : { ok: false as const, error: firstIssue(result.error.issues) };
}

export function parseCoupleWedding(formData: FormData) {
  const { contactEmail: _e, contactPhone: _p, ...rest } = readForm(formData);
  const result = onboardingSchema.safeParse(rest);
  return result.success
    ? { ok: true as const, data: result.data }
    : { ok: false as const, error: firstIssue(result.error.issues) };
}
