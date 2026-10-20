# Decisões de arquitetura

Registro das decisões e do motivo de cada uma. Decisões novas entram no fim; decisões revistas ganham uma nota em vez de serem apagadas.

---

## D01 — Repositório fora do OneDrive

**Decisão:** o projeto fica em `D:\dev\sr-casamentos`, com backup no GitHub. O cache de pacotes do pnpm fica em `D:\.pnpm-store`.
**Atualização (20/10/2026):** movido de `C:\dev` para `D:\dev` porque o disco C: ficou sem espaço.
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
**Motivo:** o bundle ID definitivo precisa ser decidido antes do primeiro envio às lojas porque não pode ser trocado depois.
**Atualização (20/10/2026):** o nome **Sr. Casamentos** está confirmado. O domínio ainda não foi registrado; o bundle ID definitivo será derivado dele.

## D15 — Builds sem Mac

**Decisão:** builds de iOS pelo EAS Build na nuvem. Testes iniciais no tablet Android; no iPhone depois da conta Apple Developer.
**Motivo:** não há Mac disponível; instalar build de desenvolvimento no iPhone exige conta paga da Apple.

## D16 — Compras (proposta, decisão final na Etapa 5)

**Decisão provisória:** noivos compram por compra in-app nas lojas e pelo site; assinaturas de assessores só pela web, sem menção a compra no app do assessor. Detalhes e fontes em `docs/setup.md`.
**Motivo:** cumpre as regras das lojas com o menor custo e complexidade para começar.

## D17 — `nodeLinker: hoisted` no pnpm

**Decisão:** `node_modules` achatado, configurado em `pnpm-workspace.yaml`.
**Motivo:** o Metro (bundler do React Native) resolve dependências de forma mais previsível assim; é o caminho recomendado pela Expo para monorepos com pnpm.

## D18 — Versões das ferramentas

**Decisão:** TypeScript 6.0 (não o 7.0), ESLint 10 com typescript-eslint, Vitest, Turborepo, Expo SDK 58, Next.js 16.
**Motivo:** o typescript-eslint ainda não suporta o TypeScript 7. Versões publicadas há menos de alguns dias não entram (o pnpm 12 bloqueia por padrão e o Dependabot espera 7 dias) — proteção contra pacotes comprometidos.

## D19 — Erros de negócio com códigos estáveis

**Decisão:** as RPCs levantam erros com mensagens-código (`limite_eventos_ativos`, `convite_expirado`...) que o app traduz para pt-BR. Exceção: `accept_invite` devolve `{ ok: false, error }` em vez de levantar exceção.
**Motivo:** uma exceção desfaz a transação inteira, inclusive o registro da tentativa no limite de requisições — tokens inválidos não seriam contados e daria para tentar adivinhar convites sem limite.

## D20 — Permissões padrão revogadas no schema `public`

**Decisão:** `alter default privileges` remove as permissões automáticas que o Supabase dá a `anon`/`authenticated` em tabelas e funções novas; cada migration concede o necessário explicitamente.
**Motivo:** o teste de estrutura pegou a tabela `audit_log` recebendo acesso do anônimo por padrão. Com a revogação, esquecer um GRANT resulta em "sem acesso", nunca em "acesso demais".

## D21 — Exceções da auditoria de dependências

**Decisão:** três alertas (node-forge, braces, uuid) ficam ignorados em `pnpm-workspace.yaml`, com motivo e data de revisão.
**Motivo:** vêm de ferramentas de build da Expo (`@expo/cli`, Metro), que rodam só no computador e no CI; nenhuma tem correção compatível. Ignorar alerta por alerta mantém o CI barrando qualquer vulnerabilidade nova.

## D22 — Cadastro só por Google/Apple, com gancho no banco

**Decisão:** o login por e-mail fica ligado no Supabase, mas o gancho `before_user_created` recusa cadastros que não sejam Google ou Apple. Contas demo/admin são criadas direto no banco.
**Motivo:** nesta versão do Supabase, desligar o cadastro por e-mail também desliga o login por e-mail, o que impediria as contas demo exigidas pelas lojas.

