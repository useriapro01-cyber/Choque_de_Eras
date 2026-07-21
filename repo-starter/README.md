# Choque de Eras

**"O passado em campo. O futuro na prancheta."**

Manager de futebol casual e bilíngue — escolha o clube da sua vida, monte o time eterno com jogadores de eras históricas, dispute a Campanha Imortal.

**Comece por aqui:** leia `CLAUDE.md` (regras invioláveis do projeto) e `docs/tdmv-plano-operacional.md` (plano completo).

O protótipo original está em `prototipo/choque-de-eras.html` (referência). O jogo agora é **gerado** a partir de dados versionados — veja abaixo.

## Estrutura do projeto (TDMV-3)

Dados separados do código; o `build` gera o artefato single-file.

```
data/                     ← FONTE DA VERDADE (nunca editar elenco em código)
  clubes.json             países, bandeiras, cores dos clubes do coração
  adversarios.json        adversários históricos do modo Continental
  continental.json        squads do mercado Continental (ordem exata p/ determinismo)
  eras/<clube>.json       eras curadas jogáveis — 1 arquivo por clube do coração
                          { clube, pais, cor, ordem, eras:[{ano,tier,n,jog:[[nome,pos,força]×11]}] }
src/
  index.html              shell com marcadores /*@STYLES@*/ /*@DATA@*/ /*@APP@*/
  styles.css              estilos extraídos
  app.js                  motor + i18n + render (os dados entram via build)
scripts/
  validar-eras.mjs        o PORTEIRO: 11 jog / 6 posições / sem duplicata / tier / subtítulo
  build.mjs               valida → injeta dados → dist/choque-de-eras.html (single-file)
tests/
  dados.test.mjs          afirma os invariantes de dados via porteiro
  bot-regressao.test.mjs  ≥150 campanhas Continental + ≥30/clube contra o dist
  harness/carregar-motor.mjs  carrega o motor do dist num sandbox headless
dist/
  choque-de-eras.html     ARTEFATO gerado — abre instantâneo em link de WhatsApp
```

### Comandos

```
npm run validate   # roda só o porteiro sobre data/
npm run build      # valida + gera dist/choque-de-eras.html
npm test           # porteiro + testes (node --test)
npm run dev        # build e aponta o arquivo para abrir
```

**Regra de ouro:** para adicionar/corrigir uma era, edite apenas `data/eras/<clube>.json` e rode `npm run build`. Nada entra no jogo sem passar pelo porteiro.

### Suíte de regressão por bot
`tests/harness/carregar-motor.mjs` carrega o motor **do artefato `dist/` gerado** num sandbox `vm` com stubs de DOM (só a camada de render é neutralizada), expondo as funções internas. `tests/bot-regressao.test.mjs` dirige ≥150 campanhas Continental + ≥30 por clube e afere, contra o dist: 0 erros de runtime, 0 violações de suspensão/lesão (jogador com `fora>0` nunca vai a campo), adversário nunca é o clube do coração, mercado do Meu Clube só traz o próprio clube, e distribuição de tiers 55/35/10 (±4 p.p.). Rode com `npm test`.

## Status
Fase 1/2 — Fundação. Marca definida (Choque de Eras). TDMV-3 concluído (dados/código/build/testes). Backlog em `CLAUDE.md`.

## Pendência de identidade visual
O ícone do logo (fusão ampulheta + linha tática) está aproximado em SVG inline no protótipo. Para app icon, redes sociais e materiais impressos, produzir peça vetorial definitiva com designer ou geração de imagem + refinamento humano.
