import { PLANNER_PLANS, type PlannerPlanCode } from '@sr/shared';
import { getPanelContext } from '@/lib/agency';
import { removeStaff, toggleStaffAssignment } from '../actions';
import { StaffInviteButton } from './staff-invite-button';

export const metadata = { title: 'Equipe e acessos' };

export default async function TeamPage() {
  const { supabase, agency, user } = await getPanelContext('/painel/equipe');
  if (!agency) return null;

  const [{ data: members }, { data: weddings }, { data: assignments }] = await Promise.all([
    supabase.from('agency_members').select('user_id, role').eq('agency_id', agency.id),
    supabase
      .from('weddings')
      .select('id, partner1_name, partner2_name')
      .eq('agency_id', agency.id)
      .order('wedding_date', { ascending: true, nullsFirst: true }),
    supabase.from('agency_wedding_staff').select('wedding_id, user_id'),
  ]);

  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ids)
    : { data: [] };
  const nameOf = (id: string) =>
    profiles?.find((p) => p.id === id)?.full_name ?? (id === user.id ? 'Você' : 'Sem nome');

  const isOwner = agency.role === 'owner';
  const plan = PLANNER_PLANS[agency.planCode as PlannerPlanCode];
  const staff = (members ?? []).filter((m) => m.role === 'staff');
  const assigned = new Set((assignments ?? []).map((a) => `${a.wedding_id}:${a.user_id}`));

  return (
    <div className="stack">
      <h1>Equipe e acessos</h1>
      <div className="card stack">
        <h2>Membros</h2>
        <p className="muted">
          {members?.length ?? 0} de {plan?.maxTeamLogins ?? 'ilimitados'} logins do plano{' '}
          {plan?.name}.
        </p>
        <table>
          <tbody>
            {(members ?? []).map((m) => (
              <tr key={m.user_id}>
                <td>{nameOf(m.user_id)}</td>
                <td>{m.role === 'owner' ? 'Dono' : 'Equipe'}</td>
                <td>
                  {isOwner && m.role === 'staff' ? (
                    <form action={removeStaff}>
                      <input type="hidden" name="userId" value={m.user_id} />
                      <button className="button danger" type="submit">
                        Remover
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isOwner ? <StaffInviteButton /> : null}
      </div>

      {isOwner && staff.length > 0 && weddings?.length ? (
        <div className="card stack">
          <h2>Em quais casamentos cada um atua</h2>
          <p className="muted">O dono vê todos os casamentos. A equipe vê só os liberados aqui.</p>
          <table>
            <thead>
              <tr>
                <th>Casamento</th>
                {staff.map((s) => (
                  <th key={s.user_id}>{nameOf(s.user_id)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weddings.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.partner1_name} e {w.partner2_name}
                  </td>
                  {staff.map((s) => {
                    const isAssigned = assigned.has(`${w.id}:${s.user_id}`);
                    return (
                      <td key={s.user_id}>
                        <form action={toggleStaffAssignment}>
                          <input type="hidden" name="weddingId" value={w.id} />
                          <input type="hidden" name="userId" value={s.user_id} />
                          <input type="hidden" name="assigned" value={isAssigned ? '1' : '0'} />
                          <button
                            className={isAssigned ? 'button' : 'button secondary'}
                            type="submit"
                            aria-pressed={isAssigned}
                            aria-label={`${nameOf(s.user_id)} em ${w.partner1_name} e ${w.partner2_name}`}
                          >
                            {isAssigned ? 'Liberado' : 'Liberar'}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
