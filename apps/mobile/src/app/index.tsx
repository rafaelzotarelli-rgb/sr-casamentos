import { Redirect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Body, Button, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { hasCurrentConsent } from '@/lib/consent';
import { supabase } from '@/lib/supabase';
import { colors, siteUrl } from '@/lib/theme';
import { useMyWedding } from '@/lib/use-wedding';

/**
 * Decide a tela inicial: login → consentimento → abas (tem casamento) →
 * aviso do painel (conta de assessoria, D24/D26) → onboarding dos noivos.
 */
export default function Index() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useMyWedding();
  const [state, setState] = useState<{
    userId: string;
    consent: boolean;
    isAgency: boolean;
  } | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.all([
      hasCurrentConsent(userId),
      supabase.from('agency_members').select('agency_id').eq('user_id', userId).limit(1),
    ]).then(([consent, { data: agencies }]) => {
      if (active) setState({ userId, consent, isAgency: Boolean(agencies?.length) });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (!session) return <Redirect href="/entrar" />;

  if (loading || !state || state.userId !== userId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando" />
      </View>
    );
  }

  if (error) {
    return (
      <Screen>
        <Body>Não foi possível carregar seus dados. Verifique a conexão.</Body>
        <Button label="Tentar de novo" onPress={() => reload()} />
      </Screen>
    );
  }

  if (!state.consent) return <Redirect href="/consentimento" />;
  if (data) return <Redirect href="/inicio" />;

  if (state.isAgency) {
    return (
      <Screen>
        <Title>Conta da assessoria</Title>
        <Body>
          Você entrou com a conta de uma assessoria. A gestão dos casamentos fica no painel do
          assessor, no navegador. O modo &quot;Dia do evento&quot; do app chega em breve.
        </Body>
        <Button label="Abrir o painel" onPress={() => void Linking.openURL(`${siteUrl}/painel`)} />
        <Button
          label="Sair"
          variant="secondary"
          onPress={() => void supabase.auth.signOut({ scope: 'local' })}
        />
      </Screen>
    );
  }

  return <Redirect href="/onboarding" />;
}
