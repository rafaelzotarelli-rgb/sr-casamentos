// Datas do produto: guardadas como `YYYY-MM-DD` (data do casamento) ou UTC,
// e interpretadas sempre no fuso de São Paulo (docs/decisoes.md, D12).

export const APP_TIME_ZONE = 'America/Sao_Paulo';

/** Data de hoje (`YYYY-MM-DD`) no fuso de São Paulo. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // 'en-CA' formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * "Evento ativo" = casamento cuja data ainda não passou. Casamentos sem data
 * definida contam como ativos. O dia do casamento ainda conta como ativo.
 */
export function isActiveEvent(weddingDate: string | null, now: Date = new Date()): boolean {
  if (weddingDate === null) return true;
  return weddingDate >= todayInSaoPaulo(now);
}

/** "15/05/2027" → "2027-05-15". Retorna null se a data não existe no calendário. */
export function parseBrDate(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : null;
}

/** Digitação com máscara: "1505202" → "15/05/202". */
export function maskBrDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

/** Dias inteiros entre hoje (São Paulo) e a data do casamento; negativo se passou. */
export function daysUntil(weddingDate: string, now: Date = new Date()): number {
  const today = Date.parse(`${todayInSaoPaulo(now)}T00:00:00Z`);
  const target = Date.parse(`${weddingDate}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}
