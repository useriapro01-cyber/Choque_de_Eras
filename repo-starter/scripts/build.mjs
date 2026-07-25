// BUILD — data/*.json + src/ → dist/ (PWA: index.html self-contained + manifest + sw + ícones).
// Passa pelo porteiro antes; aborta se qualquer invariante falhar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validarTudo } from './validar-eras.mjs';
import { carregarBruto } from './carregar-dados.mjs';
import { calcularVersao } from './versao.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(ROOT, 'data');
const srcDir = path.join(ROOT, 'src');
const pwaDir = path.join(srcDir, 'pwa');
const distDir = path.join(ROOT, 'dist');
const fnDir = path.join(ROOT, 'supabase', 'functions', 'submit-daily'); // artefato do servidor (Fase C)

const lerJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// 1. porteiro
const { erros, stats } = validarTudo(dataDir);
if (erros.length) {
  console.error(`✗ Build abortado: ${erros.length} violação(ões) de invariante.`);
  for (const e of erros) console.error('  - ' + e);
  process.exit(1);
}

// 2. reconstruir o bloco de dados (fonte única: carregar-dados.mjs)
const bruto = carregarBruto(dataDir);
const { DB, CLUBE_PAIS, FLAG_PAIS, OPPS, CORA_CLUBES, ERAS, nomes } = bruto;

const j = v => JSON.stringify(v);
const dataBlock = [
  '/* ===== DADOS GERADOS pelo build (fonte: data/*.json) — não editar aqui ===== */',
  `const DB=${j(DB)};`,
  `const CLUBE_PAIS=${j(CLUBE_PAIS)};`,
  `const FLAG_PAIS=${j(FLAG_PAIS)};`,
  `const OPPS=${j(OPPS)};`,
  `const CORA_CLUBES=${j(CORA_CLUBES)};`,
  `const ERAS=${j(ERAS)};`,
  `const NOMES_BASE=${j(nomes.base)};`,
  `const SOBRENOMES_BASE=${j(nomes.sobrenomes)};`,
  `const NOMES_CLUBE=${j(nomes.clube)};`,
].join('\n');

// 2b. módulos ESM (export) para o Node; no bundle clássico do browser removemos
// os `export` e embrulhamos cada um num namespace global (script single-file).
const engineSrc = fs.readFileSync(path.join(srcDir, 'engine.js'), 'utf8');
function embrulhar(rotulo, arquivo, src) {
  const nomes = [...new Set(
    [...src.matchAll(/^export\s+(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1])
  )];
  if (!nomes.length) { console.error(`✗ nenhum export encontrado em ${arquivo}`); process.exit(1); }
  return [
    `/* ===== ${rotulo} (src/${arquivo}) — gerado; não editar aqui ===== */`,
    `const ${rotulo}=(function(){`,
    src.replace(/^export\s+/gm, ''),
    `return {${nomes.join(',')}};`,
    '})();',
  ].join('\n');
}
const engineBlock = embrulhar('Engine', 'engine.js', engineSrc);
// replay.js (validação anti-fraude pura) — no browser serve à AUTO-VERIFICAÇÃO:
// o cliente re-simula o próprio log de decisões e confere o score antes de
// submeter (o mesmo módulo que a Edge Function usa no servidor).
const replayBlock = embrulhar('Replay', 'replay.js', fs.readFileSync(path.join(srcDir, 'replay.js'), 'utf8'));
// sb.js (cliente Supabase por fetch cru) — sessão/OTP/submissão/ranking.
const sbBlock = embrulhar('SB', 'sb.js', fs.readFileSync(path.join(srcDir, 'sb.js'), 'utf8'));

// Config PÚBLICA do Supabase (URL + anon key): env tem precedência (Vercel);
// senão config.public.json. anon key é pública por design. Vazia => ranking off.
const cfgPub = fs.existsSync(path.join(ROOT, 'config.public.json'))
  ? lerJson(path.join(ROOT, 'config.public.json')) : {};
const sbUrl = process.env.SUPABASE_URL || cfgPub.supabaseUrl || '';
const sbAnon = process.env.SUPABASE_ANON_KEY || cfgPub.supabaseAnonKey || '';
const configBlock = `const SB_URL=${j(sbUrl)};\nconst SB_ANON=${j(sbAnon)};`;

// 2c. VERSÃO do artefato (motor + dados): carimba o bundle do browser (BUILD_VERSION)
// e o artefato do servidor com o MESMO valor, gerados neste build. O cliente
// envia BUILD_VERSION em cada submissão do Desafio do Dia; o servidor rejeita
// versão divergente com mensagem clara em vez de reprovar por dados fora de sync.
const versaoBuild = calcularVersao(engineSrc, bruto);
const versaoBlock = `const BUILD_VERSION=${j(versaoBuild)};`;

// 3. injetar em src/index.html (ordem: motor → dados → app)
const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
let out = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8')
  .replace('/*@STYLES@*/', () => css.trimEnd())
  .replace('/*@DATA@*/', () => [engineBlock, replayBlock, sbBlock, configBlock, versaoBlock, dataBlock].join('\n'))
  .replace('/*@APP@*/', () => app.trimEnd());

for (const m of ['/*@STYLES@*/', '/*@DATA@*/', '/*@APP@*/'])
  if (out.includes(m)) { console.error('✗ marcador não substituído: ' + m); process.exit(1); }

// 4. emitir HTML: index.html (entrada PWA/raiz) + choque-de-eras.html (compat. links antigos)
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'index.html'), out);
fs.writeFileSync(path.join(distDir, 'choque-de-eras.html'), out);

