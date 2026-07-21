# TIME DA MINHA VIDA — Estudo de Viabilidade e Plano Operacional
**Versão 1.0 · Julho/2026 · Documento de decisão pré-desenvolvimento**

Este documento consolida os nove estudos solicitados e o plano de integração com o ecossistema Claude. O objetivo é fechar escopo antes de escrever qualquer linha de código nova, eliminando retrabalho. Cada seção termina com uma recomendação clara; as decisões que dependem de você estão reunidas na Seção 11.

---

## 0. Estado atual do protótipo

O que já existe e está testado: jogo single-file HTML bilíngue (PT-BR/ES rioplatense), dois modos de mercado (Continental e Meu Clube com 5 clubes), 101 eras curadas com 1.111 convocações validadas (11 jogadores e 6 posições por era), sistema de tiers Dourada/Sólida/Sofrência (~55/35/10 medido), nome de time customizável, regras de futebol corretas (cartões, suspensões, 5 substituições, expulsão sem reposição), motor determinístico por seed (essencial para o ranking justo — ver Seção 7), Desafio do Dia, salas de duelo que herdam modo/clube do criador, 11 conquistas, share estilo Wordle e suíte de testes automatizados por bot (300+ campanhas por rodada de validação, zero violações de regra).

**Backlog técnico conhecido (não corrigir agora, corrigir na Fase 2):**

- TDMV-1 · Contraste dos botões claros: no redesign, botões de fundo claro ("Simular", velocidade) ficaram com texto claro, ilegíveis (seu print). Correção trivial de CSS (texto escuro `--tinta` em botões claros) + adotar checagem de contraste WCAG AA como regra de design.
- TDMV-2 · Revisão editorial das eras pré-1990: craques corretos, mas 1-2 coadjuvantes por era antiga (laterais/goleiros dos anos 40-80) têm confiança média e merecem conferência contra fontes antes do lançamento público.
- TDMV-3 · Migrar de arquivo único para projeto estruturado (dados separados do código) — pré-requisito do pipeline de eras da Seção 3.

---

## 1. Roadmap operacional — as etapas que VOCÊ executa

O plano está dividido em seis fases. Em cada uma, separei o que é trabalho seu (decisões, contas, contatos, dinheiro) do que é trabalho delegável ao Claude. A regra de ouro para economizar créditos: **você decide e valida; o Claude pesquisa, produz e testa em lotes grandes**, nunca em micro-iterações.

### Fase 0 — Fechamento de escopo (1 semana, custo ~R$0)
Suas tarefas: ler este documento, responder o checklist da Seção 11, definir orçamento mensal máximo e data-alvo de beta. Verificar disponibilidade de domínio (ex.: `timedaminhavida.com.br` / `.app`) e de perfis sociais com o mesmo nome. Observação de marca: "Time da Minha Vida" é expressão de uso comum — o registro no INPI tende a sair como marca mista (nome + logotipo) e não lhe dará exclusividade sobre a expressão isolada; vale uma consulta rápida a um agente de marcas antes de investir pesado na identidade.

### Fase 1 — Fundação (1 semana, ~R$50-100)
Suas tarefas: comprar o domínio (Registro.br, ~R$40/ano); criar contas gratuitas em GitHub (código), Cloudflare Pages ou Vercel (hospedagem), Supabase (banco/ranking) e Plausible ou GA4 (métricas); assinar o plano do Claude que dará acesso ao Claude Code e Cowork (ver Seção 9.6). Trabalho do Claude: estruturar o repositório, migrar o protótipo, configurar deploy automático.

### Fase 2 — Produto core (2-3 semanas)
Suas tarefas: aprovar a direção visual final em protótipos estáticos ANTES da implementação (isso mata o ciclo caro de "não gostei, refaz"); testar cada build em seu celular com um roteiro de 10 minutos que o Claude fornecerá. Trabalho do Claude: corrigir TDMV-1, separar dados de código, implementar backend leve de ranking com validação server-side (Seção 7.3), PWA instalável.

