import Link from 'next/link';
import type { ReactNode } from 'react';
import { getPanelContext } from '@/lib/agency';
import { redirect } from 'next/navigation';
import { signOut } from './actions';

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
  const { agency, wedding } = await getPanelContext();

  // O painel é só da assessoria. Noivos vão para a página do casamento; quem
  // ainda não tem vínculo escolhe o perfil em /inicio (nunca é forçado a criar assessoria).
  if (!agency) {
    redirect(wedding ? '/casamento' : '/inicio');
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
