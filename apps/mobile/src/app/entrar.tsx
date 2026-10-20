import * as AppleAuthentication from 'expo-apple-authentication';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Body, Button, Notice, Screen, TextField, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  sendEmailCode,
  signInWithApple,
  signInWithGoogle,
  signInWithPassword,
  type SignInResult,
  verifyEmailCode,
} from '@/lib/sign-in';
import { MIN_TOUCH_SIZE, radius } from '@/lib/theme';

type Pending = 'google' | 'apple' | 'email' | 'code' | 'password' | null;

export default function SignIn() {
  const { session } = useAuth();
  const { convite } = useLocalSearchParams<{ convite?: string }>();
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'options' | 'email' | 'code' | 'password'>('options');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  // Logado: volta para o convite pendente (se veio de um link) ou para o início.
  if (session) return <Redirect href={convite ? `/convite/${convite}` : '/'} />;

  async function run(kind: Pending, action: () => Promise<SignInResult>, onOk?: () => void) {
    setPending(kind);
    setMessage(null);
    const result = await action();
    setPending(null);
    if (result.ok) onOk?.();
    else setMessage(result.message);
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

        {mode === 'options' ? (
          <>
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
            <Button
              label="Entrar com e-mail"
              variant="secondary"
              onPress={() => setMode('email')}
            />
          </>
        ) : null}

        {mode === 'email' ? (
          <View style={{ gap: 12 }}>
            <TextField
              label="Seu e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Body muted>Vamos enviar um código de 6 dígitos para confirmar o seu e-mail.</Body>
            <Button
              label="Receber código"
              loading={pending === 'email'}
              disabled={pending !== null}
              onPress={() =>
                void run(
                  'email',
                  () => sendEmailCode(email),
                  () => setMode('code'),
                )
              }
            />
          </View>
        ) : null}

        {mode === 'code' ? (
          <View style={{ gap: 12 }}>
            <Notice tone="positive">Enviamos um código para {email.trim()}.</Notice>
            <TextField
              label="Código de 6 dígitos"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
            <Button
              label="Confirmar e entrar"
              loading={pending === 'code'}
              disabled={pending !== null || code.length !== 6}
              onPress={() => void run('code', () => verifyEmailCode(email, code))}
            />
            <Button
              label="Enviar outro código"
              variant="secondary"
              disabled={pending !== null}
              onPress={() => void run('email', () => sendEmailCode(email))}
            />
          </View>
        ) : null}

        {mode === 'password' ? (
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
              onPress={() => void run('password', () => signInWithPassword(email, password))}
            />
          </View>
        ) : null}

        {message ? <Notice tone="alert">{message}</Notice> : null}

        {mode === 'options' ? (
          <Button
            label="Acesso de demonstração"
            variant="secondary"
            accessibilityHint="Para revisores das lojas e administradores"
            onPress={() => setMode('password')}
          />
        ) : (
          <Button
            label="Voltar"
            variant="secondary"
            onPress={() => {
              setMode('options');
              setMessage(null);
            }}
          />
        )}
      </View>
    </Screen>
  );
}
