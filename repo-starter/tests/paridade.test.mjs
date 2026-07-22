// TESTE DE PARIDADE (TDMV-5 Fase A) — o item central da fase.
// Prova que, para a MESMA seed + MESMA lista de decisões, o motor rodando
// standalone no Node (import de src/engine.js) produz resultado IDÊNTICO
// (score, gf/gs, campeão/eliminado, conquistas) ao motor embutido no jogo
// (o Engine dentro de dist/index.html). Também afere reprodutibilidade.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as EngineESM from '../src/engine.js';
import { carregarBruto, poolsIdioma } from '../scripts/carregar-dados.mjs';
import { carregarMotor } from './harness/carregar-motor.mjs';

const bruto = carregarBruto();

// Roda um cenário (seed + decisões) num dado motor+dados e devolve o RESULTADO.
function rodarCenario(Engine, dados, cfg) {
  dados.nomes = poolsIdioma(bruto.nomes, cfg.lang);
  const camp = Engine.criarCampanha('livre', cfg.seed, null,
    { modo: cfg.modo, cora: cfg.cora, nome: cfg.nome }, dados);
  for (const d of cfg.decisoes) { if (camp.fim) break; Engine.aplicarDecisao(camp, dados, d); }
  const profile = { nick: 'P', lang: cfg.lang, jogos: 0, titulos: 0, perfeitos: 0, recorde: 0, legado: 0, conq: [], dailyFeito: '' };
  return Engine.resultadoCampanha(camp, profile);
}

// dados frescos para o motor ESM (mesma origem do bundle: só DB/ERAS/OPPS)
const dadosESM = () => EngineESM.montarDados({ DB: bruto.DB, ERAS: bruto.ERAS, OPPS: bruto.OPPS });

// Uma lista de decisões fixa e determinística (não depende de estado de runtime).
function roteiro() {
  const ds = [];
  for (let r = 0; r < 7; r++) {
    ds.push({ t: 'formacao', f: ['4-3-3', '4-4-2', '3-5-2', '5-3-2'][r % 4] });
    ds.push({ t: 'estilo', e: ['of', 'eq', 're'][r % 3] });
    ds.push({ t: 'contratar', mercadoIdx: 0, slotIdx: 8 });
    ds.push({ t: 'contratar', mercadoIdx: 1, slotIdx: 9 });
    ds.push({ t: 'rolar' });
    ds.push({ t: 'contratar', mercadoIdx: 2, slotIdx: 10 });
    ds.push({ t: 'jogar' });
    ds.push({ t: 'evento', aceita: r % 2 === 0 });
  }
  return ds;
}

const CENARIOS = [
  { nome: 'Paridade FC', modo: 'cont', cora: null, lang: 'pt', seed: 'paridade-cont-1', decisoes: roteiro() },
  { nome: 'Paridade FC', modo: 'cont', cora: null, lang: 'es', seed: 'paridade-cont-2', decisoes: roteiro() },
  { nome: 'Meu Eterno', modo: 'cora', cora: bruto.CORA_CLUBES[0][0], lang: 'pt', seed: 'paridade-cora-1', decisoes: roteiro() },
  { nome: 'Meu Eterno', modo: 'cora', cora: bruto.CORA_CLUBES[3][0], lang: 'pt', seed: 'paridade-cora-2', decisoes: roteiro() },
];

test('motor standalone (Node) é determinístico: 2 execuções idênticas', () => {
  for (const cfg of CENARIOS) {
    const a = rodarCenario(EngineESM, dadosESM(), cfg);
    const b = rodarCenario(EngineESM, dadosESM(), cfg);
    assert.deepEqual(b, a, `mesma seed+decisões deve dar o mesmo resultado (${cfg.seed})`);
  }
});

// o dist roda num sandbox vm (outro realm): normaliza p/ o realm do Node antes de comparar
const doRealm = o => JSON.parse(JSON.stringify(o));

test('PARIDADE: motor no dist == motor standalone (mesma seed+decisões)', () => {
  const api = carregarMotor(); // motor embutido no dist/index.html gerado
  for (const cfg of CENARIOS) {
    const esm = rodarCenario(EngineESM, dadosESM(), cfg);
    api.S.lang = cfg.lang;
    const dist = doRealm(rodarCenario(api.Engine, api.dadosAtuais(), cfg));
    assert.deepEqual(dist, esm,
      `resultado divergente entre dist e standalone (${cfg.seed}):\n` +
      `  dist: ${JSON.stringify(dist.score)} gf${dist.gf} gs${dist.gs} camp=${dist.campeao} elim=${dist.eliminado}\n` +
      `  node: ${JSON.stringify(esm.score)} gf${esm.gf} gs${esm.gs} camp=${esm.campeao} elim=${esm.eliminado}`);
  }
  // amostra visível no log
  const s = rodarCenario(EngineESM, dadosESM(), CENARIOS[0]);
  console.log(`\n[paridade] ${CENARIOS.length} cenários idênticos dist↔node · ex.: ${CENARIOS[0].seed} → ` +
    `${s.score.total} pts, gf${s.gf}/gs${s.gs}, ${s.campeao ? 'CAMPEÃO' : s.eliminado ? 'eliminado r' + s.rodada : 'em curso'}`);
});
