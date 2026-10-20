// Armazenamento da sessão do Supabase (briefing, seção 10; D07):
// a chave AES fica no Keychain/Keystore (expo-secure-store) e o conteúdo
// criptografado no AsyncStorage, que não tem limite de tamanho por item.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { decrypt, encrypt, fromHex, KEY_BYTES, NONCE_BYTES, toHex } from './crypto-box';

const keyName = (name: string) => `sr-key-${name.replace(/[^A-Za-z0-9._-]/g, '_')}`;

const secureOptions: SecureStore.SecureStoreOptions = {
  // Disponível após o primeiro desbloqueio; não vai para backups de outro aparelho.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

async function getOrCreateKey(name: string): Promise<Uint8Array> {
  const stored = await SecureStore.getItemAsync(keyName(name), secureOptions);
  if (stored) return fromHex(stored);
  const key = getRandomBytes(KEY_BYTES);
  await SecureStore.setItemAsync(keyName(name), toHex(key), secureOptions);
  return key;
}

export const encryptedStorage = {
  async getItem(name: string): Promise<string | null> {
    const payload = await AsyncStorage.getItem(name);
    if (!payload) return null;
    const keyHex = await SecureStore.getItemAsync(keyName(name), secureOptions);
    if (!keyHex) return null;
    const value = decrypt(fromHex(keyHex), payload);
    // Conteúdo ilegível (chave perdida, reinstalação): descarta e pede novo login.
    if (value === null) await AsyncStorage.removeItem(name);
    return value;
  },

  async setItem(name: string, value: string): Promise<void> {
    const key = await getOrCreateKey(name);
    await AsyncStorage.setItem(name, encrypt(key, getRandomBytes(NONCE_BYTES), value));
  },

  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(name);
    await SecureStore.deleteItemAsync(keyName(name), secureOptions);
  },
};
