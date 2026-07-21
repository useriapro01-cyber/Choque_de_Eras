# CLAUDE.md — Choque de Eras

Manager de futebol casual e bilíngue (PT-BR / ES rioplatense): o jogador escolhe o clube da sua vida, o dado sorteia eras históricas do clube, ele monta o time eterno e disputa um torneio de 7 jogos contra esquadrões históricos da América. Web/PWA mobile-first. Este arquivo é a fonte de verdade do projeto — leia antes de qualquer tarefa.

## Estado atual
- Protótipo funcional em arquivo único: `prototipo/choque-de-eras.html` (motor completo, 5 clubes, 101 eras, 3 modos, i18n, conquistas, share).
- Escopo v1 aprovado pelo founder em jul/2026 (ver `docs/tdmv-plano-operacional.md`). Decisões travadas: web/PWA-first; economia "Modelo A calibrado" (all-in em lenda viável, não dominante); tiers de era 55/35/10 + Modo Sofrência opcional; ranking sem prêmios até validação jurídica; veto a patrocínio de casas de apostas.

## INVARIANTES — nunca violar, cobertos por teste
1. **Regras de futebol reais.** 2 amarelos no MESMO jogo = vermelho (fora do restante da partida, SEM substituição, + suspenso do próximo). Amarelos em jogos DIFERENTES = jogador segue em campo e cumpre só o próximo jogo. Vermelho direto raro existe. Máx. 5 substituições. Expulso não é substituído. Suspenso ou lesionado NUNCA é escalado. Empate só na fase de grupos; mata-mata tem prorrogação e pênaltis.
2. **Modo Meu Clube nunca sorteia o próprio clube como adversário.** Vale também para a futura mecânica Revanche.
3. **Determinismo por seed.** Mesma seed + mesmas decisões = mesmo resultado, sempre (base do Desafio do Dia, das salas e da validação anti-fraude server-side por replay). Nunca usar Math.random direto no fluxo de campanha; sempre o RNG semeado.
4. **Nada comprável afeta pontuação nos modos competitivos.** Monetização é cosmética/organizacional apenas.
5. **Toda era tem exatamente 11 jogadores reais cobrindo as 6 posições** (GOL, LAT, ZAG, VOL, MEI, ATA), sem nomes duplicados, com subtítulo factual sóbrio (sem apelidos inventados). Clubes BR em PT, AR/UY em ES.
6. **Conteúdo ético.** Não incluir pessoas condenadas por crimes graves. O humor da Sofrência mira a era/elenco, nunca ataque pessoal a jogador nomeado.
7. **i18n completo.** Toda string visível existe em PT e ES; nada hardcoded em um idioma só.

## Testes obrigatórios (rodar após QUALQUER mudança de motor, dados ou telas)
- `npm test` deve cobrir: (a) validação de dados de eras (11/6 posições/sem duplicatas/tier válido); (b) bot de campanha — ≥150 campanhas Continental + ≥30 por clube: 0 erros de runtime, 0 violações de suspensão/lesão, adversário ≠ clube do coração, mercado só do próprio clube, nome custom preservado; (c) distribuição de tiers ≈ 55/35/10 (±4 p.p. em 600 sorteios); (d) varredura de telas nos 2 idiomas sem `undefined`/`NaN`/template quebrado.
- Calibração-alvo: título do bot 5-7% no Continental (humano ~10-15%). Curva por fase: vitória esperada ~75-80% grupos → ~45-50% final. Se um ajuste sair dessas faixas, recalibrar antes de commitar.
- Os padrões de harness (stubs de DOM, janelaBot, sweep bilíngue) estão em `tests/` — portados do protótipo; mantê-los é obrigatório.

## Regras de design
- Identidade "transmissão premium": base navy (#0B1626), campo verde vivo de TV, cards claros, CTA verde (#29C46B), ouro (#E4B23A) reservado a tiers Dourada/troféus; Sofrência dessaturada 🌧️.
- **Contraste WCAG AA obrigatório em todo texto/botão** (lição do bug TDMV-1: botão claro exige texto escuro `--tinta`). Checar contraste faz parte do "done" de qualquer tela.
- Mobile-first (~380px), toques grandes, sem dependências pesadas; o jogo deve abrir instantâneo em link de WhatsApp.
- Iterar visual como protótipo/artefato até aprovação do founder ANTES de implementar no repo.

## Arquitetura-alvo (Fase 2)
- Separar conteúdo de código: eras em dados versionados (`data/eras/*.json`) + script de build → bundle do jogo. Nunca editar elenco em código.
- PWA instalável (manifest + service worker) hospedada em Cloudflare Pages/Vercel.
- Backend leve (Supabase): ranking diário com validação server-side — cliente envia lista de decisões, servidor re-simula com a seed e confere o score. Sem isso, nenhum prêmio/ranking oficial.

## Backlog imediato
- ~~TDMV-1: corrigir contraste dos botões claros + instituir checagem AA.~~ ✅ Concluído (jul/2026): CTA/velocidade em fundo ouro com texto escuro `#241a05`; checagem AA agora é parte do "done" de qualquer tela (ver Regras de design).
- TDMV-2: revisão editorial das eras pré-1990 (laterais/goleiros de confiança média) com fontes.
- ~~TDMV-3: migração arquivo único → projeto estruturado (dados/código/testes).~~ ✅ Concluído (jul/2026): dados em `data/` (eras por clube, continental, adversários, clubes); `npm run build` gera `dist/choque-de-eras.html` single-file com validação pelo porteiro (`scripts/validar-eras.mjs`), reconstrução verificada byte-a-byte vs. protótipo; suíte de bot (`tests/bot-regressao.test.mjs`, harness em `tests/harness/`) roda ≥150 campanhas Continental + ≥30/clube contra o dist — 0 erros/violações, tiers 55/35/10 (±4pp). `npm test` roda porteiro + bot.
- TDMV-4: PWA + deploy automático.
- TDMV-5: backend de ranking com replay validado.

## Expansão de conteúdo aprovada
Próximos clubes (nesta ordem de lote): Corinthians, São Paulo, Grêmio, Internacional, Cruzeiro, Atlético-MG, Vasco, Botafogo, Fluminense, Racing, Independiente, Peñarol, Nacional. Pipeline: pesquisa com fontes → planilha-fonte com campo de confiança → validação automática → revisão do conselho de torcedores → build. Meta: 2 clubes/semana. Mecânica Revanche (algozes históricos, ~15-20% dos mata-matas, badge ⚔️) entra após a base de algozes por clube ser curada.

## Uso de modelos
Sonnet como padrão de implementação; escalar para Opus/Fable em arquitetura, debugging difícil e decisões de design/curadoria; Haiku via API para lotes (triagem de reports, validação em massa). Em dúvida de produto/escopo, consultar `docs/tdmv-plano-operacional.md` — se o plano não cobre, perguntar ao founder em vez de assumir.
