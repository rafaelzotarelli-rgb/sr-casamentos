import type { Metadata } from 'next';
import { signOut } from '@/app/painel/actions';
import { createClient } from '@/lib/supabase/server';
import { LoginOptions } from '@/app/entrar/login-options';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = { title: 'Convite', robots: { index: false } };

type Preview = {
  valid: boolean;
  kind?: 'couple' | 'partner' | 'staff';
  partner1_name?: string | null;
  partner2_name?: string | null;
  agency_name?: string | null;
  is_agency_member?: boolean;
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const path = `/convite/${token}`;
  const supabase = await createClient();
  const [{ data: preview }, { data: auth }] = await Promise.all([
    supabase.rpc('invite_preview', { p_token: token }),
    supabase.auth.getUser(),
  ]);
  const invite = (preview ?? { valid: false }) as Preview;
  const user = auth.user;

  if (!invite.valid) {
    return (
      <main className="page stack">
        <h1>Convite indisponível</h1>
        <p className="alert" role="alert">
          Este link não é válido, já foi usado ou expirou. Peça um novo convite a quem enviou.
        </p>
      </main>
    );
  }

  const couple = `${invite.partner1_name} e ${invite.partner2_name}`;
  const description =
    invite.kind === 'staff'
      ? `${invite.agency_name} convidou você para fazer parte da equipe.`
      : invite.kind === 'partner'
        ? `Você foi convidado(a) para planejar o casamento de ${couple}.`
        : `${invite.agency_name ?? 'Sua assessoria'} convidou vocês para planejar o casamento de ${couple} no Sr. Casamentos.`;
  const blocked = invite.kind !== 'staff' && invite.is_agency_member;

  return (
    <main className="page stack">
      <h1>Você recebeu um convite</h1>
      <p>{description}</p>

      {!user ? (
        <>
          <p className="muted">
            Para aceitar, entre com Google, Apple ou com seu e-mail (você vai receber um código de
            confirmação).
          </p>
          <LoginOptions next={path} />
        </>
      ) : (
        <div className="card stack">
          <p>
            Você está entrando como <strong>{user.email}</strong>.
          </p>
          {blocked ? (
            <p className="alert" role="alert">
              Esta é a conta da assessoria. O convite é para os noivos: troque de conta e entre com
              o e-mail de um deles.
            </p>
          ) : (
            <AcceptInviteForm token={token} askConsent={invite.kind !== 'staff'} />
          )}
          <form action={signOut}>
            <input type="hidden" name="next" value={path} />
            <button className="button secondary" type="submit">
              Não é você? Trocar de conta
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
