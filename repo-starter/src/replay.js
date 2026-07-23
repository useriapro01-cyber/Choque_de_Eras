// ============================================================================
// Choque de Eras — REPLAY (validação anti-fraude server-side) — TDMV-5 Fase C
// ============================================================================
// PURO: roda no Deno (Edge Function) e no Node (teste). Sem DOM, sem I/O, sem
// segredos. Recebe o motor (`Engine`) e os dados por parâmetro — mesmo padrão
// do teste de paridade — e devolve um resultado discriminado.
//
// Esta é a fronteira de confiança do ranking. O cliente é NÃO confiável: envia
// só a lista de decisões. Aqui, o servidor:
//   1. re-cria a campanha com a SEED OFICIAL do dia (nunca a do cliente);
//   2. força o modo Continental (o Desafio do Dia é neutro entre torcidas;
//      Meu Clube nunca — invariante #2);
//   3. valida a LEGALIDADE de cada decisão (forma + índices + jogabilidade);
//   4. re-simula e devolve o score AUTORITATIVO (o score do cliente é ignorado).
//
// INVARIANTE (CLAUDE.md): no replay server-side, `ok:false` COM código de erro
// em qualquer decisão => rejeição. O servidor NUNCA ignora o retorno das
// decisões atômicas. (`ok:false` SEM código — p.ex. trocar para a MESMA
// formação — é no-op benigno e é tolerado.)
// ============================================================================

// Teto de decisões: uma campanha honesta tem ordem de centenas; acima disso é
// abuso/DoS por payload. (Barreira de forma, antes de tocar no motor.)
export const MAX_DECISOES = 2000;

const ehIntEmFaixa = (v, lo, hi) => Number.isInteger(v) && v >= lo && v < hi;

// Sanidade de FORMA (só tipos; independe do estado da campanha).
// Rejeita payload malformado antes de qualquer índice tocar o motor.
function formaOk(Engine, d) {
  if (!d || typeof d !== 'object' || typeof d.t !== 'string') return false;
  switch (d.t) {
    case 'contratar':   return Number.isInteger(d.mercadoIdx) && Number.isInteger(d.slotIdx);
    case 'escalarBase': return typeof d.baseId === 'string' && Number.isInteger(d.slotIdx);
    case 'escalarBanco':return Number.isInteger(d.bancoIdx) && Number.isInteger(d.slotIdx);
    case 'mover':       return Number.isInteger(d.from) && Number.isInteger(d.to);
    case 'mandarBanco': return Number.isInteger(d.slotIdx);
    case 'vender':      return Number.isInteger(d.slotIdx);
    case 'venderBanco': return Number.isInteger(d.idx);
    case 'rolar':       return true;
    case 'formacao':    return typeof d.f === 'string' && Object.prototype.hasOwnProperty.call(Engine.FORMACOES, d.f);
    case 'estilo':      return typeof d.e === 'string' && Object.prototype.hasOwnProperty.call(Engine.ESTILOS, d.e);
    case 'jogar':       return true;
    case 'evento':      return typeof d.aceita === 'boolean';
    default:            return false;
  }
}

// Sanidade de ÍNDICES contra o estado ATUAL da campanha. Sem isto, um
// slotIdx/from/to fora de [0..10] CRASHA o motor (mover/vender indexam direto)
// em vez de ser rejeitado limpo.
function faixaOk(camp, d) {
  const nSlots = camp.slots.length;
  const nMerc = camp.mercado ? camp.mercado.jog.length : 0;
  const nBanco = camp.banco.length;
  switch (d.t) {
    case 'contratar':   return ehIntEmFaixa(d.mercadoIdx, 0, nMerc) && ehIntEmFaixa(d.slotIdx, 0, nSlots);
    case 'escalarBase': return ehIntEmFaixa(d.slotIdx, 0, nSlots);
    case 'escalarBanco':return ehIntEmFaixa(d.bancoIdx, 0, nBanco) && ehIntEmFaixa(d.slotIdx, 0, nSlots);
    case 'mover':       return ehIntEmFaixa(d.from, 0, nSlots) && ehIntEmFaixa(d.to, 0, nSlots);
    case 'mandarBanco': return ehIntEmFaixa(d.slotIdx, 0, nSlots);
    case 'vender':      return ehIntEmFaixa(d.slotIdx, 0, nSlots);
    case 'venderBanco': return ehIntEmFaixa(d.idx, 0, nBanco);
    default:            return true;
  }
}

// Re-simula uma submissão em MODO ESTRITO e devolve o score autoritativo.
// Resultado: { ok:true, score, gf, gs, cs, rodada, campeao, eliminado }
//         ou { ok:false, erro, indice?, tipo?, detalhe? }.
export function replayCampanha({ Engine, dados, seed, decisions, mode = 'diario' }) {
  if (typeof seed !== 'string' || !seed) return { ok: false, erro: 'seed_forma' };
  if (!Array.isArray(decisions)) return { ok: false, erro: 'decisoes_forma', detalhe: 'não é lista' };
  if (decisions.length > MAX_DECISOES) return { ok: false, erro: 'decisoes_forma', detalhe: 'excede teto' };

  // Modo SEMPRE Continental; cora null. O servidor não aceita Meu Clube no diário.
  const camp = Engine.criarCampanha(mode, seed, null, { modo: 'cont', cora: null, nome: '' }, dados);

  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    if (!formaOk(Engine, d)) return { ok: false, erro: 'decisao_forma', indice: i };
    // Nada é jogável depois que a campanha encerrou; o cliente honesto para aqui.
    if (camp.fim) return { ok: false, erro: 'decisao_apos_fim', indice: i };
    if (!faixaOk(camp, d)) return { ok: false, erro: 'decisao_fora_de_faixa', indice: i };
    const res = Engine.aplicarDecisao(camp, dados, d);
    // ok:false COM código => jogada impossível no cliente honesto => fraude.
    if (res && res.ok === false && res.erro) {
      return { ok: false, erro: 'decisao_rejeitada', indice: i, tipo: res.erro };
    }
  }

  // Submissão válida = campanha CONCLUÍDA (campeão ou eliminado), nunca no meio.
  if (!camp.fim) return { ok: false, erro: 'campanha_incompleta' };

  const r = Engine.resultadoCampanha(camp, null);
  return {
    ok: true, score: r.score.total,
    gf: r.gf, gs: r.gs, cs: r.cs, rodada: r.rodada,
    campeao: r.campeao, eliminado: r.eliminado,
  };
}

// Entrada de alto nível da Edge Function: checa a VERSÃO do artefato antes de
// re-simular. Se o cliente está num build diferente do servidor, rejeita com
// mensagem clara ("recarregue a página") em vez de reprovar por dados divergentes.
export function submeterReplay({ Engine, dados, seed, decisions, clientVersion, serverVersion }) {
  if (serverVersion && clientVersion !== serverVersion) {
    return { ok: false, erro: 'versao_desatualizada', serverVersion, clientVersion: clientVersion ?? null };
  }
  return replayCampanha({ Engine, dados, seed, decisions });
}
