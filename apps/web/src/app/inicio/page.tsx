import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/agency';
import { signOut } from '../painel/actions';
import { CoupleOnboardingForm } from './couple-onboarding-form';
import { CreateAgencyForm } from './create-agency-form';

export const metadata: Metadata = { title: 'Bem-vindo(a)' };

/**
 * Destino após o login (D26): assessoria → painel; noivos/família → página do
 * casamento; sem vínculo → escolher entre planejar o casamento ou ser assessor.
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ perfil?: string }>;
}) {
  const { agency, wedding, user } = await getUserContext('/inicio');
  if (agency) redirect('/painel');
  if (wedding) redirect('/casamento');

  const { perfil } = await searchParams;

  return (
    <main className="page stack" style={{ maxWidth: 640 }}>
      <h1>Bem-vindo(a) ao Sr. Casamentos</h1>
      <p className="muted">Entrou como {user.email}. Como você vai usar o Sr. Casamentos?</p>

      {perfil === 'noivos' ? (
        <div className="card stack">
          <h2>Vamos planejar o casamento</h2>
          <p className="muted">
            Vocês têm acesso a tudo sem precisar de assessor. Se um assessor já cadastrou o
            casamento, use o link de convite que ele enviou.
          </p>
          <CoupleOnboardingForm />
        </div>
      ) : perfil === 'assessor' ? (
        <div className="card stack">
          <h2>Cadastrar minha assessoria</h2>
          <p className="muted">
            O painel é para profissionais que gerenciam casamentos de clientes. Recebeu convite para
            a equipe de uma assessoria? Abra o link do convite.
          </p>
          <CreateAgencyForm />
        </div>
      ) : (
        <div className="row" style={{ alignItems: 'stretch' }}>
          <a className="card stack" href="/inicio?perfil=noivos" style={choiceStyle}>
            <h2>Vamos nos casar</h2>
            <span className="muted">Planejar o nosso casamento, com ou sem assessor.</span>
          </a>
          <a className="card stack" href="/inicio?perfil=assessor" style={choiceStyle}>
            <h2>Sou assessor(a)</h2>
            <span className="muted">Gerenciar casamentos dos meus clientes no painel.</span>
          </a>
        </div>
      )}

      <form action={signOut}>
        <button className="button secondary" type="submit">
          Sair
        </button>
      </form>
    </main>
  );
}

const choiceStyle = {
  flex: '1 1 240px',
  textDecoration: 'none',
  color: 'inherit',
} as const;
