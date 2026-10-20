import { inviteTokenSchema } from '@sr/shared';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/supabase/server';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = { title: 'Convite', robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = inviteTokenSchema.safeParse(token).success;
  const { user } = await requireUser(`/convite/${token}`);

  return (
    <main className="page stack">
      <h1>Você recebeu um convite</h1>
      {valid ? (
        <>
          <p className="muted">
            Entrou como <strong>{user.email}</strong>. Ao aceitar, sua conta será vinculada ao
            casamento ou à equipe de quem enviou o link.
          </p>
          {/* Aceite só com clique: um GET não deve mudar dados (pré-visualizações de link). */}
          <AcceptInviteForm token={token} />
        </>
      ) : (
        <p className="alert" role="alert">
          Este link de convite não é válido. Confira se ele foi copiado inteiro.
        </p>
      )}
    </main>
  );
}
