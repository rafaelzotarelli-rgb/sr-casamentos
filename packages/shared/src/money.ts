import type { Cents } from './plans';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos como reais: 14900 → "R$ 149,00". */
export function formatBRL(cents: Cents): string {
  // Intl usa espaço não separável entre "R$" e o número; normalizamos para espaço comum.
  return brl.format(cents / 100).replace(/\s/g, ' ');
}

/**
 * Valor digitado → centavos. Aceita "65.500,00", "65500,5", "R$ 1.234", "65.500" (milhar)
 * e "80000.5" (ponto decimal). Retorna null se não for um valor válido.
 */
export function parseBrMoney(input: string): Cents | null {
  const s = input.trim().replace(/^R\$/, '').replace(/\s/g, '');
  if (!s) return null;
  let normalized = s;
  if (s.includes(',')) normalized = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) normalized = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return reaisToCents(Number(normalized));
}

/** Converte reais (número digitado) em centavos inteiros, sem erro de ponto flutuante. */
export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100);
}
