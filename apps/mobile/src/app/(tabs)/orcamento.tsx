import { ComingSoon } from '@/components/coming-soon';

export default function Budget() {
  return (
    <ComingSoon
      title="Orçamento"
      items={[
        'Calculadora com sugestão por categoria',
        'Previsto, contratado, pago e a pagar',
        'Calendário de pagamentos e comprovantes',
      ]}
    />
  );
}
