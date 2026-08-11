// ============================================================================
// cors.test.mjs — CORS da Edge Function submit-daily (TDMV-5 Fase D-cors)
// ============================================================================
// O envio ao ranking travava em "Enviando..." porque a função não tinha CORS:
// o preflight OPTIONS voltava 405 sem Access-Control-Allow-*, o navegador
// bloqueava o POST e o fetch rejeitava (o 403 nunca chegava). curl não faz
// preflight — por isso passava batido. Estes testes cobrem a lógica pura de
// CORS (src/cors.js, compartilhada com a função) e, por varredura de fonte,
// garantem que a função a usa em TODA resposta. (TDMV-8: o v3 é endpoint ABERTO,
// sem JWT/getUser — protegido por rate-limit + duplo opt-in.)
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
// 3) CORS em TODAS as respostas — inclusive os erros do v3
// ---------------------------------------------------------------------------
test('CORS em TODA resposta: o helper json espalha ...cors, inclusive nos erros do v3', () => {
  assert.match(idxTs, /headers:\s*\{\s*'content-type':\s*'application\/json',\s*\.\.\.cors\s*\}/,
    'o helper json espalha ...cors em toda resposta');
  // erros do v3 saem TODOS pelo helper json (logo, com CORS). Spot-check:
  for (const cod of ['consent_necessario', 'rate_limited', 'worse_than_ranked', 'email_falhou']) {
    assert.match(idxTs, new RegExp(`json\\(\\d{3},\\s*\\{[^}]*erro:\\s*'${cod}'`),
      `erro '${cod}' é emitido pelo helper json (com CORS)`);
  }
});

// ---------------------------------------------------------------------------
// 4) verify_jwt=false + endpoint ABERTO por design (TDMV-8), protegido por
//    rate-limit + duplo opt-in (NÃO por JWT/getUser, que morreram com o Auth)
// ---------------------------------------------------------------------------
test('config.toml fixa verify_jwt=false para submit-daily', () => {
  assert.match(cfg, /\[functions\.submit-daily\][\s\S]*verify_jwt\s*=\s*false/,
    'verify_jwt=false versionado');
});

test('v3 é endpoint ABERTO: sem getUser/JWT, protegido por rate-limit por e-mail E IP', () => {
  assert.ok(!/\.getUser\s*\(/.test(idxTs), 'v3 não CHAMA getUser (identidade é o e-mail, não JWT)');
  assert.ok(!/erro:\s*'email_necessario'/.test(idxTs), 'sem muro de anônimo (fluxo Auth morreu)');
  assert.match(idxTs, /check_rate_limit/, 'protegido por rate-limit');
  assert.match(idxTs, /submit:email:/, 'rate-limit por e-mail (anti e-mail-bomba)');
  assert.match(idxTs, /submit:ip:/, 'rate-limit por IP (CGNAT: 60/h)');
});
