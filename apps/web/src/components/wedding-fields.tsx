import type { Wedding } from '@sr/db';
import { PHONE_COUNTRIES, splitPhone, WEDDING_STYLE_LABELS, WEDDING_STYLES } from '@sr/shared';

/**
 * Campos do casamento. `planner`: cadastro/edição pelo assessor (só nomes
 * obrigatórios, mais o contato de um dos noivos). `couple`: noivos sem
 * assessor (cidade, convidados, orçamento e estilo obrigatórios).
 */
export function WeddingFields({
  mode,
  defaults,
}: {
  mode: 'planner' | 'couple';
  defaults?: Partial<Wedding>;
}) {
  const required = mode === 'couple';
  const budget =
    typeof defaults?.estimated_budget_cents === 'number'
      ? defaults.estimated_budget_cents / 100
      : undefined;
  const phone = defaults?.contact_phone
    ? splitPhone(defaults.contact_phone)
    : { countryCode: '55', number: '' };

  return (
    <>
      <div className="row">
        <label style={{ flex: '1 1 200px' }}>
          {mode === 'couple' ? 'Seu nome' : 'Nome de um dos noivos'}
          <input
            name="partner1Name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={defaults?.partner1_name ?? ''}
          />
        </label>
        <label style={{ flex: '1 1 200px' }}>
          {mode === 'couple' ? 'Nome do seu par' : 'Nome do(a) outro(a)'}
          <input
            name="partner2Name"
            required
            minLength={2}
            maxLength={60}
            defaultValue={defaults?.partner2_name ?? ''}
          />
        </label>
      </div>

      {mode === 'planner' ? (
        <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="muted" style={{ marginBottom: 8 }}>
            Contato de um dos noivos (para enviar o convite)
          </legend>
          <div className="row">
            <label style={{ flex: '1 1 200px' }}>
              E-mail
              <input
                name="contactEmail"
                type="email"
                maxLength={254}
                autoComplete="off"
                defaultValue={defaults?.contact_email ?? ''}
              />
            </label>
            <div className="row" style={{ flex: '1 1 280px', gap: 8, alignItems: 'flex-end' }}>
              <label style={{ flex: '0 0 150px' }}>
                DDI
                <select name="contactPhoneCountry" defaultValue={phone.countryCode || '55'}>
                  {PHONE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ flex: '1 1 140px' }}>
                WhatsApp
                <input
                  name="contactPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(19) 99123-4567"
                  aria-describedby="phone-hint"
                  defaultValue={phone.number}
                />
              </label>
            </div>
            <span
              id="phone-hint"
              className="muted"
              style={{ flexBasis: '100%', fontSize: '0.85rem' }}
            >
              No Brasil, com DDD. Outro país fora da lista: digite o número completo começando com +
              (ex.: +971 50 123 4567).
            </span>
          </div>
        </fieldset>
      ) : null}

      <div className="row">
        <label style={{ flex: '1 1 160px' }}>
          Data (deixe vazio se ainda não definida)
          <input name="weddingDate" type="date" defaultValue={defaults?.wedding_date ?? ''} />
        </label>
        <label style={{ flex: '2 1 240px' }}>
          Local
          <input
            name="venueName"
            maxLength={120}
            placeholder="Ex.: Fazenda Serra dos Cocais"
            defaultValue={defaults?.venue_name ?? ''}
          />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Cidade
          <input
            name="city"
            maxLength={80}
            required={required}
            defaultValue={defaults?.city ?? ''}
          />
        </label>
      </div>

      <div className="row">
        <label style={{ flex: '1 1 120px' }}>
          Convidados (estimativa)
          <input
            name="estimatedGuests"
            type="number"
            min={1}
            max={5000}
            inputMode="numeric"
            required={required}
            defaultValue={defaults?.estimated_guests ?? ''}
          />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Orçamento (R$)
          <input
            name="estimatedBudget"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            required={required}
            defaultValue={budget ?? ''}
          />
        </label>
        <label style={{ flex: '1 1 160px' }}>
          Estilo
          <select name="style" defaultValue={defaults?.style ?? ''} required={required}>
            <option value="">—</option>
            {WEDDING_STYLES.map((style) => (
              <option key={style} value={style}>
                {WEDDING_STYLE_LABELS[style]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
