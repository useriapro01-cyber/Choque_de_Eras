// GUARDIÃO DO SCHEMA — PR1 (migration 007_daily_submissions). Assertivas
// ESTÁTICAS sobre o SQL da migration. NÃO substitui a conferência objeto-a-objeto
// no banco (lição REGISTRADO≠APLICADO — isso é feito com a query de conferência
// do CLAUDE.md), mas trava a INTENÇÃO — sobretudo a invariante de privacidade:
// a view pública NUNCA pode selecionar e-mail/decisions/token/consentimento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '007_daily_submissions.sql'), 'utf8');
const lower = sql.toLowerCase();

test('cria a tabela daily_submissions com a chave de negócio e os limites', () => {
  assert.ok(lower.includes('create table public.daily_submissions'), 'tabela daily_submissions');
  assert.ok(/unique\s*\(\s*email\s*,\s*challenge_date\s*\)/.test(lower), 'unique(email, challenge_date)');
  assert.ok(/char_length\(email\)\s*<=\s*254/.test(lower), 'e-mail <= 254 (mesmo teto do input/banco)');
  assert.ok(/char_length\(apelido\)\s*between\s*2\s*and\s*20/.test(lower), 'apelido 2..20');
});

test('tem as colunas ranked_/pending_ separadas, token_hash e consentimento granular', () => {
  for (const col of ['ranked_score', 'ranked_decisions', 'confirmed_at',
                     'pending_score', 'pending_decisions', 'token_hash', 'token_expires_at',
                     'consent_ranking', 'consent_marketing', 'consent_ip', 'consent_at', 'policy_version']) {
    assert.ok(lower.includes(col), `coluna ${col} deve existir`);
  }
});

test('é um COFRE: RLS ligado e revogado para anon/authenticated', () => {
  assert.ok(lower.includes('enable row level security'), 'RLS habilitado');
  assert.ok(/revoke all on public\.daily_submissions from anon, authenticated/.test(lower), 'revoke all p/ cliente');
});

test('INVARIANTE DE PRIVACIDADE: a view pública não expõe e-mail/decisions/token/consentimento', () => {
  assert.ok(lower.includes('create view public.daily_ranking_v2'), 'view daily_ranking_v2');
  // recorta a definição da view (do "create view" até o ";" que a fecha)
  const ini = lower.indexOf('create view public.daily_ranking_v2');
  const fim = lower.indexOf(';', ini);
  assert.ok(ini >= 0 && fim > ini, 'definição da view localizável');
  const viewDef = lower.slice(ini, fim);
  for (const proibido of ['email', 'decisions', 'token', 'consent', 'pending_']) {
    assert.ok(!viewDef.includes(proibido), `a view NÃO pode referenciar "${proibido}"`);
  }
  // só linhas confirmadas entram no ranking
  assert.ok(/where\s+ranked_score\s+is\s+not\s+null/.test(viewDef), 'view filtra ranked_score not null');
  assert.ok(/grant select on public\.daily_ranking_v2 to anon/.test(lower), 'anon lê a view');
});

test('GC de pendências existe e é agendado', () => {
  assert.ok(lower.includes('function public.gc_daily_submissions'), 'função de GC');
  assert.ok(/cron\.schedule\(\s*'gc-daily-submissions'/.test(lower), 'GC agendado no pg_cron');
  assert.ok(/grant execute on function public\.gc_daily_submissions\(\) to service_role/.test(lower), 'GC só p/ service_role');
});
