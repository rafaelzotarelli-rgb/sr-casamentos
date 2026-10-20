# Sr. Casamentos

App de assessoria de casamentos: app iOS/Android para noivos e assessores, painel web para assessores e, nas próximas etapas, o modo "Dia do evento".

- Briefing completo: [docs/briefing.md](docs/briefing.md)
- Contas e cadastros externos: [docs/setup.md](docs/setup.md)
- Decisões de arquitetura: [docs/decisoes.md](docs/decisoes.md)
- Rascunhos jurídicos (LGPD): [docs/legal/](docs/legal/)

## Estrutura

```
apps/mobile     App Expo (React Native + Expo Router) — noivos e assessores
apps/web        Next.js — painel do assessor, convites, exclusão de conta, páginas legais
packages/shared Regras de negócio, planos, schemas zod, datas e dinheiro (pt-BR)
packages/tokens Cores, tipografia e espaçamentos (app e web)
packages/db     Tipos gerados do banco
supabase/       Migrations, testes pgTAP de RLS, seed local, configuração
```

## Requisitos

- Node.js 24 LTS e pnpm (`npm install -g pnpm`)
- Docker Desktop (para o Supabase local)
- Fique fora de pastas sincronizadas (OneDrive): use algo como `D:\dev\sr-casamentos`

## Rodar localmente

```bash
pnpm install
pnpm db:start          # sobe o Supabase local e imprime URL e chaves
```

Copie os arquivos de exemplo e preencha com a "API URL" e a "Publishable key" impressas pelo `db:start`:

- `apps/web/.env.example` → `apps/web/.env.local`
- `apps/mobile/.env.example` → `apps/mobile/.env`

```bash
pnpm --filter @sr/web dev       # painel web em http://localhost:3000
pnpm --filter @sr/mobile dev    # app (tecle "w" para abrir no navegador)
```

**Contas de teste locais** (criadas por `supabase/seed.sql`, só no ambiente local), em "Acesso de demonstração":
`assessor@teste.local` e `noiva@teste.local`, senha `SrCasamentos2026`.

Para recriar o banco do zero (migrations + seed): `pnpm db:reset`.

## Verificações (as mesmas do CI)

```bash
pnpm lint
pnpm typecheck
pnpm test             # testes de regras de negócio, tokens e criptografia
pnpm db:test          # testes pgTAP: RLS e regras do banco
pnpm format:check
pnpm audit --prod --audit-level high
```

## Variáveis de ambiente

Só valores **públicos** vão nos `.env` dos apps (eles acabam dentro do app ou do site). Segredos — service role do Supabase, chave da Anthropic, tokens da Meta, segredos OAuth — ficam no painel do Supabase, em `supabase secrets set` (Edge Functions) e nos segredos do GitHub Actions. Veja os comentários em cada `.env.example`.

## Mudanças no banco

1. Crie uma migration nova em `supabase/migrations/` (nunca edite uma já aplicada em produção).
2. `pnpm db:reset && pnpm db:test`
3. Regere os tipos: `pnpm db:types`
4. Mudou um plano? Edite `packages/shared/src/plans.ts` e gere a migration com
   `pnpm --filter @sr/shared plans:sql > supabase/migrations/<timestamp>_plans.sql`.

## Builds do app (EAS)

Requer conta Expo (`docs/setup.md`, item 7). Na primeira vez: `npx eas-cli login` e `npx eas-cli init` dentro de `apps/mobile`.

```bash
cd apps/mobile
npx eas-cli build --profile development --platform android   # APK de desenvolvimento
npx eas-cli build --profile development --platform ios       # exige Apple Developer
npx eas-cli build --profile production --platform all
```

O login nativo com Google e Apple só funciona em build de desenvolvimento ou produção (não no Expo Go nem no navegador).
