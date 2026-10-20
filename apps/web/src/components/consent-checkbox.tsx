/** Aceite de Termos e Política (obrigatório antes de criar casamento ou assessoria). */
export function ConsentCheckbox() {
  return (
    <label htmlFor="consent" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <input
        id="consent"
        name="consent"
        type="checkbox"
        required
        style={{ minHeight: 24, width: 24 }}
      />
      <span>
        Li e aceito os{' '}
        <a href="/termos" target="_blank">
          Termos de Uso
        </a>{' '}
        e a{' '}
        <a href="/privacidade" target="_blank">
          Política de Privacidade
        </a>
      </span>
    </label>
  );
}
