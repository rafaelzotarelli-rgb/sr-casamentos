import type { Task } from '@sr/db';
import {
  maskBrDate,
  parseBrDate,
  TASK_ASSIGNEES,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskAssignee,
  type TaskCategory,
} from '@sr/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';
import { assigneeLabel } from '@/components/task-row';
import { Body, Button, Chip, Notice, Screen, TextField, Title } from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { canEdit, useWedding } from '@/lib/wedding-context';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, access } = useWedding();
  const [task, setTask] = useState<Task | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [due, setDue] = useState('');
  const [category, setCategory] = useState<TaskCategory>('geral');
  const [assignee, setAssignee] = useState<TaskAssignee>('both');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!active) return;
        setTask(row);
        if (row) {
          setTitle(row.title);
          setNotes(row.notes ?? '');
          setDue(row.due_date ? formatDate(row.due_date) : '');
          setCategory(row.category as TaskCategory);
          setAssignee(row.assignee);
          setDone(row.done);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (task === undefined || !data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando" />
      </Screen>
    );
  }
  if (task === null) {
    return (
      <Screen>
        <Notice tone="alert">Tarefa não encontrada.</Notice>
        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const editable = canEdit(access.tasks);
  const names = { partner1: data.wedding.partner1_name, partner2: data.wedding.partner2_name };
  const assignees = TASK_ASSIGNEES.filter((a) => a !== 'planner' || data.agencyName);

  async function save() {
    if (!task) return;
    const dueDate = due.trim() ? parseBrDate(due) : null;
    if (due.trim() && !dueDate) return setError('Prazo inválido. Use DD/MM/AAAA.');
    if (title.trim().length < 2) return setError('Escreva a tarefa (pelo menos 2 letras).');
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: title.trim(),
        notes: notes.trim() || null,
        due_date: dueDate,
        category,
        assignee,
        done,
      })
      .eq('id', task.id);
    setSaving(false);
    if (updateError) return setError('Não foi possível salvar. Tente novamente.');
    router.back();
  }

  async function remove() {
    if (!task) return;
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id);
    if (deleteError) return setError('Não foi possível excluir.');
    router.back();
  }

  function confirmRemove() {
    confirmAction('Excluir tarefa', `Excluir "${task?.title}"?`, 'Excluir', () => void remove());
  }

  return (
    <Screen>
      <Title>{editable ? 'Editar tarefa' : task.title}</Title>
      <TextField label="Tarefa" value={title} onChangeText={setTitle} editable={editable} />
      <TextField
        label="Prazo"
        placeholder="DD/MM/AAAA (opcional)"
        value={due}
        onChangeText={(t) => setDue(maskBrDate(t))}
        keyboardType="number-pad"
        editable={editable}
      />

      <Body>Quem cuida</Body>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {assignees.map((a) => (
          <Chip
            key={a}
            label={assigneeLabel(a, names)}
            selected={assignee === a}
            onPress={() => editable && setAssignee(a)}
          />
        ))}
      </View>

      <Body>Categoria</Body>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {TASK_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={TASK_CATEGORY_LABELS[c]}
            selected={category === c}
            onPress={() => editable && setCategory(c)}
          />
        ))}
      </View>

      <TextField
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={{ minHeight: 96, textAlignVertical: 'top' }}
        editable={editable}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Switch
          value={done}
          onValueChange={setDone}
          disabled={!editable}
          accessibilityLabel="Tarefa concluída"
          trackColor={{ true: colors.positive, false: colors.border }}
        />
        <Body>Concluída</Body>
      </View>

      {error ? <Notice tone="alert">{error}</Notice> : null}

      {editable ? (
        <View style={{ gap: 8 }}>
          <Button label="Salvar" loading={saving} onPress={() => void save()} />
          <Button label="Excluir tarefa" variant="danger" onPress={confirmRemove} />
        </View>
      ) : null}
      <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
