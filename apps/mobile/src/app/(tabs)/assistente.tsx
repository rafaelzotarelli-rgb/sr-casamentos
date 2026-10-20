import { ComingSoon } from '@/components/coming-soon';

export default function Assistant() {
  return (
    <ComingSoon
      title="Assistente"
      items={[
        'Perguntas sobre orçamento, contratos e convidados',
        'Análise de contratos com prazos e pontos de atenção',
        'Sugestões com confirmação antes de qualquer ação',
      ]}
    />
  );
}
