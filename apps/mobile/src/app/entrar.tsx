import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { signInWithApple, signInWithGoogle, type SignInResult } from '@/lib/sign-in';
import { supabase } from '@/lib/supabase';
import { MIN_TOUCH_SIZE, radius } from '@/lib/theme';

export default function SignIn() {
  const { session } = useAuth();
  const { convite } = useLocalSearchParams<{ convite?: string }>();
  const [pending, setPending] = useState<'google' | 'apple' | 'password' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Logado: volta para o convite pendente (se veio de um link) ou para o início.
  if (session) return <Redirect href={convite ? `/convite/${convite}` : '/'} />;

  async function run(kind: 'google' | 'apple' | 'password', action: () => Promise<SignInResult>) {
    setPending(kind);
    setMessage(null);
    const result = await action();
    if (!result.ok) setMessage(result.message);
    setPending(null);
  }

  async function signInWithPassword(): Promise<SignInResult> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, message: 'E-mail ou senha inválidos.' } : { ok: true };
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <Title>Sr. Casamentos</Title>
        <Body muted>
          Planeje o casamento com calma: tarefas, orçamento, convidados e fornecedores.
        </Body>
        {convite ? (
          <Notice tone="positive">Entre para aceitar o convite que você recebeu.</Notice>
        ) : null}

        <Button
          label="Continuar com Google"
          variant="secondary"
          loading={pending === 'google'}
          disabled={pending !== null}
          onPress={() => void run('google', signInWithGoogle)}
        />
        {Platform.OS === 'ios' ? (
          // Botão oficial da Apple (exigência das diretrizes de interface).
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={{ height: MIN_TOUCH_SIZE + 4 }}
            onPress={() => void run('apple', signInWithApple)}
          />
        ) : null}

        {message ? <Notice tone="alert">{message}</Notice> : null}

        {showPassword ? (
          <View style={{ gap: 12 }}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <Button
              label="Entrar"
              loading={pending === 'password'}
              disabled={pending !== null}
              onPress={() => void run('password', signInWithPassword)}
            />
          </View>
        ) : (
          <Button
            label="Acesso de demonstração"
            variant="secondary"
            accessibilityHint="Para revisores e administradores"
            onPress={() => setShowPassword(true)}
          />
        )}
      </View>
    </Screen>
  );
}
