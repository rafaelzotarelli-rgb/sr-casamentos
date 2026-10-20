# Sr. Casamentos — briefing para desenvolvimento

Você vai criar do zero, em um repositório git local, o **Sr. Casamentos**: um app de assessoria de casamentos para iPhone e Android, com um painel web para assessores e um app de operação para o dia do evento.

**Antes de escrever qualquer código:** leia este documento inteiro, proponha a arquitetura e o plano detalhado da Etapa 1, liste as perguntas que faltarem e espere a minha aprovação. Trabalhe uma etapa por vez e só avance quando eu aprovar a anterior.

---

## 1. Perfis de usuário

| Perfil | Onde usa | O que faz |
|---|---|---|
| **Noivos** (até 2 contas por casamento) | App iOS/Android | Planejam o casamento |
| **Família / ajudantes** | App | Acesso limitado, liberado pelos noivos |
| **Assessor** | Painel web + app | Gerencia vários casamentos e opera o dia do evento |
| **Equipe do assessor** | Painel web + app | Acesso aos casamentos que o assessor liberar |
| **Convidado** | Sem conta: WhatsApp e página web | Confirma presença, vê o site, dá presentes |
| **Administrador do Sr. Casamentos** | Painel interno | Suporte, planos, moderação de avaliações |

Um casamento pode existir **sem assessor** (noivos cadastram sozinhos) ou **com assessor** (assessor cria e convida os noivos por link).

---

## 2. Funcionalidades — app dos noivos

### 2.1 Cadastro e onboarding
- Login com Google ou Apple.
- Onboarding em poucos passos: nomes do casal, data (ou "ainda não definimos"), cidade, número estimado de convidados, orçamento total estimado e estilo (clássico, rústico, praia, minimalista etc.).
- Com esses dados, o app gera automaticamente um checklist inicial e uma distribuição sugerida do orçamento por categoria.
- Entrada por convite do assessor: link que já vincula o casal ao casamento criado pelo assessor.
- Convite do(a) parceiro(a) para a segunda conta de noivos.

### 2.2 Início
- Contagem regressiva, local e porcentagem de planejamento concluída.
- Cartão de sugestão da IA (planos Plus/Premium), com ação de um toque. Ex.: "42 convidados não confirmaram. Enviar lembrete?".
- Resumo: confirmados / total de convidados, % do orçamento usado, contratos fechados / previstos.
- Próximas tarefas e próximos pagamentos.
- Nome do assessor responsável, quando houver.

### 2.3 Tarefas (checklist)
- Modelo inicial com tarefas organizadas por meses antes do casamento (12+, 9, 6, 3, 1 mês, última semana, dia do casamento).
- Criar, editar, concluir, atribuir a um dos noivos, à família ou ao assessor; prazo, categoria e observações.
- Origem da tarefa visível: manual, modelo, gerada por contrato, criada pelo assessor.
- Tarefas atrasadas destacadas.
- Sincronização com **Google Agenda** e **Apple Calendário** (planos Plus e Premium): o usuário escolhe a agenda; tarefas com prazo e pagamentos viram eventos com lembrete; alterações no app atualizam a agenda.

### 2.4 Orçamento e calculadora orçamentária
- **Calculadora:** a partir de orçamento total, número de convidados, cidade e estilo, sugere quanto destinar a cada categoria (local, buffet, bebidas, decoração, foto e vídeo, música, vestido e traje, convites, lembrancinhas, lua de mel, reserva para imprevistos). Mostra custo por convidado e permite simular cenários (ex.: "e se forem 150 convidados?").
- Por categoria: valor previsto, valor contratado, valor pago, valor a pagar.
- Alerta quando uma categoria ultrapassa o previsto, mostrando o impacto no total.
- Gráfico de pago / a pagar / livre.
- Campos visíveis só para o assessor (ex.: comissão), conforme permissões.

### 2.5 Pagamentos
- Cada contrato tem plano de pagamento: sinal, parcelas, datas, forma (Pix, boleto, cartão, dinheiro).
- Marcar parcela como paga, anexar comprovante (foto ou PDF).
- Lembretes antes do vencimento (notificação e, se ativado, agenda).
- Calendário de pagamentos e lista de vencidos.
- O app **registra** pagamentos; não movimenta dinheiro entre noivos e fornecedores nesta versão.

