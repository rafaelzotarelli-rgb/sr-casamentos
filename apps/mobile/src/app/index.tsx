import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Body, Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { hasCurrentConsent } from '@/lib/consent';
import { colors } from '@/lib/theme';
import { useMyWedding } from '@/lib/use-wedding';

/** Decide a tela inicial: login → consentimento → onboarding (sem casamento) → abas. */
export default function Index() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useMyWedding();
  const [consent, setConsent] = useState<boolean | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (userId) void hasCurrentConsent(userId).then(setConsent);
  }, [userId]);

  if (!session) return <Redirect href="/entrar" />;

  if (loading || consent === null) {
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
        <Button label="Tentar de novo" onPress={() => void reload()} />
      </Screen>
    );
  }

  if (!consent) return <Redirect href="/consentimento" />;
  return <Redirect href={data ? '/inicio' : '/onboarding'} />;
}
