import {
  daysUntil,
  errorMessage,
  formatBRL,
  isOverdue,
  WEDDING_STYLE_LABELS,
  type WeddingStyle,
} from '@sr/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Share, View } from 'react-native';
import { TaskRow } from '@/components/task-row';
import { Body, Button, Card, Notice, Screen, Subtitle, Title } from '@/components/ui';
import { formatLongDate } from '@/lib/format';
import { useIsWide } from '@/lib/layout';
import { supabase } from '@/lib/supabase';
import { colors, siteUrl, spacing } from '@/lib/theme';
import { useTasks } from '@/lib/use-tasks';
import { canEdit, canView, useWedding } from '@/lib/wedding-context';

export default function Home() {
  const { data, access, loading, reload } = useWedding();
  const planVersion = data?.wedding.starter_initialized_at;
  const { tasks, toggle } = useTasks(
    canView(access.tasks) ? data?.wedding.id : undefined,
    planVersion,
  );
  const [plannedCents, setPlannedCents] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const wide = useIsWide();
  const weddingId = data?.wedding.id;
  const seesBudget = canView(access.budget);

  useFocusEffect(
    useCallback(() => {
      reload();
      if (!weddingId || !seesBudget) return;
      void supabase
        .from('budget_categories')
        .select('planned_cents')
        .eq('wedding_id', weddingId)
        .then(({ data: rows }) =>
          setPlannedCents(rows?.reduce((sum, r) => sum + r.planned_cents, 0) ?? null),
        );
      // planVersion: refaz a soma quando o orçamento inicial é criado.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, weddingId, seesBudget, planVersion]),
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
  const names = { partner1: wedding.partner1_name, partner2: wedding.partner2_name };
  const total = tasks?.length ?? 0;
  const doneCount = tasks?.filter((t) => t.done).length ?? 0;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  const nextTasks = (tasks ?? []).filter((t) => !t.done).slice(0, 5);
  const overdueCount = (tasks ?? []).filter((t) => isOverdue(t.due_date, t.done)).length;

  async function invitePartner() {
    setInviting(true);
    setInviteError(null);
    const { data: token, error } = await supabase.rpc('create_invite', {
      p_kind: 'partner',
      p_wedding_id: wedding.id,
    });
    setInviting(false);
    if (error || !token) return setInviteError(errorMessage(error));
    const link = `${siteUrl}/convite/${token}`;
    // No navegador nem sempre existe o compartilhamento do sistema: mostramos o link.
    if (Platform.OS === 'web') return setInviteLink(link);
    await Share.share({
      message: `Vamos planejar nosso casamento juntos no Sr. Casamentos: ${link}`,
    });
  }

  const header = (
    <Card>
      {days === null ? (
        <Subtitle>Data a definir</Subtitle>
      ) : days >= 0 ? (
        <>
          <Subtitle>{days === 0 ? 'É hoje!' : `Faltam ${days} dias`}</Subtitle>
          <Body muted>{formatLongDate(wedding.wedding_date as string)}</Body>
        </>
      ) : (
        <Subtitle>Casamento realizado</Subtitle>
      )}
      {wedding.venue_name || wedding.city ? (
        <Body muted>{[wedding.venue_name, wedding.city].filter(Boolean).join(' · ')}</Body>
      ) : null}
      {agencyName ? <Body>Assessoria: {agencyName}</Body> : null}
      {canView(access.tasks) && total ? (
        <View style={{ gap: 4 }}>
          <Body>Planejamento {progress}% concluído</Body>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
            style={{ height: 8, borderRadius: 4, backgroundColor: colors.border }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.positive,
              }}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );

  const summary = (
    <Card>
      <Subtitle>Resumo</Subtitle>
      {wedding.estimated_guests ? (
        <Body>{wedding.estimated_guests} convidados previstos</Body>
      ) : null}
      {seesBudget && plannedCents !== null && plannedCents > 0 ? (
        <Body>Orçamento previsto: {formatBRL(plannedCents)}</Body>
      ) : wedding.estimated_budget_cents !== null ? (
        <Body>Orçamento estimado: {formatBRL(wedding.estimated_budget_cents)}</Body>
      ) : null}
      {wedding.style ? (
        <Body>Estilo: {WEDDING_STYLE_LABELS[wedding.style as WeddingStyle]}</Body>
      ) : null}
      <Body muted>Confirmações de presença e pagamentos aparecem aqui em breve.</Body>
    </Card>
  );

  const nextTasksCard = canView(access.tasks) ? (
    <Card>
      <Subtitle>Próximas tarefas</Subtitle>
      {overdueCount ? (
        <Notice tone="alert">
          {overdueCount} tarefa{overdueCount > 1 ? 's' : ''} atrasada{overdueCount > 1 ? 's' : ''}
        </Notice>
      ) : null}
      {nextTasks.length === 0 ? (
        <Body muted>{tasks === null ? 'Carregando…' : 'Tudo em dia por aqui.'}</Body>
      ) : (
        nextTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            names={names}
            editable={canEdit(access.tasks)}
            onToggle={(t) => void toggle(t)}
          />
        ))
      )}
      <Button
        label="Ver todas as tarefas"
        variant="secondary"
        onPress={() => router.push('/tarefas')}
      />
    </Card>
  ) : null;

  return (
    <Screen>
      <Title>
        {wedding.partner1_name} e {wedding.partner2_name}
      </Title>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.md }}>
          {header}
          {summary}
        </View>
        <View style={{ flex: 1, gap: spacing.md }}>{nextTasksCard}</View>
      </View>

      {role === 'couple' && coupleAccounts < 2 ? (
        <Card>
          <Subtitle>Planejem juntos</Subtitle>
          <Body>Convide seu par para ter a própria conta no app.</Body>
          {inviteError ? <Notice tone="alert">{inviteError}</Notice> : null}
          {inviteLink ? (
            <Notice tone="positive">
              Envie este link para o seu par (vale 7 dias, uso único): {inviteLink}
            </Notice>
          ) : (
            <Button
              label="Convidar meu par"
              loading={inviting}
              onPress={() => void invitePartner()}
            />
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
