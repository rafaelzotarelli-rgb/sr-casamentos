import type { Cents } from './plans';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos como reais: 14900 → "R$ 149,00". */
export function formatBRL(cents: Cents): string {
  // Intl usa espaço não separável entre "R$" e o número; normalizamos para espaço comum.
  return brl.format(cents / 100).replace(/\s/g, ' ');
}

/** Converte reais (número digitado) em centavos inteiros, sem erro de ponto flutuante. */
export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100);
}