### 2.6 Fornecedores e avaliações
- Lista de fornecedores do casamento, por categoria e status: pesquisando, orçamento pedido, negociando, contratado, descartado.
- Ficha do fornecedor: contatos, redes sociais, faixa de preço, fotos, orçamentos recebidos (anexos), observações.
- Comparação lado a lado de orçamentos da mesma categoria.
- **Fornecedores sugeridos pelo assessor** aparecem com o selo "Indicado por [assessor]".
- **Duas notas separadas** em cada fornecedor da base:
  - **Nota dos assessores** (1 a 5): dada por assessores que trabalharam com ele.
  - **Nota dos noivos** (1 a 5): dada por casais que contrataram, liberada só após a data do casamento.
  - Critérios: pontualidade, qualidade, atendimento, custo-benefício, cumprimento do contrato; comentário opcional.
  - Uma avaliação por casamento por fornecedor; denúncia e moderação de avaliações abusivas.
- Botão "pedir orçamento" (abre WhatsApp ou e-mail do fornecedor com mensagem pronta).

### 2.7 Contratos com análise de IA
- Upload de PDF ou fotos do contrato (várias páginas), vinculado a um fornecedor.
- Planos Free: só armazenamento.
- Planos Plus/Premium — a IA:
  - Resume o contrato em linguagem simples (o que está incluso, valor, forma de pagamento).
  - Extrai datas e prazos: parcelas, degustação, prova, envio do número final de convidados, montagem, prazo de cancelamento sem multa.
  - Destaca **pontos de atenção**: multas, reajustes, exclusividades, horas extras e seus valores, responsabilidades em caso de chuva/cancelamento.
  - **Gera tarefas e parcelas sugeridas** a partir dos prazos. O usuário revisa, edita e confirma antes de serem criadas — a IA nunca cria nada sozinha.
  - Valores de hora extra e quantidade de staff extraídos ficam disponíveis para a conferência do dia do evento (seção 4).
- Aviso claro: a análise da IA não substitui orientação jurídica.

### 2.8 Convidados, RSVP e mesas
- Importar contatos do celular (com permissão pedida no momento do uso) ou planilha; cadastro manual.
- Por convite: nome, telefone, grupo (família noiva, família noivo, amigos, trabalho), lado, número de adultos e crianças, restrições alimentares, observações.
- Status: não enviado, enviado, lido, confirmado, recusado, sem resposta.
- **RSVP por link web** (todos os planos): página simples onde o convidado confirma, informa acompanhantes e restrições.
- **RSVP por WhatsApp** (Premium): convite com botões "Vou" / "Não vou", respostas atualizam a lista em tempo real; lembretes automáticos para pendentes em datas configuráveis; contador da franquia de mensagens do casamento e compra de pacotes extras.
- Mapa de mesas: criar mesas, arrastar convidados, alertas de lugar sobrando/faltando, exportar lista por mesa.
- Lista de check-in gerada para o dia do evento (usada no app do assessor).
- Exportar convidados em planilha.

### 2.9 Site do casamento
- Página pública com endereço próprio (sr-casamentos/ana-e-pedro): história do casal, data, locais com mapa, dress code, hospedagem, fotos, RSVP.
- Free: modelo básico. Plus/Premium: modelos completos e personalização de cores.

### 2.10 Assistente de IA (Plus e Premium)
- Chat que conhece os dados do casamento: orçamento, contratos, convidados, tarefas, fornecedores.
- Exemplos: "onde dá para compensar o estouro da decoração?", "até quando posso cancelar o DJ sem multa?", "monte o cronograma do dia", "sugira fotógrafos dentro do meu orçamento".
- Pode **propor** ações (criar tarefa, ajustar orçamento, enviar lembrete); toda ação exige confirmação do usuário.
- Premium: sugestões proativas no início e por notificação (pagamentos próximos, convidados pendentes, prazos de contrato).
- Respostas sobre contratos sempre citam a cláusula de origem.
- Limite de uso por plano e por dia, para controle de custo.

### 2.11 Notificações
- Push para: tarefas e pagamentos próximos, novas confirmações de presença, mensagens do assessor, pedidos de aprovação de hora extra, sugestões da IA.
- Central de notificações no app e preferências por tipo.

### 2.12 Compartilhamento e permissões
- Noivos convidam família/ajudantes com acesso limitado (ex.: só convidados, sem financeiro).
- Quando há assessor, ele define o que os noivos veem e editam.

### 2.13 Planos e compras
- Tela de planos com comparação, compra do Plus ou Premium (pagamento único por casamento), upgrade de Plus para Premium pagando a diferença, pacotes extras de mensagens.
- Campo para código de indicação do assessor (cashback, seção 6).

---

## 3. Funcionalidades — painel web do assessor

