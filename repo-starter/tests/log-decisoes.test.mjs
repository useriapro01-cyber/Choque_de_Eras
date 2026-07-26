// GUARDIÃO DO LOG DE DECISÕES (TDMV-5 Fase D) — o item central da fase.
// Dirige uma campanha do DESAFIO DO DIA pelas MESMAS funções que a UI usa
// (setFormacao/rolarMercado/colocarEm/startMatch/eventoEscolha...), extrai o
// `S.camp.log` que essas ações gravaram e prova que `replayCampanha(log)`
// reproduz EXATAMENTE o placar da campanha viva. Se algum dia uma ação da UI
// mudar o estado sem registrar a decisão certa, este teste quebra — é o que
// garante que o que o servidor re-simula é o que o jogador realmente fez.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

const TIPOS = new Set(['contratar', 'escalarBase', 'escalarBanco', 'mover', 'mandarBanco',
  'vender', 'venderBanco', 'rolar', 'formacao', 'estilo', 'jogar', 'evento']);

// compra até `n` jogadores: o MELHOR acessível a cada vez, no slot da posição
// certa (caminho da UI). Estratégia forte de propósito p/ algumas campanhas
// chegarem ao mata-mata e ao título (exercita prorrogação/pênaltis no replay).
function comprarAlguns(api, n) {
  const c = api.S.camp;
  for (let k = 0; k < n; k++) {
    const m = c.mercado; if (!m) break;
    let melhor = -1, mf = -1;
    for (let pi = 0; pi < m.jog.length; pi++) {
      const p = m.jog[pi];
      if (p.preco > c.caixa) continue;
      if (c.slots.findIndex(s => s.role === p.pos) < 0) continue;
      if (p.f > mf) { mf = p.f; melhor = pi; }
    }
    if (melhor < 0) break;
    const si = c.slots.findIndex(s => s.role === c.mercado.jog[melhor].pos);
    api.iniciarContratacao(melhor);
    if (!api.S.pend) break;
    api.colocarEm(si);              // grava {t:"contratar",...}
  }
}

// joga um Desafio do Dia inteiro dirigindo a UI; devolve a campanha (com .log).
function jogarDiario(api, seed) {
  api.S.lang = 'pt';
  api.startCampaign('diario', seed, null, { modo: 'cont', cora: null, nome: '' });
  const c = api.S.camp;
  const forms = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];
  let guarda = 0;
  while (!c.fim && guarda++ < 12) {
    api.setFormacao(forms[c.rodada % forms.length]);   // {t:"formacao"} (no-op se igual)
    api.setEstilo('of');                               // {t:"estilo"} — ofensivo p/ vencer mais
    if (c.rodada === 0) {                              // exercita {t:"mover"} uma vez
      api.S.pend = { tipo: 'mover', from: 1, p: c.slots[1].p };
      api.colocarEm(2);
    }
    api.rolarMercado();                                // {t:"rolar"}
    comprarAlguns(api, 6);                             // {t:"contratar"} (melhores acessíveis)
    api.startMatch();                                  // {t:"jogar"}
    let gt = 0;
    while (!api.S.sim.fim && gt++ < 100000) api.tickMin();
    api.encerrarPartida();                             // se fim -> finalizarCampanha (auto-verifica)
    if (!c.fim && c.evento) api.eventoEscolha(c.rodada % 2 === 0); // {t:"evento",aceita}
  }
  return c;
}

test('GUARDIÃO: replay do log == placar da campanha viva (Desafio do Dia)', () => {
  const api = carregarMotor();
  // seeds escolhidas p/ variedade real de trajetória: eliminação no grupo,
  // mata-mata e uma campanha completa (7 jogos) com disputa de PÊNALTIS —
  // assim o replay do log é exercitado até prorrogação/pênaltis.
  const seeds = ['diario-guard-1', 'diario-guard-2', 'diario-guard-9',
    'diario-guard-18', 'diario-guard-25', 'diario-guard-29', 'dia-2026-07-24'];
  let campeao = 0, elim = 0, comPenaltis = 0, maxRodada = 0;

  for (const seed of seeds) {
    const c = jogarDiario(api, seed);
    if (c.resultados.some(r => r.pen)) comPenaltis++;
    maxRodada = Math.max(maxRodada, c.rodada);

    assert.ok(c.fim, `a campanha deve concluir (${seed})`);
    assert.ok(Array.isArray(c.log) && c.log.length > 0, `o log deve ter decisões (${seed})`);
    for (const d of c.log) assert.ok(TIPOS.has(d.t), `tipo de decisão inválido no log: ${d.t} (${seed})`);

    // nº de partidas jogadas == nº de decisões 'jogar'
    const njogar = c.log.filter(d => d.t === 'jogar').length;
    assert.equal(njogar, c.rodada, `nº de 'jogar' deve casar com as rodadas jogadas (${seed})`);

    // O CORAÇÃO: re-simular o log reproduz o placar exato da campanha viva
    const live = api.Engine.calcScore(c).total;
    const r = api.Replay.replayCampanha({
      Engine: api.Engine, dados: api.dadosAtuais(), seed, decisions: c.log,
    });
    assert.equal(r.ok, true, `o replay do log deve ser ACEITO (${seed}): ${JSON.stringify(r)}`);
    assert.equal(r.score, live, `replay(log) deve dar o placar da campanha viva (${seed})`);

    // a AUTO-VERIFICAÇÃO do cliente (rodada em finalizarCampanha) concordou
    assert.equal(c.replayOk, true, `a auto-verificação do cliente deveria passar (${seed})`);
    assert.equal(c.replayScore, live, `replayScore deve casar com o placar (${seed})`);

    if (c.campeao) campeao++;
    if (c.eliminado) elim++;
  }

  // toda campanha concluída é campeão XOR eliminado (sanidade)
  assert.equal(campeao + elim, seeds.length, 'toda campanha concluída deve ser campeão ou eliminado');
  assert.ok(comPenaltis >= 1, 'ao menos uma campanha deve exercitar pênaltis no replay');
  assert.ok(maxRodada >= 7, 'ao menos uma campanha deve ir até a final (7 jogos)');
  console.log(`\n[guardião] ${seeds.length} diárias · ${campeao} campeão / ${elim} eliminado · ` +
    `${comPenaltis} c/ pênaltis · rodada máx ${maxRodada} · replay(log)==placar em TODAS`);
});
