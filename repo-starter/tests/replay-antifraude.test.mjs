// ANTI-FRAUDE (TDMV-5 Fase C) — a PROVA de que o replay server-side rejeita
// decisões forjadas/ilegais e só aceita uma campanha honesta e completa.
// Roda no Node contra o MESMO src/replay.js que a Edge Function usa (que é
// pura): não precisa de Deno nem de Supabase vivo. É o guardião do anti-fraude.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Engine from '../src/engine.js';
import { replayCampanha, submeterReplay, MAX_DECISOES } from '../src/replay.js';
import { carregarBruto, poolsIdioma } from '../scripts/carregar-dados.mjs';

const bruto = carregarBruto();
const dadosPara = lang => Engine.montarDados(
  { DB: bruto.DB, ERAS: bruto.ERAS, OPPS: bruto.OPPS }, poolsIdioma(bruto.nomes, lang));

const SEED = 'diario-2026-07-22';
const LANG = 'pt';

// Joga uma campanha HONESTA de verdade e RECORDA a lista de decisões.
// Decisões que o motor recusa com código (ok:false + erro) não entram na lista
// (o cliente honesto nunca as emitiria); assim a lista reproduz fielmente.
function campanhaHonesta(seed = SEED, lang = LANG) {
  const dados = dadosPara(lang);
  const camp = Engine.criarCampanha('diario', seed, null, { modo: 'cont', cora: null, nome: '' }, dados);
  const ds = [];
  const push = d => {
    const r = Engine.aplicarDecisao(camp, dados, d);
    if (!(r && r.ok === false && r.erro)) ds.push(d); // guarda só o que era jogável
    return r;
  };
  let guard = 0;
  while (!camp.fim && guard++ < 20) {
    push({ t: 'formacao', f: ['4-3-3', '4-4-2', '3-5-2'][camp.rodada % 3] });
    push({ t: 'estilo', e: ['of', 'eq', 're'][camp.rodada % 3] });
    push({ t: 'contratar', mercadoIdx: 0, slotIdx: 9 });
    push({ t: 'contratar', mercadoIdx: 1, slotIdx: 10 });
    push({ t: 'jogar' });
    if (!camp.fim) push({ t: 'evento', aceita: true });
  }
  const esperado = Engine.resultadoCampanha(camp, null);
  return { ds, dados, scoreEsperado: esperado.score.total, campeao: camp.campeao, eliminado: camp.eliminado };
}

const VERSAO = 'v-servidor-1';

test('HONESTO: campanha completa é ACEITA e o score bate com a simulação viva', () => {
  const h = campanhaHonesta();
  const r = replayCampanha({ Engine, dados: h.dados, seed: SEED, decisions: h.ds });
  assert.equal(r.ok, true, `campanha honesta deveria ser aceita, veio: ${JSON.stringify(r)}`);
  assert.equal(r.score, h.scoreEsperado, 'score do replay deve ser idêntico ao da simulação viva');
  assert.ok(h.campeao || h.eliminado, 'a campanha honesta deve estar concluída (campeão ou eliminado)');
  console.log(`\n[anti-fraude] honesto aceito: ${r.score} pts · ${h.campeao ? 'CAMPEÃO' : 'eliminado r' + r.rodada}`);
});

test('FRAUDE: orçamento estourado (rolar sem caixa) é REJEITADO', () => {
  // 1 roll grátis + 21 pagos (8 cada) drenam caixa de 170 → 2; o 23º roll não
  // tem caixa e o motor recusa com erro (rolar_caixa) => decisão rejeitada.
  const dados = dadosPara(LANG);
  const ds = Array.from({ length: 23 }, () => ({ t: 'rolar' }));
  const r = replayCampanha({ Engine, dados, seed: SEED, decisions: ds });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'decisao_rejeitada');
  assert.equal(r.tipo, 'rolar_caixa', 'deve ser o gate de caixa do motor (orçamento)');
});