- **Visão geral:** casamentos ativos, tarefas atrasadas, pagamentos da semana em todos os casamentos, contratos com pontos de atenção, próximos eventos.
- **Casamentos:** lista com data, progresso, RSVP e alertas; criar casamento e convidar os noivos por link; entrar em qualquer casamento e ver/editar tudo o que os noivos veem.
- **Meus fornecedores:** banco próprio de fornecedores com contatos, preços, fotos, tags, nota própria e nota dos noivos; histórico de casamentos em que cada um trabalhou; enviar sugestões de fornecedores a um casal com um clique; importar planilha.
- **Contratos:** todos os contratos de todos os casamentos, com os pontos de atenção da IA.
- **Financeiro:** calendário consolidado de pagamentos dos casais aos fornecedores, comissões do assessor (visíveis só para ele).
- **Modelos:** checklists e cronogramas do dia próprios do assessor, reutilizáveis em novos casamentos.
- **Equipe e acessos:** convidar membros da equipe e escolher em quais casamentos cada um atua.
- **Permissões dos noivos:** por casamento, o que os noivos podem ver e editar.
- **Minha marca** (Profissional e Agência): logo e cores aplicados ao app dos noivos daquele assessor.
- **Indicações e cashback:** código/link do assessor, casais que compraram por ele, cashback gerado, benefícios do assessor.
- **Plano e cobrança:** plano atual, uso de eventos ativos, upgrade, faturas.

---

## 4. Funcionalidades — app do assessor no dia do evento

Mesmo app (perfil assessor), em modo "Dia do evento", com tema escuro. **Precisa funcionar sem internet** e sincronizar quando o sinal voltar, resolvendo conflitos de forma previsível.

- **Ao vivo:** horário, local, horário contratado de encerramento; contadores de convidados presentes, staff presente, bebidas abertas, horas extras usadas.
- **Cronograma:** etapas do dia com horário, responsável e checklist; etapa atual destacada; atrasos registrados; aviso a fornecedores envolvidos.
- **Check-in de convidados:** busca por nome, marcação de chegada, acompanhantes extras não previstos, contagem em tempo real presentes x confirmados (dado importante para o fechamento com o buffet).
- **Staff:** para cada fornecedor, quantidade contratada (vinda do contrato) x presente; registro de faltas e atrasos; aviso ao fornecedor.
- **Bebidas consignadas:** itens, quantidade recebida, preço unitário do contrato; contagem de abertas com botões + e −; cálculo em tempo real do valor consumido e do que devolver; foto do estoque inicial e final; fechamento assinado na tela pelo fornecedor.
- **Horas extras:** registro de +30 min / +1 h por fornecedor, com valor do contrato; os noivos recebem o pedido no app para aprovar (ou aprovam antecipadamente um limite); valor entra no orçamento.
- **Ocorrências:** registro rápido com texto, foto e horário (atraso, quebra, problema com fornecedor).
- **Relatório de fechamento:** PDF com convidados presentes, staff, bebidas consumidas, horas extras, ocorrências e valores a acertar com cada fornecedor; enviado aos noivos e guardado no casamento.

---

## 5. Regras dos planos

Guarde as regras em configuração centralizada (uma tabela de "capacidades por plano"), nunca espalhadas pelo código.

### Noivos (pagamento único por casamento)
| | Free | Plus | Premium |
|---|---|---|---|
| Preço | R$ 0 | R$ 149 | R$ 299 |
| Tarefas, orçamento, calculadora, pagamentos, convidados, mesas, fornecedores, avaliações | ✓ | ✓ | ✓ |
| Upload de contratos (armazenamento) | ✓ | ✓ | ✓ |
| Site do casamento e RSVP por link | básico | completo | completo |
| Sincronização com Google/Apple Agenda | | ✓ | ✓ |
| Acesso para família/ajudantes | | ✓ | ✓ |
| Assistente de IA e análise de contratos | | ✓ | ✓ |
| RSVP e lembretes por WhatsApp (1.000 mensagens por casamento) | | | ✓ |
| IA proativa | | | ✓ |

### Assessores (assinatura mensal)
| | Free | Essencial | Profissional | Agência |
|---|---|---|---|---|
| Preço | R$ 0 | R$ 149 | R$ 299 | R$ 599 |
| Eventos ativos | 5 | 30 | 40 | ilimitado (uso justo: acima de 80 ativos, R$ 8 por evento adicional/mês) |
| Painel web, permissões, cronograma e check-in no dia | ✓ | ✓ | ✓ | ✓ |
| Banco de fornecedores | até 20 | ✓ | ✓ | ✓ |
| Bebidas, staff, horas extras e relatório de fechamento | | ✓ | ✓ | ✓ |
| IA para o assessor | | ✓ | ✓ | ✓ |
| Noivos recebem Plus incluído | | ✓ | ✓ | ✓ |
| Noivos recebem Premium incluído | | | ✓ | ✓ |
| Marca própria | | | ✓ | ✓ |
| Logins de equipe | 1 | 1 | 3 | ilimitado |

