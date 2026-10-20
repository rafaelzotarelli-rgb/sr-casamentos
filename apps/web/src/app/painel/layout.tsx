import Link from 'next/link';
import type { ReactNode } from 'react';
import { getPanelContext } from '@/lib/agency';
import { signOut } from './actions';
import { CreateAgencyForm } from './create-agency-form';

export const metadata = { title: { default: 'Painel', template: '%s · Sr. Casamentos' } };

// Seções do briefing (seção 3) que chegam nas próximas etapas.
const SOON = [
  'Meus fornecedores',
  'Contratos',
  'Financeiro',
  'Modelos',
  'Minha marca',
  'Indicações e cashback',
  'Plano e cobrança',
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { agency, user } = await getPanelContext();

  if (!agency) {
    return (
      <main className="page stack">
        <h1>Bem-vindo(a)!</h1>
        <p className="muted">
          Para usar o painel, cadastre sua assessoria. Se você foi convidado para a equipe de outra
          assessoria, abra o link do convite que recebeu.
        </p>
        <div className="card">
          <CreateAgencyForm />
        </div>
        <form action={signOut}>
          <button className="button secondary" type="submit">
            Sair ({user.email})
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Menu do painel">
        <div className="brand">Sr. Casamentos</div>
        <p className="muted" style={{ margin: '0 12px 12px' }}>
          {agency.name}
        </p>
        <Link href="/painel">Visão geral</Link>
        <Link href="/painel/casamentos">Casamentos</Link>
        <Link href="/painel/equipe">Equipe e acessos</Link>
        {SOON.map((item) => (
          <span key={item}>
            {item} <span className="badge">em breve</span>
          </span>
        ))}
        <div style={{ marginTop: 'auto' }} className="stack">
          <form action={signOut}>
            <button className="button secondary" type="submit" style={{ width: '100%' }}>
              Sair
            </button>
          </form>
          <form action={signOut}>
            <input type="hidden" name="everywhere" value="1" />
            <button className="button secondary" type="submit" style={{ width: '100%' }}>
              Sair de todos os aparelhos
            </button>
          </form>
          <Link href="/excluir-conta">Excluir minha conta</Link>
        </div>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