test('FRAUDE: contratar jogador que não existe no mercado é REJEITADO', () => {
  const dados = dadosPara(LANG);
  const ds = [{ t: 'contratar', mercadoIdx: 9999, slotIdx: 9 }];
  const r = replayCampanha({ Engine, dados, seed: SEED, decisions: ds });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'decisao_fora_de_faixa');
  assert.equal(r.indice, 0);
});

test('FRAUDE: escalação em slot inexistente (índice fora) é REJEITADA', () => {
  const dados = dadosPara(LANG);
  const r = replayCampanha({ Engine, dados, seed: SEED, decisions: [{ t: 'mover', from: 0, to: 99 }] });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'decisao_fora_de_faixa');
});

test('FRAUDE: decisão de tipo desconhecido / forma malformada é REJEITADA', () => {
  const dados = dadosPara(LANG);
  for (const mau of [{ t: 'hackearScore' }, { t: 'contratar', mercadoIdx: 'x', slotIdx: 0 }, { t: 'estilo', e: 'turbo' }, { t: 'formacao', f: '9-0-1' }]) {
    const r = replayCampanha({ Engine, dados, seed: SEED, decisions: [mau] });
    assert.equal(r.ok, false, `deveria rejeitar ${JSON.stringify(mau)}`);
    assert.equal(r.erro, 'decisao_forma');
  }
});

test('FRAUDE: decisão APÓS a campanha encerrada é REJEITADA', () => {
  const h = campanhaHonesta();
  const ds = [...h.ds, { t: 'rolar' }]; // trailing após camp.fim
  const r = replayCampanha({ Engine, dados: h.dados, seed: SEED, decisions: ds });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'decisao_apos_fim');
});

test('FRAUDE: campanha incompleta (não concluída) é REJEITADA', () => {
  const dados = dadosPara(LANG);
  const r = replayCampanha({ Engine, dados, seed: SEED, decisions: [] });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'campanha_incompleta');
});

test('FRAUDE: payload acima do teto de decisões é REJEITADO', () => {
  const dados = dadosPara(LANG);
  const ds = Array.from({ length: MAX_DECISOES + 1 }, () => ({ t: 'rolar' }));
  const r = replayCampanha({ Engine, dados, seed: SEED, decisions: ds });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'decisoes_forma');
});

test('FRAUDE: seed do cliente inválida/ausente é REJEITADA', () => {
  const dados = dadosPara(LANG);
  const r = replayCampanha({ Engine, dados, seed: '', decisions: [] });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'seed_forma');
});

test('VERSÃO: cliente desatualizado é REJEITADO com mensagem clara (via submeterReplay)', () => {
  const h = campanhaHonesta();
  const r = submeterReplay({
    Engine, dados: h.dados, seed: SEED, decisions: h.ds,
    clientVersion: 'v-cliente-ANTIGO', serverVersion: VERSAO,
  });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'versao_desatualizada');
});

test('VERSÃO: cliente na mesma versão passa pelo gate e é ACEITO', () => {
  const h = campanhaHonesta();
  const r = submeterReplay({
    Engine, dados: h.dados, seed: SEED, decisions: h.ds,
    clientVersion: VERSAO, serverVersion: VERSAO,
  });
  assert.equal(r.ok, true);
  assert.equal(r.score, h.scoreEsperado);
});

test('ANTI-ADULTERAÇÃO: score injetado pelo cliente é IGNORADO (o servidor recalcula)', () => {
  const h = campanhaHonesta();
  // o cliente tenta enviar um score altíssimo no payload; o replay nem olha —
  // desestrutura só seed/decisions e recalcula o placar da simulação.
  const r = replayCampanha({ Engine, dados: h.dados, seed: SEED, decisions: h.ds, score: 999999, server_score: 999999 });
  assert.equal(r.ok, true);
  assert.equal(r.score, h.scoreEsperado, 'o score é o recalculado, nunca o alegado pelo cliente');
});
