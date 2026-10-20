import {
  formatPhone,
  formatBRL,
  WEDDING_MODULE_LABELS,
  WEDDING_MODULES,
  WEDDING_STYLE_LABELS,
  type WeddingStyle,
} from '@sr/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPanelContext } from '@/lib/agency';
import { formatWeddingDate } from '@/lib/format';
import { revokeInvite, setCouplePermission } from '../../actions';
import { CoupleInviteButton } from '../couple-invite-button';
import { DeleteWedding } from './delete-wedding';

export const metadata: Metadata = { title: 'Detalhes do casamento' };

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const LEVEL_LABELS = { edit: 'Vê e edita', view: 'Só vê', none: 'Não vê' } as const;

export default async function WeddingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, agency } = await getPanelContext(`/painel/casamentos/${id}`);
  if (!agency) return null;

  // A RLS devolve nada se o casamento não for desta assessoria (ou não liberado à equipe).
  const { data: wedding } = await supabase
    .from('weddings')
    .select('*, wedding_members(user_id, role, created_at), couple_permissions(module, level)')
    .eq('id', id)
    .eq('agency_id', agency.id)
    .maybeSingle();
  if (!wedding) notFound();

  const memberIds = wedding.wedding_members.map((m) => m.user_id);
  const [{ data: profiles }, { data: invites }] = await Promise.all([
    memberIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', memberIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    supabase
      .from('invites')
      .select('id, expires_at, created_at')
      .eq('wedding_id', id)
      .is('used_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  const couple = wedding.wedding_members.filter((m) => m.role === 'couple');
  const nameOf = (userId: string) =>
    profiles?.find((p) => p.id === userId)?.full_name ?? 'Sem nome no perfil';
  const levelOf = (module: string) =>
    wedding.couple_permissions.find((p) => p.module === module)?.level ?? 'edit';
  const inviteMessage = `Olá! ${agency.name} convidou vocês para planejar o casamento de ${wedding.partner1_name} e ${wedding.partner2_name} no Sr. Casamentos. Acesse:`;

  return (
    <div className="stack">
      <p>
        <Link href="/painel/casamentos">← Casamentos</Link>
      </p>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>
          {wedding.partner1_name} e {wedding.partner2_name}
        </h1>
        <Link className="button secondary" href={`/painel/casamentos/${id}/editar`}>
          Editar
        </Link>
      </div>

      <div className="card">
        <dl className="details">
          <dt>Data</dt>
          <dd>{formatWeddingDate(wedding.wedding_date)}</dd>
          <dt>Local</dt>
          <dd>{wedding.venue_name ?? '—'}</dd>
          <dt>Cidade</dt>
          <dd>{wedding.city ?? '—'}</dd>
          <dt>Convidados</dt>
          <dd>{wedding.estimated_guests ?? '—'}</dd>
          <dt>Orçamento</dt>
          <dd>
            {wedding.estimated_budget_cents !== null
              ? formatBRL(wedding.estimated_budget_cents)
              : '—'}
          </dd>
          <dt>Estilo</dt>
          <dd>{wedding.style ? WEDDING_STYLE_LABELS[wedding.style as WeddingStyle] : '—'}</dd>
          <dt>E-mail dos noivos</dt>
          <dd>
            {wedding.contact_email ? (
              <a href={`mailto:${wedding.contact_email}`}>{wedding.contact_email}</a>
            ) : (
              '—'
            )}
          </dd>
          <dt>WhatsApp dos noivos</dt>
          <dd>{wedding.contact_phone ? formatPhone(wedding.contact_phone) : '—'}</dd>
        </dl>
      </div>

      <div className="card stack">
        <h2>Noivos no app ({couple.length} de 2)</h2>
        {couple.length ? (
          <ul>
            {couple.map((m) => (
              <li key={m.user_id}>{nameOf(m.user_id)}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Os noivos ainda não entraram. Envie o convite abaixo.</p>
        )}
        {invites?.length ? (
          <div className="stack">
            <p className="muted">Convites ainda não usados:</p>
            {invites.map((inv) => (
              <form key={inv.id} action={revokeInvite} className="row">
                <input type="hidden" name="inviteId" value={inv.id} />
                <input type="hidden" name="weddingId" value={id} />
                <span>
                  Gerado em {dateTime.format(new Date(inv.created_at))} · vale até{' '}
                  {dateTime.format(new Date(inv.expires_at))}
                </span>
                <button className="button secondary small" type="submit">
                  Cancelar convite
                </button>
              </form>
            ))}
          </div>
        ) : null}
        {couple.length < 2 ? (
          <CoupleInviteButton
            weddingId={id}
            phone={wedding.contact_phone}
            message={inviteMessage}
          />
        ) : null}
      </div>

      <div className="card stack">
        <h2>O que os noivos podem ver e editar</h2>
        <table>
          <tbody>
            {WEDDING_MODULES.map((module) => (
              <tr key={module}>
                <td>{WEDDING_MODULE_LABELS[module]}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    {(['edit', 'view', 'none'] as const).map((level) => {
                      const active = levelOf(module) === level;
                      return (
                        <form key={level} action={setCouplePermission}>
                          <input type="hidden" name="weddingId" value={id} />
                          <input type="hidden" name="module" value={module} />
                          <input type="hidden" name="level" value={level} />
                          <button
                            className={active ? 'button small' : 'button secondary small'}
                            type="submit"
                            aria-pressed={active}
                          >
                            {LEVEL_LABELS[level]}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {agency.role === 'owner' ? (
        <DeleteWedding
          weddingId={id}
          names={`${wedding.partner1_name} e ${wedding.partner2_name}`}
          hasCouple={couple.length > 0}
        />
      ) : null}
    </div>
  );
}
