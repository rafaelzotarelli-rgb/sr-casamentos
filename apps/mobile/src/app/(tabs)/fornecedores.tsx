import { ComingSoon } from '@/components/coming-soon';

export default function Vendors() {
  return (
    <ComingSoon
      title="Fornecedores"
      items={[
        'Fornecedores por categoria e status',
        'Comparação de orçamentos',
        'Avaliações de assessores e noivos',
        'Contratos guardados com segurança',
      ]}
    />
  );
}
