# Decisões de arquitetura

Registro das decisões e do motivo de cada uma. Decisões novas entram no fim; decisões revistas ganham uma nota em vez de serem apagadas.

---

## D01 — Repositório fora do OneDrive
**Decisão:** o projeto fica em `C:\dev\sr-casamentos`, com backup no GitHub.
**Motivo:** a sincronização do OneDrive trava arquivos e tenta enviar o `node_modules` (centenas de milhares de arquivos), o que quebra instalações e builds.

## D02 — Monorepo pnpm + Turborepo, TypeScript estrito
**Decisão:** `apps/mobile` (Expo), `apps/web` (Next.js), `packages/shared`, `packages/tokens`, `packages/db`, `packages/config`, `supabase/`.
**Motivo:** tipos, schemas zod e regras de plano compartilhados entre app, web e servidor, com um só lugar para mudar.

## D03 — Um único app Next.js
**Decisão:** painel do assessor, admin interno e páginas públicas (site do casamento, RSVP, privacidade, exclusão de conta) no mesmo app, separados por grupos de rotas.
**Motivo:** menos deploys e configuração para manter; dá para separar em subdomínios depois sem reescrever.

## D04 — Capacidades por plano com fonte única
**Decisão:** a fonte é `packages/shared/src/plans.ts`. Uma migration popula a tabela `plan_capabilities` com os mesmos valores, para que o banco também aplique limites (ex.: eventos ativos). Um teste no CI falha se as duas divergirem.
**Motivo:** o briefing exige regras centralizadas; o banco precisa delas para impor limites que o cliente não pode burlar.

## D05 — RLS testada em duas camadas
**Decisão:** pgTAP para as políticas e testes de integração com usuários de casamentos e assessorias diferentes. O CI falha se alguma tabela de `public` estiver sem RLS.
**Motivo:** isolamento entre casamentos e assessorias é o requisito de segurança mais crítico.

## D06 — Schema preparado para o modo offline
**Decisão:** IDs UUID (podem ser gerados no aparelho), `created_at`/`updated_at` em todas as tabelas, exclusão lógica onde fizer sentido.
**Motivo:** permite a sincronização da Etapa 6 sem refazer o schema. A escolha do banco local (expo-sqlite com sincronização própria ou PowerSync) fica para a Etapa 6.

## D07 — Sessão criptografada no aparelho
**Decisão:** chave de criptografia no `expo-secure-store`; sessão do Supabase criptografada no armazenamento local.
**Motivo:** o Secure Store tem limite de tamanho por item e a sessão pode ultrapassá-lo; é o padrão recomendado pelo Supabase.

## D08 — Provedores de login
**Decisão:**
- iOS: Google e Apple (nativos, `signInWithIdToken`).
- Android: só Google (nativo).
- Web: Google e Apple (OAuth).
- E-mail e senha restrito a contas marcadas como **demo** (revisores das lojas) e **admin**.
**Motivo:** a Apple exige um login equivalente ao Sign in with Apple só no iOS. Os revisores das lojas precisam de uma conta de demonstração que não dependa de Google/Apple pessoal.
**Atenção:** o segredo do Apple para a web expira a cada 6 meses; o login nativo não.

## D09 — Exclusão de conta com carência
**Decisão:** a exclusão fica pendente por **30 dias** (o usuário pode cancelar nesse período) e depois é definitiva. Disponível no app e por página web.
- Se um dos noivos exclui a conta, o casamento **continua** com o outro.
- Se o último membro do casal sai de um casamento sem assessor, o casamento entra na mesma carência e depois é excluído.
**Motivo:** escolha do responsável pelo produto; a carência evita perdas por engano.
**A revisar:** o prazo de 30 dias foi proposto por mim — confirmar.

## D10 — Propriedade dos dados em casamentos com assessor
**Decisão:** em casamento criado por assessor, o casamento pertence à **assessoria**. Se os noivos excluírem a conta, os dados pessoais deles são removidos, mas o casamento continua com a assessoria.
**Motivo:** escolha do responsável pelo produto. A política de privacidade precisa deixar isso claro (papéis de controlador/operador — revisão jurídica).

## D11 — Uma assessoria por casamento
**Decisão:** um casamento tem no máximo uma assessoria vinculada.
**Motivo:** simplifica permissões e cobrança.

## D12 — Localização
**Decisão:** só português (pt-BR), só reais (BRL), fuso `America/Sao_Paulo`. Datas guardadas em UTC no banco e exibidas no fuso de São Paulo.
**Motivo:** público do produto é brasileiro. Textos ficam centralizados para facilitar outro idioma no futuro, mas sem biblioteca de i18n agora.

## D13 — Geração do checklist e do orçamento iniciais
**Decisão:** a Etapa 1 coleta e salva os dados do onboarding; o checklist e a distribuição do orçamento são gerados na Etapa 2, quando existirem as tabelas de tarefas e orçamento.
**Motivo:** evita criar tabelas pela metade na Etapa 1.

## D14 — Identificadores provisórios
**Decisão:** enquanto o nome e o domínio não estão definidos, o app usa identificadores de desenvolvimento configurados em um só lugar (`app.config.ts`, via variáveis de ambiente).
**Motivo:** o nome do produto ainda pode mudar; o bundle ID definitivo precisa ser decidido antes do primeiro envio às lojas porque não pode ser trocado depois.

## D15 — Builds sem Mac
**Decisão:** builds de iOS pelo EAS Build na nuvem. Testes iniciais no tablet Android; no iPhone depois da conta Apple Developer.
**Motivo:** não há Mac disponível; instalar build de desenvolvimento no iPhone exige conta paga da Apple.

## D16 — Compras (proposta, decisão final na Etapa 5)
**Decisão provisória:** noivos compram por compra in-app nas lojas e pelo site; assinaturas de assessores só pela web, sem menção a compra no app do assessor. Detalhes e fontes em `docs/setup.md`.
**Motivo:** cumpre as regras das lojas com o menor custo e complexidade para começar.
