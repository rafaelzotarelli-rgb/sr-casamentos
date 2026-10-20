import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Body, Button, Notice, Screen, styles, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { recordConsent } from '@/lib/consent';
import { colors, siteUrl } from '@/lib/theme';

export default function Consent() {
  const { session } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    if (!session) return;
    setSaving(true);
    setFailed(false);
    const ok = await recordConsent(session.user.id);
    setSaving(false);
    if (ok) router.replace('/');
    else setFailed(true);
  }

  return (
    <Screen>
      <Title>Antes de começar</Title>
      <Body>
        Usamos seus dados para organizar o seu casamento: nomes, data, orçamento, fornecedores e a
        lista de convidados. Os dados dos seus convidados são usados só para os convites e a
        confirmação de presença.
      </Body>
      <Body muted>
        Não vendemos dados e não usamos rastreamento de anúncios. Você pode excluir sua conta a
        qualquer momento em Minha conta.
      </Body>
      <View style={{ gap: 8 }}>
        <Link label="Ler os Termos de Uso" url={`${siteUrl}/termos`} />
        <Link label="Ler a Política de Privacidade" url={`${siteUrl}/privacidade`} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Switch
          value={accepted}
          onValueChange={setAccepted}
          accessibilityLabel="Li e aceito os Termos de Uso e a Política de Privacidade"
          trackColor={{ true: colors.primary, false: colors.border }}
        />
        <Text style={[styles.body, { flex: 1 }]}>
          Li e aceito os Termos de Uso e a Política de Privacidade
        </Text>
      </View>
      {failed ? <Notice tone="alert">Não foi possível salvar. Tente novamente.</Notice> : null}
      <Button
        label="Continuar"
        disabled={!accepted}
        loading={saving}
        onPress={() => void confirm()}
      />
    </Screen>
  );
}

function Link({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(url)}
      style={{ minHeight: 44, justifyContent: 'center' }}
    >
      <Text style={[styles.body, { color: colors.primary, textDecorationLine: 'underline' }]}>
        {label}
      </Text>
    </Pressable>
  );
}
