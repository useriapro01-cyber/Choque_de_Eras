// Fonte ÚNICA de reconstrução dos dados a partir de data/*.json.
// Usado pelo build (bundle do browser), pelo motor no Node e pelos testes,
// garantindo que browser e servidor operem sobre exatamente os mesmos dados.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lerJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

// Retorna o "bruto": DB, ERAS, OPPS, CLUBE_PAIS, FLAG_PAIS, CORA_CLUBES e os pools de nome.
export function carregarBruto(dataDir = path.join(RAIZ, 'data')) {
  const clubesDoc = lerJson(path.join(dataDir, 'clubes.json'));
  const cont = lerJson(path.join(dataDir, 'continental.json'));
  const adv = lerJson(path.join(dataDir, 'adversarios.json'));
  const nomes = lerJson(path.join(dataDir, 'nomes.json'));
  const eraFiles = fs.readdirSync(path.join(dataDir, 'eras'))
    .filter(f => f.endsWith('.json'))
    .map(f => lerJson(path.join(dataDir, 'eras', f)))
    .sort((a, b) => a.ordem - b.ordem);

  return {
    DB: cont.squads,
    CLUBE_PAIS: Object.fromEntries(clubesDoc.clubes.map(c => [c.nome, c.pais])),
    FLAG_PAIS: clubesDoc.paises,
    OPPS: adv.adversarios.map(a => [a.rotulo, a.forca]),
    CORA_CLUBES: eraFiles.map(e => [e.clube, e.cor]),
    ERAS: Object.fromEntries(eraFiles.map(e => [e.clube, e.eras])),
    nomes,
  };
}

// Pools de nome para um idioma, no formato que o motor espera (arrays crus).
export function poolsIdioma(nomes, lang) {
  return { base: nomes.base[lang], sobrenomes: nomes.sobrenomes[lang], clubeA: nomes.clube[lang].a, clubeB: nomes.clube[lang].b };
}
