import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, KEY_BYTES, NONCE_BYTES } from './crypto-box';

const key = new Uint8Array(KEY_BYTES).fill(7);
const otherKey = new Uint8Array(KEY_BYTES).fill(8);
const nonce = new Uint8Array(NONCE_BYTES).fill(1);
const session = JSON.stringify({ access_token: 'abc', refresh_token: 'def', user: { id: '1' } });

describe('sessão criptografada', () => {
  it('criptografa e recupera o conteúdo', () => {
    const payload = encrypt(key, nonce, session);
    expect(payload).not.toContain('access_token');
    expect(decrypt(key, payload)).toBe(session);
  });

  it('não abre com outra chave', () => {
    expect(decrypt(otherKey, encrypt(key, nonce, session))).toBeNull();
  });

  it('detecta conteúdo alterado', () => {
    const payload = encrypt(key, nonce, session);
    const last = payload.at(-1) === '0' ? '1' : '0';
    expect(decrypt(key, payload.slice(0, -1) + last)).toBeNull();
  });

  it('rejeita lixo sem lançar erro', () => {
    expect(decrypt(key, 'não é hex')).toBeNull();
  });

  it('nonces diferentes geram resultados diferentes', () => {
    const other = new Uint8Array(NONCE_BYTES).fill(2);
    expect(encrypt(key, nonce, session)).not.toBe(encrypt(key, other, session));
  });
});
