import {
  errorMessage,
  maskBrDate,
  onboardingSchema,
  parseBrDate,
  parseBrMoney,
  WEDDING_STYLE_LABELS,
  WEDDING_STYLES,
  type WeddingStyle,
} from '@sr/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Body, Button, Chip, Notice, Screen, styles, TextField, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

const STEPS = ['Vocês', 'Data e cidade', 'Tamanho', 'Estilo'] as const;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [date, setDate] = useState('');
  const [noDate, setNoDate] = useState(false);
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState<WeddingStyle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const weddingDate = noDate ? null : parseBrDate(date);
  const input = {
    partner1Name: partner1,
    partner2Name: partner2,
    weddingDate,
    city,
    ...(venue.trim() ? { venueName: venue } : {}),
    estimatedGuests: Number(guests),
    // NaN faz o schema recusar com "Informe um valor."
    estimatedBudgetCents: parseBrMoney(budget) ?? Number.NaN,
    style,
  };

  // Valida só os campos do passo atual antes de avançar.
  function validateStep(): string | null {
    const result = onboardingSchema.safeParse(input);
    const fieldsByStep: (keyof typeof input)[][] = [
      ['partner1Name', 'partner2Name'],
      ['weddingDate', 'city', 'venueName'],
      ['estimatedGuests', 'estimatedBudgetCents'],
      ['style'],
    ];
    if (step === 1 && !noDate && !weddingDate) return 'Informe a data no formato DD/MM/AAAA.';
    if (step === 3 && !style) return 'Escolha um estilo.';
    const issue = result.error?.issues.find((i) =>
      fieldsByStep[step]?.includes(i.path[0] as keyof typeof input),
    );
    return issue?.message ?? null;
  }

  async function next() {
    const problem = validateStep();
    setError(problem);
    if (problem) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    const parsed = onboardingSchema.parse(input);
    setSaving(true);
    const { error: rpcError } = await supabase.rpc('create_couple_wedding', {
      p_partner1_name: parsed.partner1Name,
      p_partner2_name: parsed.partner2Name,
      // A RPC aceita null ("ainda não definimos"); o tipo gerado não marca isso.
      p_wedding_date: parsed.weddingDate as string,
      p_city: parsed.city,
      p_estimated_guests: parsed.estimatedGuests,
      p_estimated_budget_cents: parsed.estimatedBudgetCents,
      p_style: parsed.style,
      ...(parsed.venueName ? { p_venue_name: parsed.venueName } : {}),
    });
    setSaving(false);
    if (rpcError) setError(errorMessage(rpcError));
    else router.replace('/inicio');
  }

  return (
    <Screen>
      <Text style={[styles.body, styles.muted]} accessibilityLiveRegion="polite">
        Passo {step + 1} de {STEPS.length} · {STEPS[step]}
      </Text>

      {step === 0 ? (
        <>
          <Title>Vamos começar pelo casal</Title>
          <TextField
            label="Seu nome"
            value={partner1}
            onChangeText={setPartner1}
            autoComplete="name"
          />
          <TextField label="Nome do seu par" value={partner2} onChangeText={setPartner2} />
          <Button
            label="Recebi um convite"
            variant="secondary"
            accessibilityHint="Se o seu assessor ou seu par já criou o casamento"
            onPress={() => router.push('/convite')}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Title>Quando e onde?</Title>
          {noDate ? null : (
            <TextField
              label="Data do casamento"
              placeholder="DD/MM/AAAA"
              value={date}
              onChangeText={(t) => setDate(maskBrDate(t))}
              keyboardType="number-pad"
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Switch
              value={noDate}
              onValueChange={setNoDate}
              accessibilityLabel="Ainda não definimos a data"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
            <Body>Ainda não definimos a data</Body>
          </View>
          <TextField
            label="Local (opcional)"
            placeholder="Ex.: Fazenda Serra dos Cocais"
            value={venue}
            onChangeText={setVenue}
          />
          <TextField label="Cidade" value={city} onChangeText={setCity} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Title>Tamanho da festa</Title>
          <TextField
            label="Número estimado de convidados"
            value={guests}
            onChangeText={(t) => setGuests(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
          <TextField
            label="Orçamento total estimado (R$)"
            placeholder="Ex.: 80.000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
          />
          <Body muted>
            Com isso montamos um checklist e uma sugestão de orçamento por categoria.
          </Body>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Title>Qual o estilo?</Title>
          <View
            accessibilityRole="radiogroup"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          >
            {WEDDING_STYLES.map((s) => (
              <Chip
                key={s}
                label={WEDDING_STYLE_LABELS[s]}
                selected={style === s}
                onPress={() => setStyle(s)}
              />
            ))}
          </View>
        </>
      ) : null}

      {error ? <Notice tone="alert">{error}</Notice> : null}

      <View style={{ gap: 8, marginTop: 'auto' }}>
        <Button
          label={step === STEPS.length - 1 ? 'Criar nosso casamento' : 'Continuar'}
          loading={saving}
          onPress={() => void next()}
        />
        {step > 0 ? (
          <Button label="Voltar" variant="secondary" onPress={() => setStep(step - 1)} />
        ) : (
          // Quem entrou com a conta errada não pode ficar preso no onboarding.
          <Button
            label="Sair e entrar com outra conta"
            variant="secondary"
            onPress={() => void supabase.auth.signOut({ scope: 'local' })}
          />
        )}
      </View>
    </Screen>
  );
}