"Evento ativo" = casamento cadastrado cuja data ainda não passou. Ao atingir o limite, bloquear apenas a criação de novos eventos, nunca o acesso aos existentes.

---

## 6. Cashback por indicação

- Cada assessor tem código e link de indicação.
- Noivos que comprarem Plus ou Premium com o código recebem cashback: 10% no Plus, 15% no Premium.
- O cashback é liberado 7 dias após a compra (prazo de arrependimento do CDC); compras reembolsadas não geram cashback.
- Forma de uso: crédito no app (pacotes de mensagens, upgrade) ou crédito na lista de presentes. Deixe o pagamento por Pix preparado como opção desligada.
- Benefício do assessor: a cada 5 casais indicados que comprarem, 1 mês grátis no plano atual.
- Percentuais e regras em configuração. Registro completo (ledger) de cada crédito e débito, sem apagar histórico.

---

## 7. WhatsApp

- API oficial WhatsApp Cloud (Meta), em uma conta comercial do Sr. Casamentos, com suporte a **vários números** e distribuição dos casamentos entre eles.
- Modelos de mensagem escritos como **utilidade** (avisos objetivos sobre o evento, sem tom promocional), sempre começando pelo nome do casal ("Ana e Pedro convidam você...") e com opção de sair.
- Enviar só para números cadastrados pelos noivos.
- Webhook para status (enviado, entregue, lido) e respostas; respostas atualizam o RSVP.
- Controle da franquia por casamento, fila de envio respeitando os limites diários da conta, monitoramento da nota de qualidade de cada número com alerta ao administrador.
- Deixe a arquitetura preparada (sem implementar agora) para o assessor conectar o próprio número no futuro.

---

## 8. Stack sugerida (justifique se quiser mudar)

- Monorepo com pnpm + Turborepo, TypeScript estrito em tudo.
- App: Expo (React Native), Expo Router, EAS Build e EAS Submit.
- Web do assessor: Next.js.
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions, Realtime).
- IA: API da Anthropic (Claude), só pelo backend. Modelo mais barato para o chat e mais capaz para contratos; registre tokens usados por casamento para controle de custo.
- Pacote compartilhado de tipos, schemas (zod) e tokens de design.
- Banco local no app para o modo offline do dia do evento.

---

## 9. Login

- Google (Supabase Auth com login nativo) e **Apple** (obrigatório pela Apple quando há login de terceiros).
- Papéis e vínculos: usuário ↔ casamento (noivo, família), usuário ↔ assessoria (dono, equipe).
- Convites por link com expiração e uso único.
- Sessões com renovação segura; logout em todos os aparelhos.

---

## 10. Segurança e LGPD (desde a Etapa 1)

- Row Level Security em **todas** as tabelas, com testes automatizados provando que ninguém acessa dados de outro casamento ou de outra assessoria.
- Nenhum segredo no app ou no front-end. Chaves da Anthropic, da Meta e a service role do Supabase só no backend. `.env.example` documentado e `.env` no `.gitignore`.
- Tokens no armazenamento seguro do aparelho (expo-secure-store).
- Contratos, comprovantes e fotos em buckets privados, acessados por URLs assinadas de curta duração.
- Validação com zod no cliente e no servidor.
- Limite de requisições nas funções de IA, WhatsApp e convites.
- Verificação de assinatura dos webhooks da Meta.
- Contratos enviados e mensagens recebidas são dados **não confiáveis**: a IA só gera sugestões; nada é executado sem confirmação humana.
- Log de auditoria para pagamentos, permissões, exclusões e alterações de plano.
- Dependências verificadas no CI; nenhuma biblioteca abandonada.
- LGPD: consentimento claro, coleta mínima de dados dos convidados (terceiros), exportação de dados, exclusão de conta e de casamento, prazo de retenção definido. Rascunhos de política de privacidade e termos de uso em `docs/` para revisão jurídica.

---

## 11. Regras das lojas

