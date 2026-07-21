// Invariante #5 (CLAUDE.md): toda era curada tem 11 jogadores cobrindo as 6 posições,
// sem duplicatas, tier válido e subtítulo. O porteiro é a fonte da verdade; aqui só o afirmamos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTudo } from '../scripts/validar-eras.mjs';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

test('dados versionados passam por todos os invariantes do porteiro', () => {
  const { erros, stats } = validarTudo(dataDir);
  assert.deepEqual(erros, [], 'não deve haver violações de invariante');
  assert.ok(stats.eras > 0, 'deve haver eras curadas');
  assert.ok(stats.clubes > 0, 'deve haver clubes');
});