### Fase 3 — Conteúdo (contínua, começa em paralelo à Fase 2)
Suas tarefas: recrutar o "conselho de torcedores" — 1-2 amigos torcedores fanáticos POR CLUBE que revisam as eras do próprio time (ninguém audita melhor que a torcida); priorizar os próximos clubes. Trabalho do Claude: pipeline da Seção 3, meta de 2 clubes novos/semana.

### Fase 4 — Beta fechado (2-4 semanas)
Suas tarefas: montar grupo de WhatsApp com 20-50 testers (misture torcidas!); rodar 2 semanas de Desafio do Dia interno; coletar feedback com o formulário que o Claude preparará; observar as métricas-guia: D1/D7 retention, taxa de share, campanhas por sessão. Trabalho do Claude: telemetria, correções, relatórios semanais de balanceamento.

### Fase 5 — Lançamento público (1 semana)
Suas tarefas: publicar nos grupos certos (torcidas, futebol retrô, fantasy), preparar 5 posts de lançamento (o Claude redige, você aprova), definir o regulamento do ranking. Trabalho do Claude: landing de divulgação, materiais, monitoramento.

### Fase 6 — Monetização (a partir do mês 2-3, com tração comprovada)
Suas tarefas: abrir MEI/CNPJ (DAS ~R$75/mês) — só aqui, não antes; prospectar 3-5 patrocinadores-alvo com o mídia kit (Claude produz no Cowork); validar juridicamente o modelo de prêmios (Seção 6.4) antes de anunciar qualquer prêmio. Trabalho do Claude: mídia kit, propostas comerciais, features premium do Bolão.

---

## 2. Web (landing/PWA) vs App de loja

| Critério | Web / PWA | App nas lojas |
|---|---|---|
| Custo de entrada | ~R$0 além do domínio | US$99/ano Apple + US$25 Google + wrapper |
| Distribuição no Brasil | **Link no WhatsApp abre na hora** — fricção zero | Instalar app mata 60-80% dos cliques de curiosidade |
| Atualizações | Instantâneas | Revisão de loja (horas a dias) |
| Taxa sobre vendas | 0% (pagamentos próprios: Pix/Stripe) | 15-30% para Apple/Google |
| Push notification | Existe em PWA, mas no iOS exige "adicionar à tela inicial" e é mais fraco | Forte — melhor ferramenta de retenção diária |
| Presença/status | Menor ("é um site") | Ícone no celular, ranking de loja |
| Manutenção | 1 base de código | 1 base + camada nativa |

**Recomendação: web-first como PWA, sem ambiguidade.** Seu motor de crescimento é o share no grupo de WhatsApp — um link que abre em 2 segundos vence qualquer loja nessa etapa. O jogo já é um HTML leve, então o custo de virar PWA é mínimo. O app entra na Fase 6+ como *wrapper* (Capacitor/TWA) da mesma base, quando duas condições forem verdade: retenção D30 comprovada e necessidade real de push para o Desafio do Dia. Assim você não paga o custo do app antes de ter o direito de precisar dele.

---

## 3. Pipeline de expansão da base de Eras

O gargalo do produto é conteúdo confiável. A lição das nossas iterações: gerar era é barato, **garantir que a torcida não encontre erro é o caro**. O pipeline separa os dois problemas em cinco estágios:

