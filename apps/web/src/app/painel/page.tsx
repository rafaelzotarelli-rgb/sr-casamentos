import { isActiveEvent, PLANNER_PLANS, type PlannerPlanCode } from '@sr/shared';
import Link from 'next/link';
import { getPanelContext } from '@/lib/agency';
import { formatWeddingDate } from '@/lib/format';

export default async function Overview() {
  const { supabase, agency } = await getPanelContext();
  if (!agency) return null;

  const { data: weddings } = await supabase
    .from('weddings')
    .select('id, partner1_name, partner2_name, wedding_date, city')
    .eq('agency_id', agency.id)
    .order('wedding_date', { ascending: true, nullsFirst: false });

  const plan = PLANNER_PLANS[agency.planCode as PlannerPlanCode];
  const active = (weddings ?? []).filter((w) => isActiveEvent(w.wedding_date));
  const upcoming = active.filter((w) => w.wedding_date).slice(0, 5);

  return (
    <div className="stack">
      <h1>Visão geral</h1>
      <div className="row">
        <div className="card" style={{ flex: '1 1 200px' }}>
          <p className="muted">Eventos ativos</p>
          <h2>
            {active.length}
            {plan?.maxActiveEvents ? ` de ${plan.maxActiveEvents}` : ''}
          </h2>
          <p className="muted">Plano {plan?.name ?? agency.planCode}</p>
        </div>
      </div>
      <div className="card stack">
        <h2>Próximos casamentos</h2>
        {upcoming.length === 0 ? (
          <p className="muted">
            Nenhum casamento com data marcada. <Link href="/painel/casamentos">Cadastrar</Link>
          </p>
        ) : (
          <table>
            <tbody>
              {upcoming.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.partner1_name} e {w.partner2_name}
                  </td>
                  <td>{formatWeddingDate(w.wedding_date)}</td>
                  <td className="muted">{w.city ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="muted">
        Tarefas atrasadas, pagamentos da semana e contratos com pontos de atenção chegam nas
        próximas etapas.
      </p>
    </div>
  );
}
