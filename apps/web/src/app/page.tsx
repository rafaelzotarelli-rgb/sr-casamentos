import Link from 'next/link';

export default function Home() {
  return (
    <main className="page stack">
      <h1>Sr. Casamentos</h1>
      <p className="muted">
        Planejamento do casamento para os noivos e gestão completa para assessores — do primeiro
        orçamento ao último convidado na pista.
      </p>
      <div className="row">
        <Link className="button" href="/painel">
          Entrar no painel do assessor
        </Link>
      </div>
      <p className="muted">
        Noivos: use o app Sr. Casamentos no iPhone ou Android.{' '}
        <Link href="/excluir-conta">Excluir minha conta</Link>
      </p>
    </main>
  );
}