1. **Fonte da verdade fora do código.** Todas as eras vivem numa planilha/JSON versionado (clube, ano, tier, subtítulo factual, 11×[nome, posição, força], campo de "confiança" e "fonte"). Um script de build gera o arquivo do jogo. Nunca mais editar elenco dentro do HTML.
2. **Geração assistida com fontes.** Sessão de Cowork por clube: Claude pesquisa na web as escalações-base dos anos-alvo, preenche a planilha citando fonte por era e marcando confiança (alta/média). Regra herdada do que funcionou: dinastias geram eras-ano adjacentes com as trocas que a história registra — 1 pesquisa rende 4-6 eras.
3. **Validação automática.** O script que já usamos vira porteiro permanente: 11 jogadores, 6 posições, sem duplicatas, faixas de força coerentes com o tier, subtítulo presente. Nada entra no jogo sem passar.
4. **Revisão editorial humana.** O conselho de torcedores revisa só as eras do próprio clube com um checklist de 5 minutos por era ("esse cara jogou nesse ano?", "o subtítulo está certo?", "falta algum ídolo óbvio?"). É a etapa que compra credibilidade.
5. **QA contínuo pelo público.** Botão "🚩 reportar erro nesta era" dentro do jogo. Reports caem numa fila que o Claude (Haiku, em lote) tria semanalmente. Torcedor que reporta erro validado ganha crédito nos agradecimentos — transforma fiscal em fã.

Capacidade realista: 2 clubes/semana (~40-45 eras/semana) com 2-3h suas de coordenação. Leva de lançamento sugerida: os 5 atuais + Corinthians, São Paulo, Grêmio, Internacional, Cruzeiro, Atlético-MG, Vasco, Botafogo, Fluminense + Racing, Independiente, Peñarol, Nacional — 18 clubes cobrem ~90% do público-alvo BR/AR/UY. Expansão seguinte por votação da comunidade (engajamento grátis).

---

## 4. Seleção de adversários

Quatro sub-problemas, quatro soluções:

### 4.1 Curadoria por reconhecimento (o problema do "Nacional de 1970")
Você está certo: campeão histórico ≠ adversário emocionante. A base de adversários passa a ter um **tier de fama**, atribuído pelo "teste do boteco" para homens de 15-40 anos: **A-Icônico** (qualquer torcedor reconhece: Boca de Riquelme, River de Gallardo, Santos de Neymar, o Flamengo de 2019), **B-Conhecido** (torcedor médio reconhece: LDU 2008, Once Caldas 2004, Colo-Colo 91, São Caetano 2002) e **C-Cult** (só o entusiasta: Nacional 71, Estudiantes do tri). Regras de poda: pré-1980 só permanece quem é ultra-icônico (Santos de Pelé, Estudiantes de Verón pai — e olhe lá); tier C fica limitado a ~15% da base e nunca aparece em mata-mata. O sorteio pondera por fase: grupos podem trazer B e C (zebra tem seu charme na fase barata), mas **quartas em diante puxam quase só tier A** — dificuldade e fama devem crescer juntas, porque a final contra um desconhecido desperdiça o clímax.

### 4.2 Jogo da Revanche (algozes históricos)
Seu exemplo está correto — o Boca de Riquelme eliminou o Corinthians então campeão mundial nas oitavas da Libertadores de 2013 — e é exatamente o tipo de memória que vira mecânica. Proposta: tabela curada de 4-8 algozes por clube (derrotas que a torcida não esqueceu), e em cada campanha do Meu Clube há ~15-20% de chance de um confronto de mata-mata ser substituído por um algoz compatível com a faixa de força da fase, com badge **⚔️ REVANCHE** e bônus de pontos na vitória. Exemplos do dado inicial: Palmeiras×Boca 2000, Flamengo×Independiente 2017, River×Boca (Madrid) sob as duas óticas, Santos×Peñarol e Santos×Barcelona ficam fora por ora (recorte Libertadores), Corinthians×Boca 2013 quando o Timão entrar na base. É a feature de screenshot mais barata do jogo.

### 4.3 Nunca enfrentar o próprio clube
Concordo totalmente com o raciocínio de proteção do sentimento — e isso **já está implementado e coberto por teste automático** (filtro de adversários por clube do coração, 0 violações em 150 campanhas). No plano, vira invariante permanente da suíte: nenhuma mudança futura entra se quebrar essa regra. A tabela de Revanche respeitará o mesmo filtro.

