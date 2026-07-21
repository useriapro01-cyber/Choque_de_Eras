// Suíte de regressão por bot (CLAUDE.md) contra o dist gerado:
//  - ≥150 campanhas Continental + ≥30 por clube do coração
//  - 0 erros de runtime, 0 violações de suspensão/lesão (fora>0 nunca em campo)
//  - adversário nunca é o clube do coração
//  - distribuição de tiers 55/35/10 (±4 p.p.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

const CONTINENTAL = 160;
const CORA_POR_CLUBE = 40;

// bot: joga uma campanha inteira, dirigindo o motor real; alimenta o acumulador.
function jogarCampanha(api, { modo, cora, nome, seed }, acc) {
  api.startCampaign('livre', seed, null, { modo, cora, nome });
  const c = api.S.camp;
  acc.campanhas++;

  assert.equal(c.clube, nome, 'nome custom do time deve ser preservado');

  // adversário nunca é o clube do coração
  if (cora) for (const o of c.opps)
    if (o.n.startsWith(cora + ' ')) acc.violAdversario.push(`${cora}: enfrentaria ${o.n}`);

  let guardaRodadas = 0;
  while (!c.fim && guardaRodadas++ < 10) {
    const m = c.mercado;
    // mercado do Meu Clube só traz o próprio clube; registra o tier sorteado
    if (modo === 'cora') {
      if (m.clube !== cora) acc.violMercado.push(`${cora}: mercado trouxe ${m.clube}`);
      if (m.tier) acc.tier[m.tier] = (acc.tier[m.tier] || 0) + 1;
    }
    const comprou = tentarComprar(api);
    // cada contratação re-sorteia o clube de referência: outro sorteio iid de tier
    if (modo === 'cora' && comprou && c.mercado.tier)
      acc.tier[c.mercado.tier] = (acc.tier[c.mercado.tier] || 0) + 1;

    api.startMatch();
    checarEscalacao(api, acc);           // kickoff: ninguém suspenso/lesionado em campo
    let guardaTicks = 0;
    while (!api.S.sim.fim && guardaTicks++ < 100000) {
      api.tickMin(true);
      checarEscalacao(api, acc);         // após cada lance: idem
    }
    api.encerrarPartida();
  }
  if (!c.fim) acc.erros.push(`campanha não finalizou (${nome})`);
}

function tentarComprar(api) {
  const c = api.S.camp, m = c.mercado;
  if (!m) return;
  for (let pi = 0; pi < m.jog.length; pi++) {
    const p = m.jog[pi];
    if (p.preco > c.caixa) continue;
    const si = c.slots.findIndex(s => s.role === p.pos);
    if (si < 0) continue;
    api.iniciarContratacao(pi);
    if (!api.S.pend) continue;
    api.colocarEm(si);
    return true;
  }
  return false;
}

function checarEscalacao(api, acc) {
  for (const s of api.S.camp.slots)
    if (s.p && s.p.fora > 0)
      acc.violSuspensao.push(`${s.p.n} (fora=${s.p.fora}) escalado em campo`);
}

function novoAcc() {
  return { campanhas: 0, erros: [], violSuspensao: [], violAdversario: [], violMercado: [], tier: {} };
}

test('regressão por bot contra dist/choque-de-eras.html', () => {
  const api = carregarMotor();
  const acc = novoAcc();
  const clubes = api.CORA_CLUBES.map(([nome]) => nome);
  assert.ok(clubes.length >= 5, 'deve haver ao menos 5 clubes do coração');

  const rodar = (cfg) => {
    try { jogarCampanha(api, cfg, acc); }
    catch (e) { acc.erros.push(`${cfg.nome}/${cfg.seed}: ${e.message}`); }
  };

  for (let i = 0; i < CONTINENTAL; i++)
    rodar({ modo: 'cont', cora: null, nome: `Continental ${i}`, seed: `bot-cont-${i}` });

  for (const cora of clubes)
    for (let i = 0; i < CORA_POR_CLUBE; i++)
      rodar({ modo: 'cora', cora, nome: `Eterno ${cora}`, seed: `bot-${cora}-${i}` });

  // relatório
  const totalTier = (acc.tier.D || 0) + (acc.tier.S || 0) + (acc.tier.R || 0);
  const pct = k => totalTier ? (acc.tier[k] || 0) / totalTier : 0;
  console.log(`\n[bot] ${acc.campanhas} campanhas · ${CONTINENTAL} Continental · ${CORA_POR_CLUBE}/clube`);
  console.log(`[bot] tiers em ${totalTier} sorteios → ` +
    `D ${(pct('D') * 100).toFixed(1)}% · S ${(pct('S') * 100).toFixed(1)}% · R ${(pct('R') * 100).toFixed(1)}%`);

  // 1. cobertura mínima
  assert.ok(acc.campanhas >= CONTINENTAL + clubes.length * CORA_POR_CLUBE);
  assert.ok(totalTier >= 600, `sorteios de tier insuficientes (${totalTier} < 600)`);

  // 2. zero violações
  assert.deepEqual(acc.erros, [], 'não deve haver erros de runtime');
  assert.deepEqual(acc.violSuspensao.slice(0, 5), [], 'suspenso/lesionado nunca vai a campo');
  assert.deepEqual(acc.violAdversario.slice(0, 5), [], 'adversário nunca é o clube do coração');
  assert.deepEqual(acc.violMercado.slice(0, 5), [], 'mercado do Meu Clube só traz o próprio clube');

  // 3. distribuição de tiers 55/35/10 (±4 p.p.)
  assert.ok(Math.abs(pct('D') - 0.55) <= 0.04, `tier D fora da faixa: ${(pct('D') * 100).toFixed(1)}%`);
  assert.ok(Math.abs(pct('S') - 0.35) <= 0.04, `tier S fora da faixa: ${(pct('S') * 100).toFixed(1)}%`);
  assert.ok(Math.abs(pct('R') - 0.10) <= 0.04, `tier R fora da faixa: ${(pct('R') * 100).toFixed(1)}%`);
});
