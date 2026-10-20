import type { Metadata } from 'next';
import { safeNext } from '@/lib/safe-next';
import { OAuthButtons } from './oauth-buttons';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const destination = safeNext(next);

  return (
    <main className="page stack">
      <h1>Entrar</h1>
      <p className="muted">Use a mesma conta do app Sr. Casamentos.</p>
      {erro ? (
        <p className="alert" role="alert">
          Não foi possível entrar. Tente novamente.
        </p>
      ) : null}
      <div className="card stack">
        <OAuthButtons next={destination} />
      </div>
      <details>
        <summary className="muted">Acesso de demonstração ou administração</summary>
        <div className="card stack" style={{ marginTop: 12 }}>
          <PasswordForm next={destination} />
        </div>
      </details>
    </main>
  );
}
