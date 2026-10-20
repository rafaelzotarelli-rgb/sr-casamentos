import { daysUntil, formatBRL, WEDDING_STYLE_LABELS, type WeddingStyle } from '@sr/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/agency';
import { env } from '@/lib/env';
import { formatWeddingDate } from '@/lib/format';
import { signOut } from '../painel/actions';
import { ConsentForm } from './consent-form';
import { EditCoupleWedding } from './edit-couple-wedding';
import { PartnerInvite } from './partner-invite';

export const metadata: Metadata = { title: 'Nosso casamento' };

/** Área dos noivos no site. O planejamento completo fica no app (briefing, seção 2). */
export default async function CouplePage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const { wedding: current, agency, hasConsent, user } = await getUserContext('/casamento');
  if (!current) redirect(agency ? '/painel' : '/inicio');

  if (!hasConsent) {
    return (
      <main className="page stack">
        <h1>Antes de continuar</h1>
        <ConsentForm />
      </main>
    );
  }

  const { wedding, role, coupleAccounts, agencyName } = current;
  const { editar } = await searchParams;
  const days = wedding.wedding_date ? daysUntil(wedding.wedding_date) : null;
  const canEdit = role === 'couple';

  return (
    <main className="page stack" style={{ maxWidth: 640 }}>
      <h1>
        {wedding.partner1_name} e {wedding.partner2_name}
      </h1>

      {editar && canEdit ? (
        <div className="card stack">
          <h2>Editar dados do casamento</h2>
          <EditCoupleWedding wedding={wedding} />
        </div>
      ) : (
        <div className="card stack">
          <h2>
            {days === null
              ? 'Data a definir'
              : days > 0
                ? `Faltam ${days} dias`
                : days === 0
                  ? 'É hoje!'
                  : 'Casamento realizado'}
          </h2>
          {wedding.wedding_date ? <span>{formatWeddingDate(wedding.wedding_date)}</span> : null}
          {wedding.venue_name || wedding.city ? (
            <span className="muted">
              {[wedding.venue_name, wedding.city].filter(Boolean).join(' · ')}
            </span>
          ) : null}
          {agencyName ? <span>Assessoria: {agencyName}</span> : null}
          <span>
            {[
              wedding.estimated_guests ? `${wedding.estimated_guests} convidados previstos` : null,
              wedding.estimated_budget_cents !== null
                ? `Orçamento estimado ${formatBRL(wedding.estimated_budget_cents)}`
                : null,
              wedding.style ? WEDDING_STYLE_LABELS[wedding.style as WeddingStyle] : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {canEdit ? (
            <div>
              <Link className="button secondary" href="/casamento?editar=1">
                Editar dados
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {canEdit && coupleAccounts < 2 ? (
        <div className="card stack">
          <h2>Planejem juntos</h2>
          <p className="muted">Convide seu par para ter a própria conta.</p>
          <PartnerInvite weddingId={wedding.id} />
        </div>
      ) : null}

      <div className="card stack">
        <h2>Planejamento</h2>
        <p className="muted">
          Tarefas, orçamento, convidados, fornecedores e o assistente: no navegador ou no app Sr.
          Casamentos para iPhone e Android, entrando com esta mesma conta.
        </p>
        <div>
          <a className="button" href={env.appUrl}>
            Abrir o planejamento
          </a>
        </div>
      </div>

      <div className="row">
        <form action={signOut}>
          <button className="button secondary" type="submit">
            Sair ({user.email})
          </button>
        </form>
        <Link href="/excluir-conta">Excluir minha conta</Link>
      </div>
    </main>
  );
}
