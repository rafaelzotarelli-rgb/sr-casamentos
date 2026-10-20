import type { BudgetCategory } from '@sr/db';
import {
  BUDGET_CATEGORY_KEYS,
  costPerGuestCents,
  formatBRL,
  parseBrMoney,
  simulateGuests,
  suggestBudget,
  WEDDING_STYLE_LABELS,
  WEDDING_STYLES,
  type WeddingStyle,
} from '@sr/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  Body,
  Button,
  Card,
  Chip,
  Notice,
  Screen,
  styles,
  Subtitle,
  TextField,
  Title,
} from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { useIsWide } from '@/lib/layout';
import { supabase } from '@/lib/supabase';
import { colors, MIN_TOUCH_SIZE, spacing } from '@/lib/theme';
import { canEdit, useWedding } from '@/lib/wedding-context';

const reais = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

export default function Budget() {
  const { data, access } = useWedding();
  const wide = useIsWide();
  const [categories, setCategories] = useState<BudgetCategory[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ tone: 'alert' | 'positive'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Calculadora
  const [calcTotal, setCalcTotal] = useState('');
  const [calcGuests, setCalcGuests] = useState('');
  const [calcStyle, setCalcStyle] = useState<WeddingStyle | null>(null);
  const [simGuests, setSimGuests] = useState('');
  // Nova categoria
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  const weddingId = data?.wedding.id;

  const load = useCallback(async () => {
    if (!weddingId) return;
    const { data: rows } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('sort_order')
      .order('created_at');
    setCategories(rows ?? []);
  }, [weddingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!data || categories === null) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando" />
      </Screen>
    );
  }
  if (access.budget === 'none') {
    return (
      <Screen>
        <Title>Orçamento</Title>
        <Notice tone="alert">Você não tem acesso ao orçamento deste casamento.</Notice>
      </Screen>
    );
  }

  const { wedding } = data;
  const editable = canEdit(access.budget);
  const plannedTotal = categories.reduce((sum, c) => sum + c.planned_cents, 0);
  const guests = wedding.estimated_guests ?? 0;

  // Valores da calculadora: o que foi digitado, ou os dados do casamento.
  const totalCents =
    parseBrMoney(calcTotal) ?? (plannedTotal || wedding.estimated_budget_cents || 0);
  const calcGuestCount = Number(calcGuests) || guests;
  const style = calcStyle ?? (wedding.style as WeddingStyle | null);
  const suggestion = suggestBudget(totalCents, style);
  const simCount = Number(simGuests);
  const simulation =
    simCount > 0 && guests > 0
      ? simulateGuests(
          categories.map((c) => ({ key: c.key ?? c.id, plannedCents: c.planned_cents })),
          guests,
          simCount,
        )
      : null;

  async function applySuggestion() {
    if (!weddingId) return;
    setBusy(true);
    setMessage(null);
    const rows = suggestion.map((line) => ({
      wedding_id: weddingId,
      key: line.key,
      name: line.label,
      planned_cents: line.plannedCents,
      sort_order: BUDGET_CATEGORY_KEYS.indexOf(line.key),
    }));
    const { error } = await supabase
      .from('budget_categories')
      .upsert(rows, { onConflict: 'wedding_id,key' });
    setBusy(false);
    if (error) return setMessage({ tone: 'alert', text: 'Não foi possível aplicar a sugestão.' });
    setMessage({ tone: 'positive', text: 'Distribuição sugerida aplicada.' });
    await load();
  }

  async function saveEdits() {
    setBusy(true);
    setMessage(null);
    for (const [id, text] of Object.entries(drafts)) {
      const cents = parseBrMoney(text);
      if (cents === null) {
        setBusy(false);
        return setMessage({ tone: 'alert', text: `Valor inválido: "${text}".` });
      }
      const { error } = await supabase
        .from('budget_categories')
        .update({ planned_cents: cents })
        .eq('id', id);
      if (error) {
        setBusy(false);
        return setMessage({ tone: 'alert', text: 'Não foi possível salvar.' });
      }
    }
    setBusy(false);
    setDrafts({});
    setEditing(false);
    setMessage({ tone: 'positive', text: 'Valores salvos.' });
    await load();
  }

  async function addCategory() {
    if (!weddingId) return;
    const cents = parseBrMoney(newValue || '0');
    if (newName.trim().length < 2 || cents === null) {
      return setMessage({ tone: 'alert', text: 'Informe o nome e um valor válido.' });
    }
    const { error } = await supabase.from('budget_categories').insert({
      wedding_id: weddingId,
      name: newName.trim(),
      planned_cents: cents,
      sort_order: 100 + (categories?.length ?? 0),
    });
    if (error) return setMessage({ tone: 'alert', text: 'Não foi possível adicionar.' });
    setNewName('');
    setNewValue('');
    await load();
  }

  function removeCategory(category: BudgetCategory) {
    confirmAction('Excluir categoria', `Excluir "${category.name}"?`, 'Excluir', () => {
      void supabase
        .from('budget_categories')
        .delete()
        .eq('id', category.id)
        .then(() => load());
    });
  }

  const calculator = (
    <Card>
      <Subtitle>Calculadora</Subtitle>
      <Body muted>Veja quanto destinar a cada categoria e simule outros cenários.</Body>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Orçamento total (R$)"
            placeholder={reais(totalCents)}
            value={calcTotal}
            onChangeText={setCalcTotal}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Convidados"
            placeholder={String(guests || '')}
            value={calcGuests}
            onChangeText={(t) => setCalcGuests(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {WEDDING_STYLES.map((s) => (
          <Chip
            key={s}
            label={WEDDING_STYLE_LABELS[s]}
            selected={style === s}
            onPress={() => setCalcStyle(s)}
          />
        ))}
      </View>
      {calcGuestCount > 0 ? (
        <Body>
          Custo por convidado:{' '}
          <Text style={{ fontWeight: '700' }}>
            {formatBRL(costPerGuestCents(totalCents, calcGuestCount))}
          </Text>
        </Body>
      ) : null}
      {suggestion.map((line) => (
        <View key={line.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body>{line.label}</Body>
          <Body>{formatBRL(line.plannedCents)}</Body>
        </View>
      ))}
      {editable ? (
        <Button
          label="Usar esta distribuição no meu orçamento"
          variant="secondary"
          loading={busy}
          onPress={() =>
            confirmAction(
              'Aplicar distribuição',
              'Os valores previstos das categorias padrão serão substituídos pelos da calculadora.',
              'Aplicar',
              () => void applySuggestion(),
            )
          }
        />
      ) : null}

      <Subtitle>E se…</Subtitle>
      <TextField
        label="E se forem quantos convidados?"
        placeholder={guests ? `Hoje: ${guests}` : 'Informe os convidados no Início'}
        value={simGuests}
        onChangeText={(t) => setSimGuests(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        editable={guests > 0}
      />
      {simulation ? (
        <Body>
          Com {simCount} convidados o total previsto vai para{' '}
          <Text style={{ fontWeight: '700' }}>{formatBRL(simulation.totalCents)}</Text> (
          {simulation.totalCents >= plannedTotal ? '+' : '−'}
          {formatBRL(Math.abs(simulation.totalCents - plannedTotal))}). Buffet, bebidas, convites e
          lembrancinhas acompanham o número de convidados.
        </Body>
      ) : null}
    </Card>
  );

  const categoryList = (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Subtitle>Por categoria</Subtitle>
        {editable && categories.length ? (
          editing ? (
            <Button label="Salvar" loading={busy} onPress={() => void saveEdits()} />
          ) : (
            <Button label="Editar valores" variant="secondary" onPress={() => setEditing(true)} />
          )
        ) : null}
      </View>
      <Body>
        Previsto: <Text style={{ fontWeight: '700' }}>{formatBRL(plannedTotal)}</Text>
        {wedding.estimated_guests
          ? ` · ${formatBRL(costPerGuestCents(plannedTotal, wedding.estimated_guests))} por convidado`
          : ''}
      </Body>
      {categories.length === 0 ? (
        <Body muted>
          Nenhuma categoria ainda. Use a calculadora para criar a distribuição sugerida.
        </Body>
      ) : (
        categories.map((c) => {
          const share = plannedTotal ? c.planned_cents / plannedTotal : 0;
          return (
            <View key={c.id} style={{ gap: 4, paddingVertical: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={[styles.body, { flex: 1 }]}>{c.name}</Text>
                {editing ? (
                  <View style={{ width: 140 }}>
                    <TextField
                      label={`Previsto para ${c.name}`}
                      value={drafts[c.id] ?? reais(c.planned_cents)}
                      onChangeText={(t) => setDrafts((d) => ({ ...d, [c.id]: t }))}
                      keyboardType="decimal-pad"
                    />
                  </View>
                ) : (
                  <Body>{formatBRL(c.planned_cents)}</Body>
                )}
                {editing && !c.key ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${c.name}`}
                    onPress={() => removeCategory(c)}
                    style={{
                      minWidth: MIN_TOUCH_SIZE,
                      minHeight: MIN_TOUCH_SIZE,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                <View
                  style={{
                    width: `${Math.round(share * 100)}%`,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
            </View>
          );
        })
      )}
      {editing ? (
        <View style={{ gap: spacing.sm }}>
          <Subtitle>Nova categoria</Subtitle>
          <TextField
            label="Nome"
            value={newName}
            onChangeText={setNewName}
            placeholder="Ex.: Cerimonial religioso"
          />
          <TextField
            label="Previsto (R$)"
            value={newValue}
            onChangeText={setNewValue}
            keyboardType="decimal-pad"
          />
          <Button
            label="Adicionar categoria"
            variant="secondary"
            onPress={() => void addCategory()}
          />
        </View>
      ) : null}
      <Body muted>
        O valor contratado, o pago e o alerta de estouro aparecem quando houver fornecedores e
        pagamentos.
      </Body>
    </Card>
  );

  return (
    <Screen>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {!editable ? (
        <Notice tone="positive">Você pode ver o orçamento, mas não editar.</Notice>
      ) : null}
      <View
        style={{
          flexDirection: wide ? 'row' : 'column',
          gap: spacing.md,
          alignItems: 'flex-start',
        }}
      >
        <View style={{ flex: 1, gap: spacing.md, width: wide ? undefined : '100%' }}>
          {categoryList}
        </View>
        <View style={{ flex: 1, gap: spacing.md, width: wide ? undefined : '100%' }}>
          {calculator}
        </View>
      </View>
    </Screen>
  );
}
