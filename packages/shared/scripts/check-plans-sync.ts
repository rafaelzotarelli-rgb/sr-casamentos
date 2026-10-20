// Confere se `public.plan_capabilities` no banco é igual a `src/plans.ts` (D04).
// Uso (o JSON vem do banco pela entrada padrão):
//   psql "$DB_URL" -At -c "select json_object_agg(code, capabilities) from plan_capabilities" \
//     | node packages/shared/scripts/check-plans-sync.ts
import { isDeepStrictEqual } from 'node:util';
import { COUPLE_PLANS, PLANNER_PLANS } from '../src/plans.ts';

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
// Remove o BOM que o PowerShell insere em pipes no Windows.
const input = Buffer.concat(chunks)
  .toString('utf8')
  .replace(new RegExp('^' + String.fromCharCode(0xfeff)), '');
const fromDb = JSON.parse(input) as Record<string, unknown>;

// Passa pelo JSON para comparar exatamente o que a migration grava.
const fromCode = JSON.parse(JSON.stringify({ ...COUPLE_PLANS, ...PLANNER_PLANS })) as Record<
  string,
  unknown
>;

if (!isDeepStrictEqual(fromDb, fromCode)) {
  console.error('plan_capabilities no banco difere de packages/shared/src/plans.ts.');
  console.error('Gere uma nova migration: pnpm --filter @sr/shared plans:sql');
  console.error(JSON.stringify({ banco: fromDb, codigo: fromCode }, null, 2));
  process.exit(1);
}

console.warn(`Planos sincronizados (${Object.keys(fromCode).length}).`);