// 5. ativos PWA: manifest + ícones (cópia) e sw.js (carimbado com a versão do conteúdo)
const versao = crypto.createHash('sha256').update(out).digest('hex').slice(0, 10);
fs.copyFileSync(path.join(pwaDir, 'manifest.webmanifest'), path.join(distDir, 'manifest.webmanifest'));

const iconsOut = path.join(distDir, 'icons');
fs.mkdirSync(iconsOut, { recursive: true });
const iconsEnviados = ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon-180.png'];
for (const f of iconsEnviados)
  fs.copyFileSync(path.join(pwaDir, 'icons', f), path.join(iconsOut, f));

const sw = fs.readFileSync(path.join(pwaDir, 'sw.js'), 'utf8').replace('/*@VERSION@*/', versao);
if (sw.includes('/*@VERSION@*/')) { console.error('✗ versão do SW não carimbada'); process.exit(1); }
fs.writeFileSync(path.join(distDir, 'sw.js'), sw);

// 6. artefatos da Fase C (versão + dados do servidor de replay)
//    dist/version.json    → referência da versão publicada
//    supabase/functions/submit-daily/_dados.json → dados que a Edge Function
//      re-simula (MESMA fonte do bundle) e _versao.json → versão autoritativa
//      do servidor (comparada com a BUILD_VERSION que o cliente envia).
fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify({ version: versaoBuild }) + '\n');
fs.mkdirSync(fnDir, { recursive: true });
fs.writeFileSync(path.join(fnDir, '_dados.json'), JSON.stringify(bruto));
fs.writeFileSync(path.join(fnDir, '_versao.json'), JSON.stringify({ version: versaoBuild }) + '\n');

console.log(`✓ Build OK → dist/ (index.html ${(out.length / 1024).toFixed(0)} KB · sw v${versao} · artefato v${versaoBuild})`);
console.log(`  ${stats.eras} eras curadas · ${stats.squadsContinental} squads · ${stats.adversarios} adversários · ${CORA_CLUBES.length} clubes jogáveis`);
console.log(`  PWA: manifest + sw.js + ${iconsEnviados.length} ícones · servidor: _dados.json + _versao.json`);