### 4.4 Curva de dificuldade
O modelo atual já escala faixas de força por rodada (66-72 na estreia até 86-93 na final). O refinamento é calibrar por **taxa de vitória esperada por fase**, medida com o bot: alvo de ~75-80% de vitória na fase de grupos, ~65% nas oitavas, ~55% na semi e ~45-50% na final para um XI mediano. Isso codifica o realismo que você descreveu (os melhores avançam, o torneio aperta) sem tornar o título improvável — a taxa de título composta fica na casa de 10-15% para humanos, que é a zona "difícil mas viciante" dos jogos diários. A ferramenta de calibração já existe (suíte de bot); vira rotina automática a cada ajuste de dados.

---

## 5. Economia do jogo: budget × preço dos jogadores

A pergunta "Pelé a 150 com budget de 250 é viável?" é, na verdade, a decisão de design central do jogo. Três modelos possíveis:

**Modelo A — Estrela alcançável (Pelé = 60% do caixa).** Comprar o Rei é um all-in: sobra pouco para 4-5 reforços médios, o time fica "1 gênio + coadjuvantes". Vantagens: decisão dramática, screenshots incríveis, fantasia realizada. Riscos: campanha refém de uma lesão/suspensão do craque; se a lenda garantir título, todo mundo joga igual e o jogo empobrece.

**Modelo B — Lenda como evento raro (modelo atual).** Preço quadrático que acelera no topo; lendas custam caro o bastante para serem escolha excepcional, e o time equilibrado tende a vencer. Vantagens: profundidade estratégica, variedade de builds. Risco: se caro demais, ninguém nunca compra o Pelé — e um jogo sobre ídolos em que o ídolo é inacessível trai a promessa da marca.

**Modelo C — Teto salarial por rodada.** Mais fiel a manager, porém adiciona uma camada de contabilidade que briga com a pegada "partida de 10 minutos". Descartado para v1.

**Recomendação: Modelo A calibrado dentro da estrutura do B.** O all-in no Pelé DEVE ser viável (é o momento-assinatura do jogo), mas não dominante. Três salvaguardas garantem isso: (1) o caixa deve permitir exatamente a escolha "1 lenda + 4-5 medianos" **ou** "7-8 sólidos sem lenda" — duas estratégias vencedoras distintas; (2) a supressão defensiva do motor (já existente) impede que um único atacante lendário atropele sozinho uma defesa organizada; (3) o multiplicador zebra já recompensa o caminho oposto (vencer com time modesto), equilibrando o meta. Pelé permanece **o mais caro do jogo, sempre** — preço também é comunicação de status e ritual de respeito. Método de calibração (sem achismo): rodar a suíte de bot com as duas estratégias forçadas e ajustar caixa/curva até que ambas titulem em taxas próximas (±2 p.p.), monitorando no beta o "índice de diversidade": % de campanhas campeãs com lenda entre 35% e 55% é a zona saudável.

---

## 6. Custos operacionais e modelo de negócio

### 6.1 Custos em três cenários

| Item | Validação (mês 0-3) | Tração (mês 3-9) | Escala |
|---|---|---|---|
| Domínio | ~R$40/ano | idem | idem + .com |
| Hospedagem (Cloudflare/Vercel) | R$0 (free tier) | ~R$25-120/mês | R$300+ |
| Backend/ranking (Supabase) | R$0 (free tier) | ~R$130/mês | R$500+ |
| Métricas | R$0 | R$0-50 | R$100 |
| Assinatura Claude (dev) | seu plano atual | idem | + API p/ automações |
| MEI/contabilidade | R$0 (ainda não abre) | ~R$75-150/mês | contador PJ |
| Arte/som (opcional) | R$0 | R$500-2.000 pontuais | contínuo |
| **Total mensal** | **~R$0-150** | **~R$400-900** | **R$2-5 mil+** |

