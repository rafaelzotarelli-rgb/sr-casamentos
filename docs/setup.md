# Etapa 0 — Contas e preparação

Passo a passo das contas e cadastros que **você** precisa fazer. Nada aqui é código: são cadastros em serviços externos. Onde o item gera uma chave ou ID, está indicado **onde guardar** — nunca cole chaves secretas no chat nem em arquivos versionados.

> Pesquisa feita em 20/10/2026. Regras de lojas e de preços mudam com frequência; confira os links oficiais antes de cada decisão.

---

## Ordem recomendada (caminho crítico)

Alguns itens demoram semanas e travam outros. Comece por eles:

| Prioridade | Item                                          | Por que começar já                                                                                | Tempo típico |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| 1          | Decidir o **nome** e o **domínio**            | Bundle ID, tela de consentimento do Google, nome no WhatsApp e verificação da Meta dependem disso | sua decisão  |
| 2          | **CNPJ** e **D-U-N-S**                        | Apple e Google (conta de organização) exigem                                                      | até ~30 dias |
| 3          | **Meta Business** (verificação da empresa)    | Aprovação pode levar semanas; exige site no domínio                                               | 1–4 semanas  |
| 4          | **Apple Developer** e **Google Play Console** | Dependem do D-U-N-S                                                                               | 1–3 semanas  |
| —          | GitHub, Expo, Supabase dev                    | Rápidos; necessários já na Etapa 1                                                                | minutos      |

**O que dá para fazer sem o nome definido:** toda a Etapa 1 roda localmente e no Android com identificadores provisórios de desenvolvimento (`*.dev`). O nome e o bundle ID definitivo precisam estar decididos **antes do primeiro envio às lojas** — o bundle ID não pode ser trocado depois de publicado.

---

## 1. CNPJ e número D-U-N-S

### Sobre o seu CNPJ atual (com outra atividade)

Apple e Google aceitam qualquer pessoa jurídica regularmente constituída. O CNAE não é verificado pelas lojas, mas:

- A **razão social aparece nas lojas como vendedor** do app ("Vendido por …").
- A receita das vendas e assinaturas entra nesse CNPJ, então o enquadramento tributário precisa comportar venda de software/assinatura.

**Opções (decida com seu contador):**

- **A.** Usar o CNPJ atual e incluir um CNAE secundário de software (ex.: 6203-1/00 — desenvolvimento e licenciamento de programas não customizáveis; ou 6311-9/00 — tratamento de dados e hospedagem). Mais rápido.
- **B.** Abrir um CNPJ novo só para o Sr. Casamentos. Separa riscos, contabilidade e facilita sócios/investimento no futuro, mas atrasa tudo que depende do D-U-N-S.

### O que é o D-U-N-S

É um número de 9 dígitos, **gratuito**, emitido pela Dun & Bradstreet, que identifica empresas no mundo. A Apple e o Google usam para confirmar que a empresa existe e que o nome bate com o cadastro.

### Passo a passo

1. Tenha em mãos: razão social **exatamente** como no cartão CNPJ, endereço da sede, telefone e e-mail comercial.
2. Acesse a ferramenta de consulta da Apple: <https://developer.apple.com/enroll/duns-lookup/>.
3. Procure a empresa. Se já existir número, anote. Se não, solicite pela própria ferramenta (é gratuito; o pedido vai para a D&B).
4. A D&B pode ligar ou mandar e-mail para confirmar dados — responda rápido.
5. Depois de emitido, a Apple pode levar até ~2 dias úteis para reconhecer o número.

**Cuidado:** o nome legal digitado na Apple e no Google precisa ser idêntico ao do perfil na D&B. Divergências travam a matrícula.

**Onde guardar:** o número D-U-N-S não é segredo; anote em um gerenciador de senhas junto com os dados da empresa.

