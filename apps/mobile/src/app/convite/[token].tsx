import type { AcceptInviteResult } from '@sr/db';
import { errorMessage, inviteTokenSchema } from '@sr/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Notice, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { siteUrl } from '@/lib/theme';

/** Abre por deep link: srcasamentos://convite/<token> (ou colando o link). */
export default function AcceptInvite() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState(false);

  const valid = inviteTokenSchema.safeParse(token).success;
  if (!session) return <Redirect href={{ pathname: '/entrar', params: { convite: token } }} />;

  async function accept() {
    setPending(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('accept_invite', { p_token: token });
    setPending(false);
    if (rpcError) return setError(errorMessage(rpcError));
    const result = data as AcceptInviteResult;
    if (!result.ok) return setError(errorMessage(result.error));
    // Equipe do assessor usa o painel web (D24); noivos seguem para o app.
    if (result.kind === 'staff') return setJoinedTeam(true);
    router.replace('/');
  }

  if (joinedTeam) {
    return (
      <Screen>
        <Title>Você entrou na equipe</Title>
        <Notice tone="positive">
          Acesse o painel do assessor pelo computador em {siteUrl}/painel com esta mesma conta.
        </Notice>
        <Button label="Ok" onPress={() => router.replace('/conta')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Você recebeu um convite</Title>
      {valid ? (
        <>
          <Body>
            Ao aceitar, sua conta ({session.user.email}) será vinculada ao casamento de quem enviou
            o link.
          </Body>
          {error ? <Notice tone="alert">{error}</Notice> : null}
          <Button label="Aceitar convite" loading={pending} onPress={() => void accept()} />
        </>
      ) : (
        <Notice tone="alert">
          Este link de convite não é válido. Confira se ele veio inteiro.
        </Notice>
      )}
      <Button label="Agora não" variant="secondary" onPress={() => router.replace('/')} />
    </Screen>
  );
}
