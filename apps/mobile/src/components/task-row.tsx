import { Ionicons } from '@expo/vector-icons';
import type { Task } from '@sr/db';
import { isOverdue } from '@sr/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { formatDate } from '@/lib/format';
import { colors, MIN_TOUCH_SIZE, spacing } from '@/lib/theme';
import { styles } from './ui';

const ORIGIN_LABELS: Record<Task['origin'], string | null> = {
  manual: null,
  template: 'Checklist',
  contract: 'Do contrato',
  planner: 'Do assessor',
};

export function assigneeLabel(
  assignee: Task['assignee'],
  names: { partner1: string; partner2: string },
): string {
  switch (assignee) {
    case 'partner1':
      return names.partner1;
    case 'partner2':
      return names.partner2;
    case 'family':
      return 'Família';
    case 'planner':
      return 'Assessor';
    default:
      return 'Os dois';
  }
}

export function TaskRow({
  task,
  names,
  editable,
  onToggle,
}: {
  task: Task;
  names: { partner1: string; partner2: string };
  editable: boolean;
  onToggle: (task: Task) => void;
}) {
  const overdue = isOverdue(task.due_date, task.done);
  const origin = ORIGIN_LABELS[task.origin];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={task.title}
        accessibilityState={{ checked: task.done, disabled: !editable }}
        disabled={!editable}
        onPress={() => onToggle(task)}
        style={{
          width: MIN_TOUCH_SIZE,
          height: MIN_TOUCH_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={task.done ? colors.positive : colors.textMuted}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre os detalhes da tarefa"
        onPress={() => router.push(`/tarefa/${task.id}`)}
        style={{ flex: 1, minHeight: MIN_TOUCH_SIZE, justifyContent: 'center', paddingVertical: 4 }}
      >
        <Text
          style={[
            styles.body,
            task.done && { color: colors.textMuted, textDecorationLine: 'line-through' },
          ]}
        >
          {task.title}
        </Text>
        <Text style={[styles.body, styles.muted, { fontSize: 13 }]}>
          {[
            task.due_date
              ? overdue
                ? `Atrasada · era até ${formatDate(task.due_date)}`
                : `Até ${formatDate(task.due_date)}`
              : null,
            assigneeLabel(task.assignee, names),
            origin,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Pressable>
      {overdue ? (
        <Ionicons
          name="alert-circle"
          size={20}
          color={colors.alert}
          accessibilityLabel="Atrasada"
        />
      ) : null}
    </View>
  );
}
