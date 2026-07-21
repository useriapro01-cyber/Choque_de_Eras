// Sweep bilíngue de telas (item (d) do CLAUDE.md) contra o dist gerado.
// Renderiza cada tela em PT e ES e verifica ausência de undefined / NaN /
// [object Object] / placeholder {x} não resolvido no HTML produzido.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

const LANGS = ['pt', 'es'];
const DEFEITOS = [
  ['undefined', /undefined/],
  ['NaN', /NaN/],
  ['[object Object]', /\[object Object\]/],
  ['placeholder não resolvido', /\{[a-zA-Z_]\w*\}/],
];

function scan(ctx, html, problemas) {
  if (!html || html.length < 20) { problemas.push(`${ctx}: HTML vazio (${html.length} chars)`); return; }
  for (const [nome, re] of DEFEITOS) {
    const m = html.match(re);
    if (m) {
      const i = m.index, trecho = html.slice(Math.max(0, i - 45), i + 45).replace(/\s+/g, ' ');
      problemas.push(`${ctx}: "${nome}" → …${trecho}…`);
    }
  }
}

test('sweep bilíngue de telas (PT+ES) sem undefined/NaN/template quebrado', () => {
  const api = carregarMotor();
  api.ativarRender();
  const problemas = [];
  const telasVistas = new Set();

  // renderiza o estado ATUAL nos dois idiomas (não altera o estado)
  const varrer = (ctx) => {
    telasVistas.add(api.S.screen);
    for (const lang of LANGS) {
      api.S.lang = lang;
      api.render();
      scan(`${ctx}/${lang}`, api.htmlApp(), problemas);
    }
  };

  const CORA = api.CORA_CLUBES[0][0];

  // ---- telas de menu / estáticas ----
  api.S.camp = null;
  api.S.screen = 'home'; varrer('home');
  const nick = api.S.profile.nick;
  api.S.profile.nick = ''; varrer('home-sem-apelido'); api.S.profile.nick = nick;
  api.S.screen = 'ajuda'; varrer('ajuda');
  api.S.screen = 'perfil'; varrer('perfil');
  api.S.screen = 'duelo'; varrer('duelo');
  api.S.screen = 'rankdia'; varrer('rankdia');
  api.S.salaCode = 'ABCDE'; api.S.screen = 'sala'; varrer('sala');
  api.S.setupCtx = 'livre'; api.S.setupSel = { modo: 'cont', cora: null }; api.S.screen = 'setup'; varrer('setup-cont');
  api.S.setupSel = { modo: 'cora', cora: CORA }; varrer('setup-cora');
  api.S.setupCtx = 'duelo'; varrer('setup-duelo');

  // ---- campanha Meu Clube (janela com badge de tier, eraNome) ----
  api.startCampaign('livre', 'sweep-cora', null, { modo: 'cora', cora: CORA, nome: 'Meu Eterno' });
  varrer('janela-cora');
  // variante: barra de pendência de contratação
  const c = api.S.camp;
  api.S.pend = { tipo: 'mercado', p: c.mercado.jog[0], pi: 0 }; varrer('janela-pendencia'); api.S.pend = null;
  // variante: barra de jogador selecionado
  api.S.sel = c.slots.findIndex(s => s.p); varrer('janela-selecao'); api.S.sel = null;

  // ---- partida ----
  api.startMatch(); varrer('jogo-inicio');
  for (let i = 0; i < 25 && !api.S.sim.fim; i++) api.tickMin(true);
  varrer('jogo-meio');
  let g = 0; while (!api.S.sim.fim && g++ < 100000) api.tickMin(true);
  varrer('jogo-fim');

  // ---- pós-jogo, incluindo os dois ramos de evento (com/sem escolha) ----
  api.encerrarPartida();
  if (!api.S.camp.fim) {
    varrer('posjogo');
    const comEscolha = acharEvento(api, ev => ev && ev.escolha);
    const semEscolha = acharEvento(api, ev => ev && !ev.escolha);
    if (comEscolha) { api.S.camp.evento = comEscolha; varrer('posjogo-evento-escolha'); }
    if (semEscolha) { api.S.camp.evento = semEscolha; varrer('posjogo-evento-simples'); }
  }

  // ---- fim de campanha: eliminado (natural), campeão e imortal (sintéticos) ----
  jogarAteOFim(api);
  varrer('fim'); // estado natural (tipicamente eliminado)
  // campeão
  const fc = api.S.camp;
  fc.campeao = true; fc.eliminado = false; fc.fim = true; fc.notaGrupo = null;
  fc.score = api.calcScore(); varrer('fim-campeao');
  // imortal (campanha perfeita)
  fc.score = Object.assign(api.calcScore(), { perfeito: true }); varrer('fim-imortal');

  // ---- campanha Continental (mercado sem tier, chave clube+ano) ----
  api.startCampaign('livre', 'sweep-cont', null, { modo: 'cont', cora: null, nome: 'Continental FC' });
  varrer('janela-continental');
  api.startMatch();
  let g2 = 0; while (!api.S.sim.fim && g2++ < 100000) api.tickMin(true);
  api.encerrarPartida();
  if (!api.S.camp.fim) varrer('posjogo-continental');

  // relatório
  console.log(`\n[sweep] ${telasVistas.size} telas distintas varridas em PT+ES: ${[...telasVistas].sort().join(', ')}`);
  if (problemas.length) { console.log('[sweep] PROBLEMAS:'); for (const p of problemas) console.log('  - ' + p); }

  // cobertura mínima das 11 telas do dispatch de render()
  const esperadas = ['home', 'setup', 'duelo', 'janela', 'jogo', 'posjogo', 'fim', 'rankdia', 'sala', 'perfil', 'ajuda'];
  for (const s of esperadas) assert.ok(telasVistas.has(s), `tela não coberta pelo sweep: ${s}`);
  assert.deepEqual(problemas, [], 'nenhuma tela deve conter undefined/NaN/template quebrado');
});

// sorteia eventos até achar um que satisfaça o filtro (efeitos colaterais aceitáveis no sweep)
function acharEvento(api, filtro) {
  for (let i = 0; i < 200; i++) {
    const ev = api.sortearEvento();
    if (filtro(ev)) return ev;
  }
  return null;
}

function jogarAteOFim(api) {
  let guarda = 0;
  while (!api.S.camp.fim && guarda++ < 10) {
    if (api.S.screen !== 'janela') { api.S.screen = 'janela'; }
    api.startMatch();
    let g = 0; while (!api.S.sim.fim && g++ < 100000) api.tickMin(true);
    api.encerrarPartida();
  }
}