- Exclusão de conta dentro do app **e** por página web.
- Privacy manifest do iOS, textos de permissão em português explicando cada uso (contatos, câmera, fotos, calendário, notificações), permissão pedida só no momento do uso.
- Respostas do Data Safety (Google) e das Privacy Nutrition Labels (Apple) em `docs/`.
- Compras digitais (Plus, Premium, pacotes) seguindo as regras atuais de compra in-app de cada loja. Pesquise as diretrizes vigentes e me apresente as opções, incluindo vender as assinaturas de assessores pela web.
- Target SDK do Android no nível exigido atualmente pelo Google Play.
- Sem rastreamento entre apps; se algum SDK rastrear, App Tracking Transparency.
- Conta de demonstração com dados de exemplo para os revisores das lojas.
- Acessibilidade: toque mínimo de 44px, rótulos para leitores de tela, contraste adequado, suporte a fonte maior.

---

## 12. Visual

Siga a identidade do protótipo: fundo `#FAF7F2`, texto `#221E1B`, cor principal vinho `#7A2E4F`, verde-sálvia `#4E6B5A` para status positivos, laranja `#A4501A` para alertas, títulos em Fraunces e textos em Inter. Modo "Dia do evento" com tema escuro (`#1C1A18`, destaque `#E3A6BF`). Navegação inferior dos noivos: Início, Orçamento, Convidados, Fornecedores, Assistente.

---

## 13. Etapas de produção

Em cada etapa: me diga primeiro o que **eu** preciso fazer manualmente (com passo a passo e onde colocar cada chave), espere eu confirmar, e só então implemente. Nunca invente chaves ou IDs.

### Etapa 0 — Contas e preparação (eu faço, você me orienta)
Crie `docs/setup.md` com o passo a passo de:
1. **CNPJ e número D-U-N-S** (necessário para publicar como empresa na Apple).
2. **Apple Developer Program** como organização (US$ 99/ano).
3. **Google Play Console** como organização (US$ 25, pagamento único). Confira o requisito atual de teste fechado antes da publicação.
4. **Google Cloud:** projeto, tela de consentimento OAuth e IDs de cliente para iOS, Android e web.
5. **Apple:** identificador do app, serviço "Sign in with Apple", chave para o Supabase.
6. **Supabase:** projeto de desenvolvimento e projeto de produção, separados.
7. **Expo/EAS:** conta e configuração do projeto.
8. **Anthropic:** chave de API com limite de gasto (usada a partir da Etapa 3).
9. **Meta Business + WhatsApp Business Platform:** verificação da empresa, números e primeiros modelos de mensagem. Comece já, pois a aprovação pode levar semanas (usado na Etapa 4).
10. **Domínio** (site dos casamentos, páginas de RSVP, política de privacidade, suporte e exclusão de conta) e e-mail de suporte.

### Etapa 1 — Fundação
Monorepo, CI (lint, typecheck, testes), schema do banco com migrations, RLS e testes, login Google + Apple, papéis, onboarding, convite de noivos pelo assessor, exclusão de conta, tokens de design, navegação base. **Entregue isto primeiro.**

### Etapa 2 — Noivos sem IA
Tarefas, calculadora e orçamento, pagamentos, fornecedores e avaliações, contratos (armazenamento), convidados, RSVP por link, mesas, site do casamento, notificações, acesso da família.

### Etapa 3 — IA e agenda
Assistente, análise de contratos com tarefas sugeridas, sincronização com Google/Apple Agenda, controle de uso por plano.

### Etapa 4 — WhatsApp
Modelos, envio de RSVP e lembretes, webhook, fila e limites, franquia e pacotes extras, monitoramento de qualidade.

### Etapa 5 — Assessor, planos e cashback
Painel web completo, equipe, marca própria, regras dos planos, compras nas lojas e na web, indicações e cashback.

### Etapa 6 — Dia do evento
Modo offline, cronograma ao vivo, check-in, staff, bebidas consignadas, horas extras com aprovação dos noivos, ocorrências e relatório de fechamento.

### Etapa 7 — Testes e publicação
- Testes de ponta a ponta dos fluxos principais e revisão de segurança (RLS, segredos, permissões).
- Builds de produção com EAS; **TestFlight** (iOS) e **teste interno/fechado** (Google Play) com assessores e casais reais.
- Textos e capturas de tela das lojas, política de privacidade e página de suporte publicadas, formulários de privacidade preenchidos, conta de demonstração para os revisores.
- Envio para revisão nas duas lojas e checklist do que fazer se o app for rejeitado.

---

## 14. Forma de trabalhar

- Commits pequenos e descritivos a cada passo.
- Testes para regras de negócio, planos e permissões.
- `README.md` com como rodar localmente, variáveis de ambiente e como gerar builds.
- `docs/decisoes.md` registrando decisões de arquitetura e o motivo de cada uma.
- Ao fim de cada etapa: o que foi feito, como eu testo, o que ficou pendente e o que preciso providenciar para a próxima.
