import { ACCOUNT_DELETION_GRACE_DAYS } from '@sr/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DeletionControls } from './deletion-controls';

// Página pública exigida pelo Google Play: exclusão de conta também fora do app.
export const metadata: Metadata = { title: 'Excluir conta' };

export default async function DeleteAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pending } = user
    ? await supabase.from('account_deletion_requests').select('scheduled_for').maybeSingle()
    : { data: null };

  return (
    <main className="page stack">
      <h1>Excluir conta</h1>
      <div className="card stack">
        <p>Ao excluir sua conta do Sr. Casamentos:</p>
        <ul>
          <li>
            A exclusão fica pendente por <strong>{ACCOUNT_DELETION_GRACE_DAYS} dias</strong>. Nesse
            prazo você pode cancelar entrando de novo e voltando a esta página.
          </li>
          <li>Depois disso, seu perfil, seus acessos e seus consentimentos são apagados.</li>
          <li>
            Se o casamento tiver outro(a) noivo(a) com conta, ele continua com essa pessoa. Se você
            era a única conta e não há assessor, o casamento também é apagado após mais{' '}
            {ACCOUNT_DELETION_GRACE_DAYS} dias.
          </li>
          <li>
            Casamentos cadastrados por um assessor pertencem à assessoria e continuam com ela; seus
            dados pessoais de acesso são removidos.
          </li>
        </ul>
        <p className="muted">
          Registros que a lei obriga a guardar (como compras) são mantidos pelo prazo legal.
        </p>
      </div>
      {user ? (
        <DeletionControls email={user.email ?? ''} scheduledFor={pending?.scheduled_for ?? null} />
      ) : (
        <Link className="button" href="/entrar?next=/excluir-conta">
          Entrar para excluir minha conta
        </Link>
      )}
    </main>
  );
}