Preços de infraestrutura são ordem de grandeza de free tiers e planos de entrada — confirme os valores vigentes na contratação. A mensagem importante: **dá para validar o produto inteiro gastando quase nada além da sua assinatura Claude**, e a estrutura de custos só cresce depois que a receita aparece.

### 6.2 Fontes de receita, na ordem em que devem nascer
1. **Patrocínio do Desafio do Dia (receita-âncora).** "Desafio do Dia apresentado por [marca]" + prêmios semanais/mensais fornecidos pelo parceiro. É o modelo que sustenta jogos diários de nicho e casa com sua audiência segmentadíssima (homens 15-40, futebol, BR/AR). Alvos naturais: varejo esportivo, streaming de esportes, fintechs, marcas de consumo jovem. Ticket inicial realista: R$1-5 mil/mês por cota — já cobre o cenário de tração.
2. **Bolão/Liga premium (Seção 8.2).**
3. **Cosméticos e apoio** (escudo personalizado, títulos, cores, "sócio-torcedor" do jogo).

### 6.3 Um não importante
**Não aceite patrocínio de casas de apostas**, mesmo sendo o dinheiro mais fácil do futebol brasileiro: seu público declarado começa aos 15 anos, e a publicidade de bets para menores é vedada e cada vez mais fiscalizada — além do desgaste de marca junto a pais e escolas. Essa recusa, aliás, vira argumento de venda para patrocinadores family-friendly.

### 6.4 Alertas jurídicos (não sou advogado — valide antes de ativar)
Distribuição de prêmios atrelada a competição no Brasil pode se enquadrar como promoção comercial regulada (Lei 5.768/71, autorização junto à SPA/Ministério da Fazenda), com enquadramentos diferentes para concurso de habilidade vs sorteio — e o dado do mercado introduz elemento de sorte na discussão. Caminho recomendado: lance o ranking SEM prêmios; contrate uma consulta jurídica pontual (R$500-1.500) para desenhar o modelo de premiação correto; só então anuncie prêmios. Some a isso o básico de LGPD: coleta mínima (apelido, e-mail opcional), política de privacidade clara e atenção redobrada por haver menores na base.

---

## 7. Os três modos e a monetização dos modos 2 e 3

### 7.1 Campanha Livre
Permanece 100% gratuita e ilimitada: é o treino, o modo de mostrar o jogo pro amigo e o funil de entrada dos outros dois. Não se monetiza porta de entrada.

### 7.2 Desafio do Dia (ranking global)
Mecânica: mesma seed para todos, modo Continental (neutro entre torcidas — o Meu Clube daria vantagem a quem tem mais eras douradas), joga quantas vezes quiser, **vale a melhor pontuação e uma única posição por usuário**. Monetização em camadas que nunca tocam o competitivo: a receita principal é o patrocinador (naming + prêmios); a secundária é um **passe cosmético** (R$9,90-14,90/mês): badge no ranking, histórico completo, estatísticas avançadas, streaks, temas visuais. Regra inegociável: **nada comprável afeta pontuação** — pay-to-win mataria a credibilidade do ranking e, com ela, o patrocínio.

### 7.3 Anti-fraude (pré-requisito de qualquer prêmio)
Pontuação calculada no navegador é falsificável por qualquer um com F12. A arquitetura determinística que já construímos resolve isso com elegância: o cliente envia ao servidor apenas a **lista de decisões** (contratações, escalações, táticas); o servidor re-simula a campanha com a mesma seed e confere o placar. Barato de computar, impossível de forjar. Sem isso, prêmio nenhum deve existir.

### 7.4 Bolão entre amigos
Freemium: sala gratuita até 8 pessoas com ranking da rodada. **Liga paga** (R$14,90-19,90 por temporada, pago pelo organizador — modelo Cartola): mais membros, temporada de N rodadas com tabela, troféus de sala, título de "rebaixado da semana", painel do organizador e personalização. O comprador é o "presidente da liga" do grupo — uma pessoa paga, dez jogam, todos veem valor. É a monetização de maior conversão em produtos de futebol social no Brasil.

