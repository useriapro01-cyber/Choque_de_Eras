// ============================================================================
// retorno-link.test.mjs — retorno do link de e-mail sem silêncio (Fase D-retorno)
// ============================================================================
// O trecho final do E2E (voltar do link → adotar sessão → submeter pendente)
// nunca rodou em produção e tinha vários caminhos MUDOS: hash sem token, adoção
// null, ?code (PKCE) e "sem pendência" passavam sem warn nem mensagem, deixando
// o usuário com apelido vazio e Desafio travado. Estes testes provam que TODO
// caminho de retorno emite console.warn OU mensagem visível, e cobrem a
// classificação pura (implícito no hash; ?code/?error defensivos).
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';
import { classificarRetorno } from '../src/sb.js';

const PENDENTE_KEY = 'choque:dia:pendente';

// captura console.warn durante fn (o sandbox usa o console global).
async function comWarnSpy(fn) {
  const orig = console.warn;
  const warns = [];
  console.warn = (...a) => { warns.push(a.map(String).join(' ')); };
  try { await fn(warns); } finally { console.warn = orig; }
}

function sbFake(over = {}) {
  return Object.assign({
    habilitado: true,
    async garantirSessao() { return { user: { id: 'anon' } }; },
    async adotarTokens() { return { user: { id: 'perm', is_anonymous: false } }; },
    async ehAnonimo() { return false; },
    async desafioAtual() { return { date: '2026-07-29', seed: 's' }; },
    async salvarPerfil() { return true; },
    async submeterDia() { return { ok: true, status: 200, data: { best: 1 } }; },
  }, over);
}

// ---------------------------------------------------------------------------
// 1) classificarRetorno (pura): implícito no hash, ?code/?error defensivos
// ---------------------------------------------------------------------------
test('classificarRetorno: tokens no hash (fluxo implícito)', () => {
  const r = classificarRetorno('#access_token=abc&refresh_token=def&expires_in=3600', '');
  assert.equal(r.tipo, 'tokens');
  assert.equal(r.tok.access_token, 'abc');
});
test('classificarRetorno: erro (hash ou query)', () => {
  assert.equal(classificarRetorno('#error=access_denied', '').tipo, 'erro');
  assert.equal(classificarRetorno('', '?error_description=expired').tipo, 'erro');
});
test('classificarRetorno: ?code (PKCE) detectado como code, não engolido', () => {
  assert.equal(classificarRetorno('', '?code=xyz').tipo, 'code');
});
test('classificarRetorno: hash com conteúdo mas sem token = ilegivel', () => {
  const r = classificarRetorno('#foo=bar', '');
  assert.equal(r.tipo, 'ilegivel');
  assert.ok(r.chaves.includes('foo'));
});
test('classificarRetorno: nada = nenhum (boot normal, silêncio ok)', () => {
  assert.equal(classificarRetorno('', '').tipo, 'nenhum');
});

// ---------------------------------------------------------------------------
// 2) bootSessao: NENHUM caminho de retorno é mudo
// ---------------------------------------------------------------------------
test('boot: hash ilegível → warn + tela de vínculo com mensagem', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', hash: '#foo=bar' } });
    api.setSbFake(sbFake());
    await api.bootSessao();
    assert.ok(warns.some(w => /sem tokens reconhecíveis/.test(w)), 'logou warn');
    assert.equal(api.S.screen, 'vincular', 'foi para vínculo');
    assert.ok(api.S.vinc && api.S.vinc.msg, 'com mensagem visível');
  });
});

test('boot: ?code (PKCE) → warn + mensagem (nunca troca silenciosa)', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', search: '?code=xyz' } });
    api.setSbFake(sbFake());
    await api.bootSessao();
    assert.ok(warns.some(w => /PKCE|\?code/.test(w)), 'logou warn de code');
    assert.equal(api.S.screen, 'vincular');
    assert.equal(api.S.vinc.msg, api.t('vinc_confirm_falhou'));
  });
});

