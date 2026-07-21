// PORTEIRO — valida os dados versionados contra os invariantes do CLAUDE.md.
// Nada entra no jogo sem passar aqui. Usado pelo build.mjs e pela suíte de testes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const POSICOES = ['GOL', 'LAT', 'ZAG', 'VOL', 'MEI', 'ATA'];
const TIERS = ['D', 'S', 'R'];
const F_MIN = 40, F_MAX = 99;

function lerJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// Valida um elenco [ [nome,pos,forca], ... ]. `estrito` => invariante #5 (11 jog / 6 pos).
function validarElenco(jog, ctx, erros, { estrito }) {
  if (!Array.isArray(jog)) { erros.push(`${ctx}: elenco não é lista`); return; }
  if (estrito && jog.length !== 11) erros.push(`${ctx}: tem ${jog.length} jogadores (esperado 11)`);
  if (!estrito && jog.length < 5) erros.push(`${ctx}: squad com ${jog.length} jogadores (mínimo 5)`);
  const nomes = new Set(), posVistas = new Set();
  for (const j of jog) {
    const [nome, pos, forca] = j;
    if (!nome || typeof nome !== 'string') erros.push(`${ctx}: nome inválido (${JSON.stringify(nome)})`);
    if (!POSICOES.includes(pos)) erros.push(`${ctx}: posição inválida "${pos}" em ${nome}`);
    if (typeof forca !== 'number' || forca < F_MIN || forca > F_MAX)
      erros.push(`${ctx}: força fora de faixa (${forca}) em ${nome}`);
    if (nomes.has(nome)) erros.push(`${ctx}: nome duplicado "${nome}"`);
    nomes.add(nome);
    posVistas.add(pos);
  }
  if (estrito) for (const p of POSICOES)
    if (!posVistas.has(p)) erros.push(`${ctx}: não cobre a posição ${p}`);
}

export function validarTudo(dataDir) {
  const erros = [];
  const stats = { clubes: 0, eras: 0, squadsContinental: 0, adversarios: 0 };

  // clubes.json — para checar consistência clube→país
  const clubesDoc = lerJson(path.join(dataDir, 'clubes.json'));
  const paisDeClube = Object.fromEntries(clubesDoc.clubes.map(c => [c.nome, c.pais]));
  stats.clubes = clubesDoc.clubes.length;
  const idiomaEsperado = pais => (pais === 'BR' ? 'PT' : ['AR', 'UY'].includes(pais) ? 'ES' : null);

  // data/eras/*.json — eras curadas (invariante #5, estrito)
  const erasDir = path.join(dataDir, 'eras');
  for (const f of fs.readdirSync(erasDir).filter(f => f.endsWith('.json'))) {
    const doc = lerJson(path.join(erasDir, f));
    const ctxClube = `eras/${f}`;
    if (!doc.clube) erros.push(`${ctxClube}: falta campo "clube"`);
    if (paisDeClube[doc.clube] && paisDeClube[doc.clube] !== doc.pais)
      erros.push(`${ctxClube}: país "${doc.pais}" diverge de clubes.json ("${paisDeClube[doc.clube]}")`);
    if (idiomaEsperado(doc.pais) == null) erros.push(`${ctxClube}: país "${doc.pais}" sem idioma definido`);
    for (const era of doc.eras || []) {
      stats.eras++;
      const ctx = `${doc.clube} ${era.ano}`;
      if (typeof era.ano !== 'number') erros.push(`${ctx}: ano inválido`);
      if (!TIERS.includes(era.tier)) erros.push(`${ctx}: tier inválido "${era.tier}"`);
      if (!era.n || !String(era.n).trim()) erros.push(`${ctx}: subtítulo ausente`);
      validarElenco(era.jog, ctx, erros, { estrito: true });
    }
  }

  // continental.json — squads do mercado (validação leve)
  const cont = lerJson(path.join(dataDir, 'continental.json'));
  const grupos = {};
  for (const [nome, pos, forca, clube, ano] of cont.squads) {
    (grupos[`${clube} ${ano}`] ||= []).push([nome, pos, forca]);
  }
  for (const [chave, jog] of Object.entries(grupos)) {
    stats.squadsContinental++;
    validarElenco(jog, `continental ${chave}`, erros, { estrito: false });
  }

  // adversarios.json
  const adv = lerJson(path.join(dataDir, 'adversarios.json'));
  for (const a of adv.adversarios) {
    stats.adversarios++;
    if (!a.rotulo) erros.push(`adversário sem rótulo: ${JSON.stringify(a)}`);
    if (typeof a.forca !== 'number' || a.forca < F_MIN || a.forca > F_MAX)
      erros.push(`adversário "${a.rotulo}": força inválida (${a.forca})`);
  }

  return { erros, stats };
}

// CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dataDir = path.resolve(process.argv[2] || 'data');
  const { erros, stats } = validarTudo(dataDir);
  console.log(`Validação: ${stats.clubes} clubes · ${stats.eras} eras curadas · ` +
    `${stats.squadsContinental} squads continental · ${stats.adversarios} adversários`);
  if (erros.length) {
    console.error(`\n✗ ${erros.length} violação(ões):`);
    for (const e of erros) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('✓ Tudo válido.');
}
