// Login nativo com Google e Apple → sessão do Supabase via signInWithIdToken.
// Exige build de desenvolvimento (não funciona no Expo Go).
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export type SignInResult = { ok: true } | { ok: false; message: string | null };

const NOT_CONFIGURED = 'Este login ainda não foi configurado neste ambiente.';
const FAILED = 'Não foi possível entrar. Tente novamente.';

export async function signInWithGoogle(): Promise<SignInResult> {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return { ok: false, message: NOT_CONFIGURED };

  try {
    // Import dinâmico: o módulo nativo não existe no Expo Go.
    const { GoogleSignin, isSuccessResponse } =
      await import('@react-native-google-signin/google-signin');
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    GoogleSignin.configure({ webClientId, ...(iosClientId ? { iosClientId } : {}) });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { ok: false, message: null }; // cancelado
    const idToken = response.data.idToken;
    if (!idToken) return { ok: false, message: FAILED };

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    return error ? { ok: false, message: FAILED } : { ok: true };
  } catch {
    return { ok: false, message: FAILED };
  }
}

export async function signInWithApple(): Promise<SignInResult> {
  try {
    // O Supabase confere o nonce: a Apple recebe o hash, o Supabase o valor original.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return { ok: false, message: FAILED };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) return { ok: false, message: FAILED };

    // A Apple só envia o nome no primeiro login: guardamos já.
    const name = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    if (name && data.user) {
      await supabase.from('profiles').update({ full_name: name }).eq('id', data.user.id);
    }
    return { ok: true };
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, message: null };
    }
    return { ok: false, message: FAILED };
  }
}
