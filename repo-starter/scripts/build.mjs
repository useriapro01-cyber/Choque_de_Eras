// BUILD — data/*.json + src/ → dist/choque-de-eras.html (single-file, dados inlined).
// Passa pelo porteiro antes; aborta se qualquer invariante falhar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTudo } from './validar-eras.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(ROOT, 'data');
const srcDir = path.join(ROOT, 'src');
const distDir = path.join(ROOT, 'dist');

const lerJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// 1. porteiro
const { erros, stats } = validarTudo(dataDir);
if (erros.length) {
  console.error(`✗ Build abortado: ${erros.length} violação(ões) de invariante.`);
  for (const e of erros) console.error('  - ' + e);
  process.exit(1);
}

// 2. reconstruir o bloco de dados exatamente como o motor espera
const clubesDoc = lerJson(path.join(dataDir, 'clubes.json'));
const cont = lerJson(path.join(dataDir, 'continental.json'));
const adv = lerJson(path.join(dataDir, 'adversarios.json'));

const eraFiles = fs.readdirSync(path.join(dataDir, 'eras'))
  .filter(f => f.endsWith('.json'))
  .map(f => lerJson(path.join(dataDir, 'eras', f)))
  .sort((a, b) => a.ordem - b.ordem);

const CLUBE_PAIS = Object.fromEntries(clubesDoc.clubes.map(c => [c.nome, c.pais]));
const FLAG_PAIS = clubesDoc.paises;
const DB = cont.squads;
const OPPS = adv.adversarios.map(a => [a.rotulo, a.forca]);
const CORA_CLUBES = eraFiles.map(e => [e.clube, e.cor]);
const ERAS = Object.fromEntries(eraFiles.map(e => [e.clube, e.eras]));

const j = v => JSON.stringify(v);
const dataBlock = [
  '/* ===== DADOS GERADOS pelo build (fonte: data/*.json) — não editar aqui ===== */',
  `const DB=${j(DB)};`,
  `const CLUBE_PAIS=${j(CLUBE_PAIS)};`,
  `const FLAG_PAIS=${j(FLAG_PAIS)};`,
  `const OPPS=${j(OPPS)};`,
  `const CORA_CLUBES=${j(CORA_CLUBES)};`,
  `const ERAS=${j(ERAS)};`,
].join('\n');

// 3. injetar em src/index.html
const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
let out = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8')
  .replace('/*@STYLES@*/', () => css.trimEnd())
  .replace('/*@DATA@*/', () => dataBlock)
  .replace('/*@APP@*/', () => app.trimEnd());

for (const m of ['/*@STYLES@*/', '/*@DATA@*/', '/*@APP@*/'])
  if (out.includes(m)) { console.error('✗ marcador não substituído: ' + m); process.exit(1); }

// 4. emitir
fs.mkdirSync(distDir, { recursive: true });
const outFile = path.join(distDir, 'choque-de-eras.html');
fs.writeFileSync(outFile, out);

console.log(`✓ Build OK → dist/choque-de-eras.html (${(out.length / 1024).toFixed(0)} KB)`);
console.log(`  ${stats.eras} eras curadas · ${stats.squadsContinental} squads · ${stats.adversarios} adversários · ${CORA_CLUBES.length} clubes jogáveis`);
