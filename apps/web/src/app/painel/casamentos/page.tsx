import { isActiveEvent } from '@sr/shared';
import Link from 'next/link';
import { getPanelContext } from '@/lib/agency';
import { formatWeddingDate } from '@/lib/format';
import { NewWeddingForm } from './new-wedding-form';

export const metadata = { title: 'Casamentos' };

export default async function WeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { supabase, agency } = await getPanelContext('/painel/casamentos');
  if (!agency) return null;
  const { novo } = await searchParams;

  const { data: weddings } = await supabase
    .from('weddings')
    .select(
      'id, partner1_name, partner2_name, wedding_date, venue_name, city, wedding_members(role)',
    )
    .eq('agency_id', agency.id)
    .order('wedding_date', { ascending: true, nullsFirst: true });

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Casamentos</h1>
        {novo ? null : (
          <Link className="button" href="/painel/casamentos?novo=1">
            Novo casamento
          </Link>
        )}
      </div>

      {novo ? (
        <div className="card stack">
          <h2>Novo casamento</h2>
          <NewWeddingForm />
        </div>
      ) : null}

      <div className="card stack">
        {!weddings?.length ? (
          <p className="muted">Nenhum casamento cadastrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Casal</th>
                <th>Data</th>
                <th>Local</th>
                <th>Noivos no app</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {weddings.map((w) => {
                const coupleAccounts = w.wedding_members.filter((m) => m.role === 'couple').length;
                const href = `/painel/casamentos/${w.id}`;
                return (
                  <tr key={w.id}>
                    <td>
                      <Link href={href}>
                        {w.partner1_name} e {w.partner2_name}
                      </Link>
                      {isActiveEvent(w.wedding_date) ? null : (
                        <span className="badge" style={{ marginLeft: 8 }}>
                          realizado
                        </span>
                      )}
                    </td>
                    <td>{formatWeddingDate(w.wedding_date)}</td>
                    <td>{[w.venue_name, w.city].filter(Boolean).join(' · ') || '—'}</td>
                    <td>{coupleAccounts} de 2</td>
                    <td>
                      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <Link className="button secondary small" href={href}>
                          Ver
                        </Link>
                        <Link className="button secondary small" href={`${href}/editar`}>
                          Editar
                        </Link>
                        {agency.role === 'owner' ? (
                          <Link className="button danger small" href={`${href}#excluir`}>
                            Excluir
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