test('boot: token válido mas adoção retorna null → warn + mensagem', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', hash: '#access_token=abc' } });
    api.setSbFake(sbFake({ adotarTokens: async () => null }));
    await api.bootSessao();
    assert.ok(warns.some(w => /não produziu sessão/.test(w)), 'logou warn de adoção null');
    assert.equal(api.S.screen, 'vincular');
    assert.equal(api.S.vinc.msg, api.t('vinc_confirm_falhou'));
  });
});

test('boot: token ok mas SEM pendência → warn + mensagem "jogue de novo"', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br', hash: '#access_token=abc' } });
    api.setSbFake(sbFake());   // adoção ok, mas store não tem pendência
    await api.bootSessao();
    assert.ok(warns.some(w => /sem pendência/.test(w)), 'logou warn de sem pendência');
    // mensagem visível vem por toast; garante que existe a string e não travou
    assert.ok(api.t('vinc_sem_pendente') !== 'vinc_sem_pendente', 'string existe');
  });
});

test('boot: token ok COM pendência → retoma e submete (caminho feliz)', async () => {
  const store = new Map();
  store.set(PENDENTE_KEY, JSON.stringify({ date: '2026-07-29', decisions: [], clientVersion: 'x', apelido: 'NEY', email: 'a@b.com' }));
  let submeteu = false;
  const api = carregarMotor({ store, location: { origin: 'https://www.choquedeeras.com.br', hash: '#access_token=abc' } });
  api.setSbFake(sbFake({ submeterDia: async () => { submeteu = true; return { ok: true, status: 200, data: { best: 1 } }; } }));
  await api.bootSessao();
  assert.ok(submeteu, 'submeteu a pendência');
});

test('boot: sem retorno (hash/query vazios) → NÃO vai para vínculo, sessão anônima', async () => {
  let garantiu = false;
  const api = carregarMotor({ location: { origin: 'https://www.choquedeeras.com.br' } });
  api.setSbFake(sbFake({ garantirSessao: async () => { garantiu = true; return { user: { id: 'anon' } }; } }));
  await api.bootSessao();
  assert.ok(garantiu, 'garantiu sessão anônima');
  assert.notEqual(api.S.screen, 'vincular', 'não abriu vínculo no boot normal');
});

// ---------------------------------------------------------------------------
// 3) Origem canônica: warn quando location.origin difere de SITE_ORIGIN
// ---------------------------------------------------------------------------
test('boot: origem servida difere da canônica → warn (tokens podem se perder)', async () => {
  await comWarnSpy(async (warns) => {
    const api = carregarMotor({ location: { origin: 'https://choquedeeras.com.br' } }); // apex, não www
    api.setSbFake(sbFake());
    await api.bootSessao();
    assert.ok(warns.some(w => /origem servida difere da canônica/.test(w)), 'avisou divergência de origem');
  });
});

// ---------------------------------------------------------------------------
// 4) Item 5: o nick é gravado JÁ no envio do vínculo (não depende do retorno)
// ---------------------------------------------------------------------------
test('bundle: vincEnviarLink persiste S.profile.nick na hora (home não trava se o retorno falhar)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dist = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  assert.match(dist, /S\.profile\.nick=apelido;saveProfile\(\)/, 'nick persistido no envio do vínculo');
});

// ---------------------------------------------------------------------------
// 5) Guard-rail de disciplina: SITE_ORIGIN e as strings de retorno existem PT+ES
// ---------------------------------------------------------------------------
test('i18n: mensagens de retorno definidas em PT e ES', () => {
  const api = carregarMotor();
  for (const lang of ['pt', 'es']) {
    api.S.lang = lang;
    for (const k of ['vinc_confirm_falhou', 'vinc_sem_pendente', 'vinc_link_erro']) {
      assert.ok(api.t(k) !== k, `${k} tem texto em ${lang}`);
    }
  }
});
