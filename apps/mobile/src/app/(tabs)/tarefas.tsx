import type { Task } from '@sr/db';
import { isOverdue, phaseForDueDate, TASK_PHASES, type TaskPhase } from '@sr/shared';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { TaskRow } from '@/components/task-row';
import {
  Body,
  Button,
  Card,
  Chip,
  Notice,
  Screen,
  Subtitle,
  TextField,
  Title,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';
import { useTasks } from '@/lib/use-tasks';
import { canEdit, useWedding } from '@/lib/wedding-context';

const FILTERS = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'overdue', label: 'Atrasadas' },
  { key: 'done', label: 'Concluídas' },
  { key: 'all', label: 'Todas' },
] as const;
type Filter = (typeof FILTERS)[number]['key'];

/**
 * Grupo de exibição: a fase do checklist (tarefas do modelo mantêm a fase
 * original mesmo com o prazo antecipado); tarefas manuais, pela data.
 */
function phaseOf(task: Task, weddingDate: string | null): TaskPhase | 'sem_prazo' {
  if (task.phase) return task.phase as TaskPhase;
  if (task.due_date && weddingDate) return phaseForDueDate(task.due_date, weddingDate);
  return 'sem_prazo';
}

export default function Tasks() {
  const { data, access } = useWedding();
  const { tasks, error, toggle, reload } = useTasks(
    data?.wedding.id,
    data?.wedding.starter_initialized_at,
  );
  const [filter, setFilter] = useState<Filter>('pending');
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (!data || tasks === null) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando" />
      </Screen>
    );
  }
  if (access.tasks === 'none') {
    return (
      <Screen>
        <Title>Tarefas</Title>
        <Notice tone="alert">Você não tem acesso às tarefas deste casamento.</Notice>
      </Screen>
    );
  }

  const editable = canEdit(access.tasks);
  const { wedding } = data;
  const names = { partner1: wedding.partner1_name, partner2: wedding.partner2_name };
  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = tasks.filter((t) => isOverdue(t.due_date, t.done)).length;

  const visible = tasks.filter((t) =>
    filter === 'pending'
      ? !t.done
      : filter === 'done'
        ? t.done
        : filter === 'overdue'
          ? isOverdue(t.due_date, t.done)
          : true,
  );
  const groups = [
    ...TASK_PHASES.map((p) => ({ key: p.key, label: p.label })),
    {
      key: 'sem_prazo' as const,
      label: 'Sem prazo',
    },
  ]
    .map((group) => ({
      ...group,
      items: visible.filter((t) => phaseOf(t, wedding.wedding_date) === group.key),
    }))
    .filter((group) => group.items.length > 0);

  async function addTask() {
    const trimmed = title.trim();
    if (trimmed.length < 2) return setAddError('Escreva a tarefa (pelo menos 2 letras).');
    setAdding(true);
    setAddError(null);
    const { error: insertError } = await supabase
      .from('tasks')
      .insert({ wedding_id: wedding.id, title: trimmed });
    setAdding(false);
    if (insertError) return setAddError('Não foi possível adicionar. Tente novamente.');
    setTitle('');
    setFilter('pending');
    await reload();
  }

  return (
    <Screen>
      <Body muted>
        {doneCount} de {tasks.length} concluídas
        {overdueCount ? ` · ${overdueCount} atrasada${overdueCount > 1 ? 's' : ''}` : ''}
      </Body>
      {error ? <Notice tone="alert">Não foi possível atualizar a lista.</Notice> : null}

      {editable ? (
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Nova tarefa"
                placeholder="Ex.: Reservar hotel para os padrinhos"
                value={title}
                onChangeText={setTitle}
                onSubmitEditing={() => void addTask()}
                returnKeyType="done"
              />
            </View>
            <Button label="Adicionar" loading={adding} onPress={() => void addTask()} />
          </View>
          {addError ? <Notice tone="alert">{addError}</Notice> : null}
        </Card>
      ) : (
        <Notice tone="positive">Você pode ver as tarefas, mas não editar.</Notice>
      )}

      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {groups.length === 0 ? (
        <Body muted>
          {filter === 'overdue' ? 'Nenhuma tarefa atrasada. 🎉' : 'Nenhuma tarefa por aqui.'}
        </Body>
      ) : (
        groups.map((group) => (
          <Card key={group.key}>
            <Subtitle>{group.label}</Subtitle>
            {group.items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                names={names}
                editable={editable}
                onToggle={(t) => void toggle(t)}
              />
            ))}
          </Card>
        ))
      )}
    </Screen>
  );
}
