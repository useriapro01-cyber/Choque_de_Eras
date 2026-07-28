// ============================================================================
// src/cors.js — CORS da Edge Function submit-daily (puro: Deno + Node + browser)
// ============================================================================
// Por que existe: sem CORS o navegador BLOQUEIA o POST no preflight, o `fetch`
// do cliente REJEITA e o envio ao ranking trava em "Enviando..." para sempre
// (o 403 nunca chega). curl não faz preflight — por isso "funcionava" no WSL e
// travava no celular. Módulo PURO e compartilhado entre a função (Deno) e os
// testes (Node), no mesmo espírito de engine.js/replay.js.
//
// EXIGÊNCIAS DE SEGURANÇA (pedido do founder):
//  • Origem EXPLÍCITA, nunca "*": só ecoa Access-Control-Allow-Origin se a
//    origem da requisição estiver na allowlist; caso contrário NÃO manda o
//    header (o navegador então bloqueia origem estranha — é o que queremos).
//  • Os headers de CORS vão em TODAS as respostas (inclusive 401/403/500),
//    senão o navegador esconde o erro do cliente e voltamos ao mesmo sintoma.
// ============================================================================

export const ORIGENS_PERMITIDAS = [
  'https://choquedeeras.com.br',
  'https://www.choquedeeras.com.br',
  // dev local (Vite/serve) — nunca some, mas só ecoa se a requisição vier daqui
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

export function origemPermitida(origin) {
  return !!origin && ORIGENS_PERMITIDAS.includes(origin);
}

// Headers de CORS para UMA resposta. Os estáticos (Methods/Headers/Max-Age/Vary)
// vão sempre; Access-Control-Allow-Origin só entra se a origem for permitida.
// Como o mesmo objeto é espalhado em toda resposta (200/401/403/500), o CORS
// nunca falta num erro.
export function corsHeaders(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (origemPermitida(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
