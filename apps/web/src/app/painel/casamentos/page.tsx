import { isActiveEvent } from '@sr/shared';
import { getPanelContext } from '@/lib/agency';
import { formatWeddingDate } from '@/lib/format';
import { CoupleInviteButton } from './couple-invite-button';
import { NewWeddingForm } from './new-wedding-form';

export const metadata = { title: 'Casamentos' };

export default async function WeddingsPage() {
  const { supabase, agency } = await getPanelContext('/painel/casamentos');
  if (!agency) return null;

  const { data: weddings } = await supabase
    .from('weddings')
    .select('id, partner1_name, partner2_name, wedding_date, city, wedding_members(role)')
    .eq('agency_id', agency.id)
    .order('wedding_date', { ascending: true, nullsFirst: true });

  return (
    <div className="stack">
      <h1>Casamentos</h1>
      <div className="card stack">
        <h2>Novo casamento</h2>
        <NewWeddingForm />
      </div>
      <div className="card stack">
        <h2>Seus casamentos</h2>
        {!weddings?.length ? (
          <p className="muted">Nenhum casamento cadastrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Casal</th>
                <th>Data</th>
                <th>Cidade</th>
                <th>Noivos no app</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {weddings.map((w) => {
                const coupleAccounts = w.wedding_members.filter((m) => m.role === 'couple').length;
                return (
                  <tr key={w.id}>
                    <td>
                      {w.partner1_name} e {w.partner2_name}
                      {isActiveEvent(w.wedding_date) ? null : (
                        <span className="badge" style={{ marginLeft: 8 }}>
                          realizado
                        </span>
                      )}
                    </td>
                    <td>{formatWeddingDate(w.wedding_date)}</td>
                    <td>{w.city ?? '—'}</td>
                    <td>{coupleAccounts} de 2</td>
                    <td>{coupleAccounts < 2 ? <CoupleInviteButton weddingId={w.id} /> : null}</td>
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
