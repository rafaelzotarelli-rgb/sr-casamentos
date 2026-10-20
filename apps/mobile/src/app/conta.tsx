import { ACCOUNT_DELETION_GRACE_DAYS, errorMessage } from '@sr/shared';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Notice, Screen, Subtitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { siteUrl } from '@/lib/theme';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export default function Account() {
  const { session } = useAuth();
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDeletion = useCallback(async () => {
    const { data } = await supabase
      .from('account_deletion_requests')
      .select('scheduled_for')
      .maybeSingle();
    return data?.scheduled_for ?? null;
  }, []);

  useEffect(() => {
    let active = true;
    void loadDeletion().then((value) => {
      if (active) setScheduledFor(value);
    });
    return () => {
      active = false;
    };
  }, [loadDeletion]);

  async function signOut(scope: 'local' | 'global') {
    await supabase.auth.signOut({ scope });
    router.replace('/entrar');
  }

  async function rpc(name: 'request_account_deletion' | 'cancel_account_deletion') {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc(name);
    setBusy(false);
    if (rpcError) setError(errorMessage(rpcError));
    setScheduledFor(await loadDeletion());
  }

  function confirmDeletion() {
    Alert.alert(
      'Excluir sua conta?',
      `A exclusão acontece em ${ACCOUNT_DELETION_GRACE_DAYS} dias. Até lá você pode cancelar aqui. ` +
        'Se o casamento tiver outra conta de noivos, ele continua com essa pessoa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () => void rpc('request_account_deletion'),
        },
      ],
    );
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Conta</Subtitle>
        <Body>{session?.user.email}</Body>
      </Card>

      <Card>
        <Subtitle>Sessões</Subtitle>
        <Button label="Sair" variant="secondary" onPress={() => void signOut('local')} />
        <Button
          label="Sair de todos os aparelhos"
          variant="secondary"
          accessibilityHint="Encerra a sessão em todos os celulares e computadores"
          onPress={() => void signOut('global')}
        />
      </Card>

      <Card>
        <Subtitle>Privacidade</Subtitle>
        <Button
          label="Política de Privacidade"
          variant="secondary"
          onPress={() => void Linking.openURL(`${siteUrl}/privacidade`)}
        />
        {scheduledFor ? (
          <>
            <Notice tone="alert">
              Sua conta será excluída em {dateFormat.format(new Date(scheduledFor))}.
            </Notice>
            <Button
              label="Cancelar a exclusão"
              loading={busy}
              onPress={() => void rpc('cancel_account_deletion')}
            />
          </>
        ) : (
          <Button
            label="Excluir minha conta"
            variant="danger"
            loading={busy}
            onPress={confirmDeletion}
          />
        )}
        {error ? <Notice tone="alert">{error}</Notice> : null}
      </Card>
    </Screen>
  );
}