Referências: [Apple — D-U-N-S](https://developer.apple.com/br/help/account/membership/D-U-N-S/), [Apple — matrícula](https://developer.apple.com/br/help/account/membership/program-enrollment/).

---

## 2. Apple Developer Program (organização) — US$ 99/ano

> **Bloqueia o teste no iPhone.** Sem Mac, os builds de iOS são feitos na nuvem do EAS, mas instalar um build de desenvolvimento no seu iPhone exige uma conta paga da Apple. Até lá, testamos no tablet Android.

1. Crie (ou use) um Apple ID com autenticação de dois fatores, de preferência com e-mail da empresa.
2. Acesse <https://developer.apple.com/programs/enroll/> → **Enroll** → **Organização**.
3. Informe razão social, D-U-N-S, site da empresa e telefone. Quem faz a matrícula precisa ter poder legal para assinar pela empresa (sócio/administrador).
4. Pague a anuidade quando a Apple aprovar a verificação (há relatos de 1–2 semanas em análise para o Brasil).
5. Aceite os contratos em **App Store Connect → Business** (Paid Apps Agreement) e cadastre dados bancários e fiscais — necessário para vender Plus/Premium.

**Alternativa se o D-U-N-S demorar:** matricular como **pessoa física** (rápido, sem D-U-N-S) e depois pedir à Apple a migração para organização. Desvantagem: seu nome pessoal aparece como vendedor até a migração. Só recomendo se o prazo apertar.

---

## 3. Google Play Console (organização) — US$ 25, pagamento único

1. Acesse <https://play.google.com/console/signup> com uma conta Google da empresa.
2. Escolha **Organização**. Informe D-U-N-S, razão social e endereço idênticos ao perfil da D&B.
3. Pague a taxa e conclua a verificação de identidade da organização e do responsável.
4. Configure o **perfil de pagamentos** (Google Payments) com os dados da empresa para receber pelas vendas.

**Teste fechado antes da publicação:** contas **pessoais** criadas após 13/11/2023 precisam de um teste fechado com **12 testadores durante 14 dias seguidos** antes de liberar a produção. Contas de **organização** são dispensadas — mais um motivo para criar como organização. (Fontes de terceiros; confira na Central de Ajuda do Play Console no momento do cadastro.)

**Nível de API:** desde 31/08/2026, apps novos e atualizações precisam ter **target API 36 (Android 16)** ou superior. O projeto já nasce assim. Fonte: [Google Play — target API](https://developer.android.com/google/play/requirements/target-sdk).

---

## 4. Google Cloud — login com Google

> Necessário no passo 6 da Etapa 1 (login). Pode ser feito agora com identificadores de desenvolvimento.

1. Acesse <https://console.cloud.google.com/> → **Novo projeto** → nome `sr-casamentos`.
2. **APIs e serviços → Tela de consentimento OAuth (Google Auth Platform):**
   - Tipo: **Externo**.
   - Nome do app, e-mail de suporte, logo (pode ser provisório).
   - Domínios autorizados: o domínio definitivo (quando houver) e `supabase.co`.
   - Escopos: apenas `openid`, `email`, `profile`.
   - Deixe em **Teste** e adicione seu e-mail como testador até a publicação.
3. **Credenciais → Criar ID do cliente OAuth** — crie três:
   - **Aplicativo da Web**: em "URIs de redirecionamento autorizados", coloque `https://<ref-do-projeto>.supabase.co/auth/v1/callback` (eu te passo o valor exato).
   - **iOS**: bundle ID (eu te passo o de desenvolvimento).
   - **Android**: nome do pacote + impressão digital SHA-1 do certificado (eu te mostro como obter o SHA-1 do EAS).
4. Depois, para o **Calendário** (Etapa 3), adicionaremos o escopo da Google Agenda — isso exige verificação do app pelo Google.

**Onde guardar:**

- IDs de cliente (terminam em `.apps.googleusercontent.com`) não são secretos: vão no `.env` local e nas variáveis do EAS.
- O **segredo do cliente Web** é secreto: cole **só** no painel do Supabase (Authentication → Providers → Google).

---

## 5. Apple — identificador do app e Sign in with Apple

> Depende do item 2.

1. Em <https://developer.apple.com/account/resources/identifiers> crie o **App ID** com o bundle ID e marque **Sign in with Apple**.
2. Para o login na **web** (painel do assessor): crie um **Services ID** e configure o domínio e a URL de retorno `https://<ref-do-projeto>.supabase.co/auth/v1/callback`.
3. Em **Keys**, crie uma chave com **Sign in with Apple** habilitado e baixe o arquivo `.p8` (**só pode ser baixado uma vez**). Anote o Key ID e o Team ID.
4. Guarde o `.p8` em um gerenciador de senhas. **Nunca** coloque no repositório.

**Atenção:** o login Apple **nativo** no iPhone não expira. Já o login Apple **na web** usa um segredo gerado a partir do `.p8` que **expira a cada 6 meses** e precisa ser renovado no painel do Supabase — vamos registrar um lembrete. Fonte: [Supabase — Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple).

Decisão já tomada: Apple no iOS e na web; no Android só Google.

---

## 6. Supabase — projetos separados de desenvolvimento e produção

Você já tem conta.

1. Crie a organização `Sr. Casamentos` (se ainda não existir).
2. Crie o projeto **`sr-casamentos-dev`**, região **South America (São Paulo)**. Gere uma senha forte para o banco e guarde no gerenciador de senhas.
3. **Não crie o de produção ainda** — criaremos na Etapa 7 (evita custo e garante que produção só recebe migrations testadas).
4. Plano: Free serve para desenvolvimento. Lembre que projetos Free pausam após inatividade. Produção precisará do plano Pro (backups diários, sem pausa).

**Onde guardar:**

- `Project URL` e **publishable key** (antiga anon key): vão no `.env` local — não são secretas, a segurança vem da RLS.
- **secret key / service_role**: **nunca** no app nem no `.env` do app. Só nos segredos das Edge Functions e do CI (GitHub → Settings → Secrets).

---

## 7. Expo / EAS

1. Crie a conta em <https://expo.dev/signup> (de preferência com e-mail da empresa) e crie uma organização `sr-casamentos`.
2. Plano gratuito basta no início: inclui builds na nuvem limitados por mês e com fila. Se a fila atrapalhar, avaliamos o plano pago.
3. Nada a guardar agora; no momento do primeiro build eu te peço para rodar `eas login` no seu terminal.

Versão de referência: Expo SDK 56 (React Native 0.85). Se o SDK 57 estiver estável quando começarmos, uso o mais recente.

---

## 8. Anthropic — chave de API (Etapa 3)

1. Acesse <https://console.anthropic.com/> e crie uma organização com os dados da empresa.
2. Em **Billing**, adicione créditos e defina um **limite de gasto mensal** baixo para desenvolvimento.
3. Crie dois **workspaces**: `dev` e `prod`, cada um com sua chave e limite.
4. **Onde guardar:** somente nos segredos das Edge Functions do Supabase (`supabase secrets set`). Nunca no app, na web ou no repositório.

---

## 9. Meta Business + WhatsApp Business Platform (Etapa 4) — comece já

1. Crie o **Portfólio empresarial** em <https://business.facebook.com/> com os dados do CNPJ.
2. **Verificação da empresa** (Configurações → Central de segurança): pede documento da empresa, telefone/e-mail comercial e normalmente um **site no domínio da empresa** com os mesmos dados (razão social/CNPJ no rodapé). Por isso o domínio entra no caminho crítico.
3. Em <https://developers.facebook.com/> crie um app do tipo **Business** e adicione o produto **WhatsApp**.
4. **Números:** cada número precisa ser um chip/linha que **não** esteja em uso no app WhatsApp comum. Comece com 1 número; a arquitetura suportará vários.
5. **Nome de exibição:** precisa ser aprovado pela Meta e coerente com a marca — depende do nome final.
6. **Moeda:** contas podem ser cobradas em **BRL** desde 01/07/2026. Escolha BRL.
7. **Modelos de mensagem:** eu escrevo os textos (categoria **utilidade**) na Etapa 4 para você enviar à aprovação.

**Preço:** cobrança por mensagem de modelo, variando por categoria e país; a Meta só altera preços no 1º dia de cada trimestre. Utilidade é a categoria mais barata, mas a Meta pode reclassificar modelos com tom promocional para "marketing" (mais caro). Fonte: [Meta — preços](https://developers.facebook.com/docs/whatsapp/pricing).

**Onde guardar:** token de sistema, App Secret e Verify Token do webhook — só nos segredos das Edge Functions.

---

## 10. Domínio e e-mail de suporte

1. Decida o nome. Verifique disponibilidade em <https://registro.br/> (`.com.br` exige CNPJ ou CPF) e, se quiser, o `.com`.
2. Registre o domínio no CNPJ da empresa.
3. Crie e-mails no domínio: `suporte@`, `privacidade@` (encarregado LGPD) e `contato@`. Google Workspace ou Zoho Mail servem.
4. URLs que vamos publicar no domínio:
   - `/<nome-do-casal>` — site do casamento
   - `/rsvp/...` — confirmação de presença
   - `/privacidade`, `/termos`, `/suporte`
   - `/excluir-conta` — exigida pelo Google Play

**Onde guardar:** acesso ao registro.br e ao DNS no gerenciador de senhas. Eu te passo os registros DNS (Vercel/Supabase/e-mail) quando for a hora.

---

## Compras dentro do app — opções (para decidir até a Etapa 5)

Resumo das regras vigentes que afetam o Sr. Casamentos:

### Plus/Premium dos noivos e pacotes de mensagens

São recursos digitais desbloqueados no app → pela regra geral precisam de **compra in-app** (Apple 3.1.1; Google Play Billing). Formato: compra única por casamento (produto consumível/não renovável, vinculado ao casamento no nosso backend).

**Novidade no Brasil:**

- **Apple (iOS 26.5, desde jun/2026):** no Brasil é permitido, **ao lado** da compra in-app da Apple, oferecer um meio de pagamento próprio dentro do app e/ou um **link para comprar no nosso site**. Comissões anunciadas pela Apple: link para o site **15%** (10% no Small Business Program); compra no app com pagamento alternativo **10%** (Small Business) ou 21%; usando o pagamento da Apple, **+5%**. A Apple não faz reembolso dessas compras externas. Para menores de 18 anos não pode haver link. Fonte: [Apple Newsroom](https://www.apple.com/newsroom/2026/06/apple-announces-changes-to-ios-in-brazil/).
- **Google Play:** o Brasil está entre os países com **escolha de faturamento pelo usuário** (user choice billing). As novas taxas reduzidas (10% de serviço) começaram por EUA/Reino Unido/UE em 30/06/2026; o Google ainda não publicou a tabela do Brasil. Fontes: [Google Play — sistemas alternativos](https://support.google.com/googleplay/answer/11174377), [Android Developers Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html).

### Assinaturas dos assessores

- **Opção 1 — vender só pela web (recomendada para começar):** o assessor assina no painel web (Stripe, Pagar.me ou Mercado Pago com Pix/cartão/boleto). O app do assessor **não mostra preço nem botão de compra** — só faz login. Alguns apps B2B fazem isso como "serviço empresarial" (Apple 3.1.3(c)), mas essa exceção é estrita (venda direta a organizações para seus funcionários). Na prática, o caminho mais seguro é: app sem qualquer menção a compra para o perfil assessor.
- **Opção 2 — web + link externo no app (só Brasil):** usar a nova regra brasileira para colocar um link de assinatura no app, pagando 15% (ou 10%) à Apple.
- **Opção 3 — web + compra in-app também:** máxima conversão, maior custo e complexidade (assinatura nas duas lojas + web, conciliação).

### Recomendação inicial

- Noivos: compra in-app nas duas lojas **e** compra pelo site (RSVP/site do casamento já são web). Avaliar o link externo da Apple no Brasil depois de medir.
- Assessores: só web, sem menção a compra no app (Opção 1).
- O código de indicação do assessor funciona nos dois caminhos (aplicado no backend), mas cashback em compras in-app precisa considerar a comissão da loja — revisamos na Etapa 5.

Isso é uma leitura técnica das regras, não orientação jurídica.

---

## Checklist rápido

- [ ] Nome e domínio decididos
- [ ] Decisão sobre CNPJ (atual + CNAE ou novo) com o contador
- [ ] D-U-N-S solicitado/obtido
- [ ] Meta Business criado e verificação iniciada
- [ ] Apple Developer (organização) aprovado
- [ ] Google Play Console (organização) aprovado
- [ ] Google Cloud: projeto e tela de consentimento
- [ ] Supabase: projeto `sr-casamentos-dev` em São Paulo
- [ ] Expo: conta e organização
- [ ] GitHub: repositório privado `sr-casamentos`
- [ ] Anthropic (antes da Etapa 3)
- [ ] E-mails de suporte e privacidade no domínio
