// AES-256-GCM para a sessão guardada no aparelho (docs/decisoes.md, D07).
// Funções puras: a chave e o nonce vêm de fora, o que permite testar sem o aparelho.
import { gcm } from '@noble/ciphers/aes.js';

export const KEY_BYTES = 32;
export const NONCE_BYTES = 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error('hex inválido');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** Retorna `nonce || ciphertext` em hex. Use um nonce novo e aleatório a cada chamada. */
export function encrypt(key: Uint8Array, nonce: Uint8Array, plaintext: string): string {
  if (key.length !== KEY_BYTES || nonce.length !== NONCE_BYTES) throw new Error('chave/nonce');
  const ciphertext = gcm(key, nonce).encrypt(encoder.encode(plaintext));
  return toHex(nonce) + toHex(ciphertext);
}

/** Retorna o texto, ou `null` se o conteúdo foi alterado ou a chave é outra. */
export function decrypt(key: Uint8Array, payload: string): string | null {
  try {
    const bytes = fromHex(payload);
    const nonce = bytes.slice(0, NONCE_BYTES);
    const ciphertext = bytes.slice(NONCE_BYTES);
    return decoder.decode(gcm(key, nonce).decrypt(ciphertext));
  } catch {
    return null;
  }
}
