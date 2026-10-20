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

/** Dias inteiros entre hoje (São Paulo) e a data do casamento; negativo se passou. */
export function daysUntil(weddingDate: string, now: Date = new Date()): number {
  const today = Date.parse(`${todayInSaoPaulo(now)}T00:00:00Z`);
  const target = Date.parse(`${weddingDate}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}
