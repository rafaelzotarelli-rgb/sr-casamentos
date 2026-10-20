import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ERROR_MESSAGES, errorMessage } from './errors';

const migrationsDir = join(import.meta.dirname, '../../../supabase/migrations');

function codesRaisedInMigrations(): string[] {
  const codes = new Set<string>();
  for (const file of readdirSync(migrationsDir)) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    for (const match of sql.matchAll(/raise exception '([a-z_]+)'/g)) {
      if (match[1]) codes.add(match[1]);
    }
  }
  return [...codes];
}

describe('mensagens de erro', () => {
  it('todo código levantado pelo banco tem mensagem em português', () => {
    const missing = codesRaisedInMigrations().filter((code) => !(code in ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it('traduz erro do Supabase pelo campo message', () => {
    expect(errorMessage({ message: 'convite_expirado' })).toBe(
      'Este convite expirou. Peça um novo link.',
    );
  });

  it('usa mensagem genérica para erro desconhecido', () => {
    expect(errorMessage(new Error('boom'))).toBe('Algo deu errado. Tente novamente.');
    expect(errorMessage(null)).toBe('Algo deu errado. Tente novamente.');
  });
});
