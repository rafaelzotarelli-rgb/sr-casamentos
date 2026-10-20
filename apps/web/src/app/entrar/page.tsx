import type { Metadata } from 'next';
import { safeNext } from '@/lib/safe-next';
import { LoginOptions } from './login-options';

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
          Não foi possível entrar. O link pode ter expirado ou ter sido aberto em outro navegador:
          use o código de 6 dígitos do e-mail.
        </p>
      ) : null}
      <LoginOptions next={destination} />
    </main>
  );
}
