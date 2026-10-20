import type { Task } from '@sr/db';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from './supabase';

/**
 * Tarefas do casamento, recarregadas sempre que a tela volta ao foco ou quando
 * `version` muda (ex.: o checklist inicial acabou de ser criado).
 */
export function useTasks(weddingId: string | undefined, version?: string | null) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!weddingId) return;
    const { data, error: queryError } = await supabase
      .from('tasks')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('done', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    setError(Boolean(queryError));
    if (data) setTasks(data);
    // `version` só serve para refazer a busca quando o plano inicial é criado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId, version]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  /** Marca/desmarca já na tela e confirma no servidor (desfaz se falhar). */
  const toggle = useCallback(async (task: Task) => {
    setTasks(
      (current) => current?.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) ?? current,
    );
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ done: !task.done })
      .eq('id', task.id);
    if (updateError) {
      setTasks(
        (current) =>
          current?.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)) ?? current,
      );
    }
  }, []);

  return { tasks, error, reload: load, toggle };
}
