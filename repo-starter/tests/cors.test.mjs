// ============================================================================
// cors.test.mjs — CORS da Edge Function submit-daily (TDMV-5 Fase D-cors)
// ============================================================================
// O envio ao ranking travava em "Enviando..." porque a função não tinha CORS:
// o preflight OPTIONS voltava 405 sem Access-Control-Allow-*, o navegador
// bloqueava o POST e o fetch rejeitava (o 403 nunca chegava). curl não faz
// preflight — por isso passava batido. Estes testes cobrem a lógica pura de
// CORS (src/cors.js, compartilhada com a função) e, por varredura de fonte,
// garantem que a função a usa em TODA resposta e autentica com verify_jwt=false.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { corsHeaders, origemPermitida, ORIGENS_PERMITIDAS } from '../src/cors.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const idxTs = fs.readFileSync(path.join(ROOT, 'supabase/functions/submit-daily/index.ts'), 'utf8');
const cfg = fs.readFileSync(path.join(ROOT, 'supabase/config.toml'), 'utf8');

const PROD = 'https://choquedeeras.com.br';

// ---------------------------------------------------------------------------
// 1) OPTIONS/preflight: headers presentes e corretos
// ---------------------------------------------------------------------------
test('preflight: headers de CORS presentes (Methods/Headers/Max-Age) p/ origem permitida', () => {
  const h = corsHeaders(PROD);
  assert.equal(h['Access-Control-Allow-Methods'], 'POST, OPTIONS');
  assert.match(h['Access-Control-Allow-Headers'], /authorization/i);
  assert.match(h['Access-Control-Allow-Headers'], /apikey/i);
  assert.match(h['Access-Control-Allow-Headers'], /content-type/i);
  assert.ok(h['Access-Control-Max-Age'], 'Max-Age presente (cacheia o preflight)');
  assert.equal(h['Access-Control-Allow-Origin'], PROD, 'ecoa a origem permitida');
});

test('a função responde OPTIONS com 204 + os headers de CORS (varredura de fonte)', () => {
  assert.match(idxTs, /req\.method\s*===\s*'OPTIONS'/, 'trata OPTIONS');
  assert.match(idxTs, /status:\s*204,\s*headers:\s*cors/, 'OPTIONS → 204 com headers de CORS');
});

// ---------------------------------------------------------------------------
// 2) Origem EXPLÍCITA: só ecoa se estiver na allowlist, nunca "*"
// ---------------------------------------------------------------------------
test('origens permitidas (prod, www, localhost) ecoam Allow-Origin', () => {
  for (const o of ['https://choquedeeras.com.br', 'https://www.choquedeeras.com.br',
                   'http://localhost:5173', 'http://localhost:3000']) {
    assert.ok(origemPermitida(o), `${o} deve ser permitida`);
    assert.equal(corsHeaders(o)['Access-Control-Allow-Origin'], o);
  }
});

test('origem fora da lista → SEM header Allow-Origin (não vaza "*")', () => {
  for (const o of ['https://evil.com', 'https://choquedeeras.com.br.evil.com', null, '']) {
    const h = corsHeaders(o);
    assert.ok(!('Access-Control-Allow-Origin' in h), `sem ACAO p/ origem ${o}`);
  }
  // e nunca o coringa
  assert.ok(!ORIGENS_PERMITIDAS.includes('*'));
  assert.ok(!Object.values(corsHeaders(PROD)).includes('*'));
});

// ---------------------------------------------------------------------------
// 3) CORS em TODAS as respostas — inclusive 401 sem token
// ---------------------------------------------------------------------------
test('401 (sem token) carrega os headers de CORS (helper json único + varredura)', () => {
  // o helper json espalha `cors` em toda resposta; então o 401 também os carrega.
  assert.match(idxTs, /headers:\s*\{\s*'content-type':\s*'application\/json',\s*\.\.\.cors\s*\}/,
    'o helper json espalha ...cors em toda resposta');
  assert.match(idxTs, /json\(401,\s*\{\s*ok:\s*false,\s*erro:\s*'unauthorized'\s*\}\)/,
    '401 unauthorized é emitido pelo helper json (logo, com CORS)');
});

// ---------------------------------------------------------------------------
// 4) verify_jwt=false + autenticação DENTRO da função, antes de processar
// ---------------------------------------------------------------------------
test('config.toml fixa verify_jwt=false para submit-daily', () => {
  assert.match(cfg, /\[functions\.submit-daily\][\s\S]*verify_jwt\s*=\s*false/,
    'verify_jwt=false versionado');
});

test('auth acontece ANTES de qualquer processamento do corpo', () => {
  const iGetUser = idxTs.indexOf('auth.getUser()');
  const iBody = idxTs.indexOf('await req.json()');
  assert.ok(iGetUser > -1 && iBody > -1, 'getUser e req.json presentes');
  assert.ok(iGetUser < iBody, 'getUser() vem antes de req.json() (endpoint não fica aberto)');
});
