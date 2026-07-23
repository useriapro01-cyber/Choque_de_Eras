// Versão do artefato (motor + dados) — TDMV-5 Fase C.
// Um único número carimba o par (engine.js, dados de era) que gerou um build.
// O bundle do browser leva esse valor (BUILD_VERSION) e o envia em cada submissão
// do Desafio do Dia; o servidor compara com a SUA versão (gerada no mesmo build)
// e rejeita cliente desatualizado com mensagem clara ("recarregue a página"),
// em vez de re-simular com dados divergentes e reprovar um jogador honesto.
import crypto from 'node:crypto';

// Determinístico: mesmos bytes de motor + mesmos dados => mesma versão.
// `bruto` é o objeto de carregarBruto() (DB/ERAS/OPPS/... + nomes).
export function calcularVersao(engineSrc, bruto) {
  const material = engineSrc + ' ' + JSON.stringify(bruto);
  return crypto.createHash('sha256').update(material).digest('hex').slice(0, 12);
}
