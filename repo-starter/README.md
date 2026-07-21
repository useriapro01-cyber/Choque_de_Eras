# Choque de Eras

**"O passado em campo. O futuro na prancheta."**

Manager de futebol casual e bilíngue — escolha o clube da sua vida, monte o time eterno com jogadores de eras históricas, dispute a Campanha Imortal.

**Comece por aqui:** leia `CLAUDE.md` (regras invioláveis do projeto) e `docs/tdmv-plano-operacional.md` (plano completo).

O protótipo original está em `prototipo/choque-de-eras.html` (referência). O jogo agora é **gerado** a partir de dados versionados — veja abaixo.

## Estrutura do projeto

Dados separados do código; o `build` valida, injeta os dados e emite a PWA em `dist/`.

```
data/                     ← FONTE DA VERDADE (nunca editar elenco em código)
  clubes.json             países, bandeiras, cores dos clubes do coração
  adversarios.json        adversários históricos do modo Continental
  continental.json        squads do mercado Continental (ordem exata p/ determinismo)
  eras/<clube>.json       eras curadas jogáveis — 1 arquivo por clube do coração
                          { clube, pais, cor, ordem, eras:[{ano,tier,n,jog:[[nome,pos,força]×11]}] }
src/
  index.html              shell: marcadores /*@STYLES@*/ /*@DATA@*/ /*@APP@*/ + tags PWA
  styles.css              estilos extraídos
  app.js                  motor + i18n + render (os dados entram via build)
  pwa/                    fontes da PWA (copiadas/carimbadas pelo build)
    manifest.webmanifest
    sw.js                 service worker (cache-first offline; versão via /*@VERSION@*/)
    icons/                icon.svg + PNGs 192/512/maskable/apple-touch (commitados)
scripts/
  validar-eras.mjs        o PORTEIRO: 11 jog / 6 posições / sem duplicata / tier / subtítulo
  build.mjs               valida → injeta dados → dist/ (index.html + PWA)
  gerar-icones.mjs        regenera os PNGs a partir dos SVGs (dev: npm i -D @resvg/resvg-js)
tests/
  dados.test.mjs          afirma os invariantes de dados via porteiro
  bot-regressao.test.mjs  ≥150 campanhas Continental + ≥30/clube contra o dist
  sweep-i18n.test.mjs     varredura das 11 telas em PT+ES sem undefined/NaN
  pwa.test.mjs            valida manifest/sw/ícones e o wiring no index.html
  harness/carregar-motor.mjs  carrega o motor do dist num sandbox headless
vercel.json               build/saída/headers para o deploy na Vercel
dist/                     ARTEFATO gerado (no .gitignore)
  index.html              entrada PWA, self-contained — abre instantâneo no WhatsApp
  choque-de-eras.html     cópia idêntica (compat. de links antigos)
  manifest.webmanifest · sw.js · icons/
```

### Comandos

```
npm run validate   # roda só o porteiro sobre data/
npm run build      # valida + gera a PWA em dist/
npm test           # porteiro + bot + sweep + pwa (reconstrói o dist antes)
npm run dev        # build e aponta o arquivo para abrir
```

**Regra de ouro:** para adicionar/corrigir uma era, edite apenas `data/eras/<clube>.json` e rode `npm run build`. Nada entra no jogo sem passar pelo porteiro.

### Suíte de testes
`tests/harness/carregar-motor.mjs` carrega o motor **do artefato `dist/` gerado** num sandbox `vm` com stubs de DOM, expondo as funções internas. Sobre ele:
- **`bot-regressao.test.mjs`** — dirige ≥150 campanhas Continental + ≥30 por clube e afere, contra o dist: 0 erros de runtime, 0 violações de suspensão/lesão (jogador com `fora>0` nunca vai a campo), adversário nunca é o clube do coração, mercado do Meu Clube só traz o próprio clube, distribuição de tiers 55/35/10 (±4 p.p.).
- **`sweep-i18n.test.mjs`** — ativa o render real e varre as 11 telas (com variantes: home com/sem apelido, setup cont/cora/duelo, janela com pendência/seleção, jogo início/meio/fim, pós-jogo com/sem evento de escolha, fim eliminado/campeão/imortal) em PT e ES, checando ausência de `undefined`/`NaN`/`[object Object]`/placeholder `{x}` não resolvido.
- **`dados.test.mjs`** — afirma os invariantes de dados via porteiro.

- **`pwa.test.mjs`** — valida o `dist` montado: manifest instalável (name/start_url/standalone/ícones 192/512+maskable), service worker carimbado com versão e com precache do shell, PNGs válidos nas dimensões certas, e o `index.html` referenciando manifest/ícones + registrando o SW.

Rode tudo com `npm test` (reconstrói o dist antes via `pretest`).

## PWA e deploy (Vercel)
O build emite uma PWA instalável: `manifest.webmanifest`, `sw.js` (cache-first — como o `index.html` é self-contained, cacheá-lo = jogo inteiro offline; a versão do cache é o hash do conteúdo, então cada deploy invalida o cache antigo) e ícones. O `vercel.json` fixa `buildCommand`/`outputDirectory` e os headers do SW.

**Ligar o auto-deploy (uma vez, no painel Vercel):**
1. New Project → Import Git Repository → `useriapro01-cyber/Choque_de_Eras`.
2. **Root Directory = `repo-starter`** (o projeto vive nessa subpasta).
3. Framework Preset = **Other**; Build Command `npm run build`; Output Directory `dist` (o `vercel.json` já define isso).
4. Production Branch = **`main`**. Deploy.

Feito isso, todo push em `main` publica sozinho. Regenerar ícones (se o logo mudar): `npm i -D @resvg/resvg-js && node scripts/gerar-icones.mjs && npm remove @resvg/resvg-js`.

## Status
Fase 2 — Produto core. Marca definida (Choque de Eras). TDMV-3 (estrutura) e TDMV-4 (PWA + deploy) concluídos; falta o import único do repo na Vercel. Backlog em `CLAUDE.md`.
