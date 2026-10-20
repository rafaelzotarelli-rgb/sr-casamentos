import {
  daysUntil,
  errorMessage,
  formatBRL,
  WEDDING_STYLE_LABELS,
  type WeddingStyle,
} from '@sr/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Share } from 'react-native';
import { Body, Button, Card, Notice, Screen, Subtitle, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, siteUrl } from '@/lib/theme';
import { useMyWedding } from '@/lib/use-wedding';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function Home() {
  const { data, loading, reload } = useMyWedding();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  if (loading && !data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando" />
      </Screen>
    );
  }
  if (!data) return null;

  const { wedding, agencyName, coupleAccounts, role } = data;
  const days = wedding.wedding_date ? daysUntil(wedding.wedding_date) : null;

  async function invitePartner() {
    setInviting(true);
    setInviteError(null);
    const { data: token, error } = await supabase.rpc('create_invite', {
      p_kind: 'partner',
      p_wedding_id: wedding.id,
    });
    setInviting(false);
    if (error || !token) return setInviteError(errorMessage(error));
    await Share.share({
      message: `Vamos planejar nosso casamento juntos no Sr. Casamentos: ${siteUrl}/convite/${token}`,
    });
  }

  return (
    <Screen>
      <Title>
        {wedding.partner1_name} e {wedding.partner2_name}
      </Title>

      <Card>
        {days === null ? (
          <Subtitle>Data a definir</Subtitle>
        ) : days >= 0 ? (
          <>
            <Subtitle>{days === 0 ? 'É hoje!' : `Faltam ${days} dias`}</Subtitle>
            <Body muted>{dateFormat.format(new Date(`${wedding.wedding_date}T00:00:00Z`))}</Body>
          </>
        ) : (
          <Subtitle>Casamento realizado</Subtitle>
        )}
        {wedding.city ? <Body muted>{wedding.city}</Body> : null}
        {agencyName ? <Body>Assessoria: {agencyName}</Body> : null}
      </Card>

      <Card>
        <Subtitle>Resumo</Subtitle>
        {wedding.estimated_guests ? (
          <Body>{wedding.estimated_guests} convidados previstos</Body>
        ) : null}
        {wedding.estimated_budget_cents !== null ? (
          <Body>Orçamento estimado: {formatBRL(wedding.estimated_budget_cents)}</Body>
        ) : null}
        {wedding.style ? (
          <Body>Estilo: {WEDDING_STYLE_LABELS[wedding.style as WeddingStyle]}</Body>
        ) : null}
        <Body muted>Tarefas, pagamentos e confirmações aparecem aqui na próxima etapa.</Body>
      </Card>

      {role === 'couple' && coupleAccounts < 2 ? (
        <Card>
          <Subtitle>Planejem juntos</Subtitle>
          <Body>Convide seu par para ter a própria conta no app.</Body>
          {inviteError ? <Notice tone="alert">{inviteError}</Notice> : null}
          <Button
            label="Convidar meu par"
            loading={inviting}
            onPress={() => void invitePartner()}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