---

## 8. Razão entre eras Douradas × Sólidas × Sofrência

O dial atual (55/35/10) foi uma escolha de design; eis o estudo dos extremos:

**70/25/5 — "quase só glória".** Mercado forte, campanhas mais fáceis (exigirá recalibrar dificuldade), Sofrência vira evento raríssimo. Ganha-se poder de fantasia, perde-se a textura emocional e a conquista Redenção quase não acontece. A piada rara demais deixa de existir na memória coletiva dos jogadores.

**55/35/10 — atual.** A Sofrência aparece ~1-2 vezes por campanha: frequente o bastante para virar "história pra contar", rara o bastante para não irritar (queimar re-roll em era fraca é a fricção real). As Sólidas cumprem papel econômico: reforços honestos e baratos que impedem que só as Douradas importem.

**45/35/20 — "vida real".** Dobra a fricção do re-roll, derruba a força média do mercado e empurra a taxa de título para baixo; parte dos jogadores casuais lê como "o jogo me zoa demais". Interessante como *desafio*, ruim como padrão.

**Recomendação: manter 55/35/10 como padrão e transformar o extremo em feature** — um **Modo Sofrência** opcional (~30/30/40) com multiplicador de pontos ×1,5 e conquista própria, servindo de conteúdo de rejogabilidade e de evento temático (ex.: "Semana da Sofrência" no Desafio do Dia, que rende ótimo marketing). A decisão final deve ser guiada por telemetria do beta, com duas métricas-sentinela: taxa de re-roll imediato ao ver uma Sofrência (proxy de rejeição — acima de ~80% indica que o tier está só irritando) e participação da Redenção nas conquistas desbloqueadas (proxy de que o tier gera história, não só atrito).

---

## 9. Integração com o ecossistema Claude

Você declarou dois objetivos: construir o produto e evoluir suas habilidades com a ferramenta. O plano abaixo serve aos dois — cada fase do projeto exercita um módulo diferente.

### 9.1 Modelos por etapa

| Etapa do projeto | Modelo recomendado | Por quê |
|---|---|---|
| Estratégia, escopo, decisões de design, curadoria sensível de eras | **Claude Fable 5** | Máxima capacidade de raciocínio; erros aqui custam caro depois |
| Arquitetura do código e debugging difícil | **Fable 5 ou Opus 4.8** | Problemas cabeludos merecem o modelo mais forte |
| Implementação diária no Claude Code (features, refactors, testes) | **Sonnet 4.6** | Cavalo de batalha: excelente em código com melhor custo por tarefa |
| Tarefas em lote via API (triar reports de erro, validar planilhas de eras, gerar textos curtos) | **Haiku 4.5** | Rápido e barato para volume |

Regra prática: comece a sessão no modelo forte para decidir *o que* fazer, execute o volume no Sonnet, e desça para o Haiku quando a tarefa virar repetição em escala.

### 9.2 Claude Code (o coração do desenvolvimento)
É onde o protótipo vira produto. Práticas específicas deste projeto: criar o repositório Git e um **CLAUDE.md** com as leis do projeto — regras de futebol como invariantes ("2 amarelos no mesmo jogo = vermelho; acúmulo = só o próximo jogo; suspenso nunca escala; adversário nunca é o clube do coração"), obrigação de rodar a suíte de bots a cada mudança de motor/dados e as convenções de design (incluindo a regra de contraste que teria evitado o TDMV-1). Transformar nossos scripts de teste em comandos permanentes e criar uma **skill customizada "nova-era"** que recebe clube+ano, pesquisa, preenche a planilha, valida 11 jogadores/6 posições e roda os testes — assim a expansão de conteúdo vira um comando, não um projeto. Instalação e configuração: https://docs.claude.com/en/docs/claude-code/overview

