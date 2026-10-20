// Telefones (WhatsApp) com DDI. Guardados só com dígitos no formato
// internacional E.164 sem o "+": "5519991234567", "351912345678".

/** DDIs mais comuns, para o seletor. Outros: digitar "+DDI número". */
export const PHONE_COUNTRIES = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '1', label: 'EUA/Canadá (+1)' },
  { code: '54', label: 'Argentina (+54)' },
  { code: '598', label: 'Uruguai (+598)' },
  { code: '595', label: 'Paraguai (+595)' },
  { code: '56', label: 'Chile (+56)' },
  { code: '34', label: 'Espanha (+34)' },
  { code: '39', label: 'Itália (+39)' },
  { code: '33', label: 'França (+33)' },
  { code: '49', label: 'Alemanha (+49)' },
  { code: '44', label: 'Reino Unido (+44)' },
] as const;

/** Número brasileiro sem DDI (DDD + número) → "55…", ou null. */
function normalizeBrazil(local: string): string | null {
  if (local.length !== 10 && local.length !== 11) return null;
  const ddd = Number(local.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  // Celular (11 dígitos) começa com 9 depois do DDD.
  if (local.length === 11 && local[2] !== '9') return null;
  return `55${local}`;
}

/**
 * Aceita:
 * - número com "+": "+55 (19) 99123-4567", "+351 912 345 678";
 * - número sem "+" com o DDI escolhido no seletor (padrão Brasil): "(19) 99123-4567".
 * Retorna DDI + número só com dígitos, ou null se inválido.
 */
export function normalizePhone(input: string, countryCode = '55'): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  // Zero de discagem nacional (ex.: Portugal, Reino Unido) cai fora do formato
  // internacional. No Brasil não removemos: "(01) …" é DDD inválido, não "1…".
  const local = countryCode === '55' ? digits : digits.replace(/^0+/, '');
  const full = trimmed.startsWith('+') ? digits : `${countryCode}${local}`;
  // Número brasileiro: valida DDD e o 9 do celular.
  if (full.startsWith('55') && (full.length === 12 || full.length === 13)) {
    return normalizeBrazil(full.slice(2));
  }
  if (full.startsWith('55')) return null;
  // Demais países: E.164 tem de 8 a 15 dígitos e não começa com 0.
  return /^[1-9]\d{7,14}$/.test(full) ? full : null;
}

/** "5519991234567" → "+55 (19) 99123-4567"; outros países: "+351 912345678". */
export function formatPhone(normalized: string): string {
  if (normalized.startsWith('55') && (normalized.length === 12 || normalized.length === 13)) {
    const local = normalized.slice(2);
    const rest = local.slice(2);
    const split = rest.length === 9 ? 5 : 4;
    return `+55 (${local.slice(0, 2)}) ${rest.slice(0, split)}-${rest.slice(split)}`;
  }
  const country = PHONE_COUNTRIES.find((c) => normalized.startsWith(c.code));
  return country ? `+${country.code} ${normalized.slice(country.code.length)}` : `+${normalized}`;
}

/** Separa DDI e número para preencher o formulário de edição. */
export function splitPhone(normalized: string): { countryCode: string; number: string } {
  const country = [...PHONE_COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => normalized.startsWith(c.code));
  if (!country) return { countryCode: '', number: `+${normalized}` };
  return { countryCode: country.code, number: normalized.slice(country.code.length) };
}

/** Link do WhatsApp com mensagem pronta (abre o app de quem clica; não usa a API). */
export function whatsappLink(normalized: string, message: string): string {
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
