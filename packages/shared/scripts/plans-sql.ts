// Gera o SQL que sincroniza `public.plan_capabilities` com `src/plans.ts`.
// Uso: pnpm --filter @sr/shared plans:sql > supabase/migrations/<timestamp>_plans.sql
// Toda mudança de plano vira uma migration nova gerada por este script (D04).
import { COUPLE_PLANS, PLANNER_PLANS } from '../src/plans.ts';

const rows = [...Object.values(COUPLE_PLANS), ...Object.values(PLANNER_PLANS)].map((plan) => {
  const json = JSON.stringify(plan).replaceAll("'", "''");
  return `  ('${plan.code}', '${plan.audience}', '${json}'::jsonb)`;
});

process.stdout.write(
  [
    '-- Gerado por packages/shared/scripts/plans-sql.ts. Não edite à mão.',
    'insert into public.plan_capabilities (code, audience, capabilities) values',
    rows.join(',\n'),
    'on conflict (code) do update',
    '  set audience = excluded.audience, capabilities = excluded.capabilities;',
    '',
  ].join('\n'),
);
