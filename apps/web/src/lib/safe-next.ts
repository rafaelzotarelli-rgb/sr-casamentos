/**
 * Destino pós-login seguro: só caminhos internos. Evita "open redirect"
 * (ex.: ?next=https://site-malicioso.com ou ?next=//site-malicioso.com).
 */
export function safeNext(next: string | null | undefined, fallback = '/inicio'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return fallback;
  }
  return next;
}