### 9.3 Claude Cowork (pesquisa e operação de negócio)
Use para tudo que é conhecimento + documentos: sessões de pesquisa de eras com busca na web preenchendo a planilha-fonte (skill de Excel), o **mídia kit de patrocínio** em PowerPoint, estudos de concorrência, rascunhos de regulamento e os relatórios semanais de beta. O Cowork também orquestra os outros módulos (Chrome, Excel, PowerPoint) como ferramentas numa mesma sessão.

### 9.4 Artefatos e Design
Antes de codar qualquer tela no repositório, itere o visual como **artefato** (protótipo React/HTML) até você aprovar — é a prática que ataca diretamente sua dor de retrabalho: mudar um artefato custa centavos, mudar o produto custa uma sessão de Code. Um segundo uso poderoso: construir um **Editor de Eras** interno como artefato com IA embutida (artifacts podem chamar a API do Claude), onde você cola um elenco, ele valida em tempo real e exporta o JSON no formato do jogo.

### 9.5 Agentes e automação
Quando o jogo estiver no ar, as rotinas viram agentes: publicação automática do Desafio do Dia, validação noturna da integridade da base de eras, triagem semanal dos reports de erro (Haiku via API), rascunho do post diário de resultado do ranking. O caminho técnico é Claude Code rodando tarefas agendadas (CI/cron) e a API para os lotes. Os recursos de automação evoluem rápido — confirme o estado da arte em https://docs.claude.com antes da Fase 6.

### 9.6 Custos e planos
Sua assinatura atual cobre o desenvolvimento (Code + Cowork + artefatos); a API só entra quando houver automação em produção, e aí o custo escala com o uso do Haiku (baixo). Não vou chutar valores de planos e limites porque mudam: confira em https://support.claude.com e https://docs.claude.com/en/api/overview no momento da contratação.

### 9.7 Trilha de aprendizado sugerida (6 semanas)
Semana 1: Fable 5 no chat para fechar escopo (este documento é o exercício). Semana 2: Claude Code — repo, CLAUDE.md, primeiro deploy. Semana 3: artefatos de design até aprovar as telas. Semana 4: Cowork + skill de eras (pipeline de conteúdo). Semana 5: Code com Sonnet no volume de features + suíte de testes. Semana 6: primeira automação agendada + mídia kit no Cowork. Ao final, você terá usado cada módulo no contexto em que ele é a ferramenta certa — que é a habilidade que diferencia usuário avançado de usuário casual.

---

## 10. Riscos principais e mitigação

**Conteúdo errado** (torcedor acha erro de elenco) → pipeline da Seção 3 + conselho de torcedores + botão de report. **Fraude no ranking** → validação server-side por replay (7.3) antes de qualquer prêmio. **Dependência de um canal** (WhatsApp) → construir lista de e-mail desde o beta. **Jurídico de prêmios** → lançar sem prêmios, validar, então ativar (6.4). **Escopo inflando** → este documento é o contrato de escopo: feature nova só entra trocando de lugar com outra.

---

## 11. Decisões que preciso de você para iniciar a Fase 1

1. Orçamento mensal máximo para os primeiros 3 meses (referência: cenário Validação ≈ R$0-150 + sua assinatura Claude).
2. Data-alvo do beta fechado (sugestão: 6-8 semanas a partir do OK).
3. Domínio preferido (verificar disponibilidade antes de tudo).
4. Próxima leva de clubes: confirma a lista da Seção 3 (BR big 9 + AR/UY) ou ajusta?
5. Confirmação das recomendações-chave: web/PWA-first · Modelo A calibrado na economia · 55/35/10 + Modo Sofrência · ranking sem prêmios até validação jurídica · veto a patrocínio de bets.

Respondidas as cinco, a Fase 1 começa sem nenhuma ambiguidade de escopo — e sem retrabalho.
