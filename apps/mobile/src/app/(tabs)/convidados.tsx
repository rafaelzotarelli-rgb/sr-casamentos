import { ComingSoon } from '@/components/coming-soon';

export default function Guests() {
  return (
    <ComingSoon
      title="Convidados"
      items={['Lista de convidados e grupos', 'Confirmação de presença por link', 'Mapa de mesas']}
    />
  );
}