## D23 — Consentimento por versão dos documentos

**Decisão:** antes de usar o app (noivos) ou criar a assessoria (web), o usuário aceita Termos e Política na versão `LEGAL_DOCS_VERSION`; o aceite fica em `consents`. Ao publicar uma versão nova, basta mudar a constante para pedir novo aceite.
**Motivo:** LGPD — consentimento claro e comprovável. Os textos vivem em `docs/legal/` e o site os exibe a partir dali (fonte única para a revisão jurídica).

## D24 — Equipe do assessor usa o painel web

**Decisão:** na Etapa 1, o app do celular é para noivos (e família). Convites de equipe são aceitos no web; o app do assessor chega com o modo "Dia do evento" (Etapa 6).
**Motivo:** o painel web cobre o trabalho do assessor nas etapas 1–5; evita duas interfaces de gestão ao mesmo tempo.

## D25 — Login por e-mail com confirmação (revisa D08 e D22)

**Decisão:** além de Google e Apple, qualquer pessoa pode entrar com o e-mail: recebe um código de 6 dígitos (e um link) e só acessa depois de confirmar. Não há senha; a senha continua só para contas demo/admin. Google e Apple não pedem confirmação extra porque já entregam o e-mail verificado.
**Motivo:** pedido do responsável pelo produto — noivos convidados pelo assessor precisam poder usar um e-mail próprio. Exigir que o e-mail seja igual ao cadastrado pelo assessor foi descartado: quem usa "Ocultar meu e-mail" da Apple recebe outro endereço e ficaria bloqueado.
**Atenção:** em produção o Supabase precisa de um provedor de e-mail próprio (SMTP); o padrão envia pouquíssimos e-mails por hora.

## D26 — Destino por perfil depois do login

**Decisão:** `/inicio` decide: quem é da assessoria vai ao painel; noivos/família vão a `/casamento`; quem não tem vínculo escolhe "Vamos nos casar" (cria o casamento sem assessor) ou "Sou assessor(a)". O painel nunca obriga ninguém a criar assessoria.
**Motivo:** a noiva era forçada a cadastrar uma "assessoria" para entrar no web e passava a ver limites de eventos ativos, que só existem no plano do assessor. Noivos têm um casamento e plano por casamento (briefing, seção 5).
**Escopo:** a área dos noivos no web mostra o resumo, edita os dados e convida o par; o planejamento completo (Etapa 2 em diante) fica no app, como no briefing.

## D27 — WhatsApp com DDI (E.164)

**Decisão:** o telefone é guardado só com dígitos, no formato internacional (DDI + número, 8 a 15 dígitos). Para +55 o app valida DDD e o 9 do celular. O envio do convite usa o link `wa.me` (abre o WhatsApp de quem clica), sem a API paga.
**Motivo:** noivos podem ter número estrangeiro; o mesmo formato serve para a API oficial do WhatsApp na Etapa 4.

## D28 — Assessoria não aceita convite de noivos do próprio casamento

**Decisão:** `accept_invite` recusa convites de noivo/parceiro quando o usuário é da assessoria do casamento; a página do convite mostra com qual conta a pessoa está e oferece trocar.
**Motivo:** em teste, o assessor abriu o link no mesmo navegador e "gastou" o convite dos noivos, virando noivo do próprio casamento.

## D29 — Noivos também no navegador, com o mesmo app (Expo web)

**Decisão:** as telas dos noivos (Etapa 2 em diante) são escritas uma vez no app Expo e publicadas também para navegador (React Native Web), com layout adaptado a telas largas (menu lateral). O Next.js continua com o painel do assessor e as páginas públicas (site do casamento, RSVP, convites, páginas legais); a página `/casamento` do Next leva ao app web.
**Motivo:** pedido do responsável pelo produto (noivos completos no navegador). Escrever cada funcionalidade duas vezes dobraria o custo e criaria divergências entre as versões.
**Revisa:** D26 (escopo da área dos noivos no web).
