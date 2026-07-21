// Harness de teste — carrega o MOTOR do artefato dist/choque-de-eras.html num
// sandbox headless (stubs de DOM), neutraliza a camada de render e expõe as
// funções internas para o bot dirigir campanhas. Parte permanente da suíte.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function stubEl() {
  // elemento de DOM permissivo e encadeável — nada aqui afeta a lógica do motor
  const el = {
    innerHTML: '', textContent: '', value: '', style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    setAttribute() {}, getAttribute() { return null; }, focus() {}, scrollIntoView() {},
    querySelector() { return stubEl(); }, querySelectorAll() { return []; },
  };
  return el;
}

export function carregarMotor({ dist } = {}) {
  const distPath = dist || path.join(ROOT, 'dist', 'choque-de-eras.html');
  const html = fs.readFileSync(distPath, 'utf8');
  const m = html.match(/<script>\n?"use strict";([\s\S]*?)<\/script>/);
  if (!m) throw new Error('bloco <script> não encontrado no dist');

  // 1. corpo do motor sem o IIFE de init (que dispararia render/DOM real)
  let js = m[1].split('/* ---------- INIT ---------- */')[0];

  // 2. shim no MESMO escopo léxico: captura const/let (S, DB, ERAS...) e
  //    controla a camada de render. Por padrão render fica neutralizado
  //    (rápido, headless); o sweep de telas o reativa via ativarRender().
  js = '"use strict";\n' + js + `
;(function(){
  const __render_real = render;
  render = function(){}; renderPlacarVivo = function(){}; renderLoading = function(){};
  toast = function(){}; if (typeof carregarRankDia === 'function') carregarRankDia = function(){};
  if (typeof carregarSala === 'function') carregarSala = function(){};
  globalThis.__api = {
    get S(){ return S; },
    CORA_CLUBES, ERAS, OPPS, DB, SQUAD_KEYS,
    startCampaign, refreshMercado, autoEscalar, startMatch, tickMin, encerrarPartida,
    iniciarContratacao, colocarEm, baseDisponivel, calcScore, sortearEvento,
    render(){ return render(); },
    ativarRender(){ render = __render_real; },
    desativarRender(){ render = function(){}; },
  };
})();`;

  // 3. sandbox com stubs de DOM/janela/timers.
  //    #app é um elemento que CAPTURA o innerHTML escrito pelo render (sweep).
  const store = new Map();
  let appHTML = '';
  const appEl = Object.assign(stubEl(), {
    set innerHTML(v) { appHTML = String(v); },
    get innerHTML() { return appHTML; },
  });
  const sandbox = {
    console,
    setTimeout: () => 0, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    document: {
      getElementById: id => (id === 'app' ? appEl : stubEl()), querySelector: () => stubEl(),
      querySelectorAll: () => [], createElement: () => stubEl(),
      addEventListener: () => {}, body: stubEl(), documentElement: stubEl(),
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.navigator = { language: 'pt-BR', clipboard: { writeText: async () => {} } };
  sandbox.location = { href: '', reload: () => {} };
  sandbox.scrollTo = () => {};
  sandbox.confirm = () => true;
  sandbox.alert = () => {};
  sandbox.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k),
  };
  sandbox.storage = {
    get: async k => (store.has(k) ? { value: store.get(k) } : null),
    set: async (k, v) => { store.set(k, v); },
  };

  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: 'motor(dist)' });

  const api = sandbox.__api;
  if (!api) throw new Error('shim __api não inicializou');
  api.htmlApp = () => appEl.innerHTML; // lê o que o último render escreveu em #app

  // perfil mínimo para finalizarCampanha/checarConquistas não quebrarem
  api.S.lang = 'pt';
  api.S.storageOk = false;
  api.S.profile = {
    nick: 'BOT', clubeNome: 'Bot FC', lang: 'pt',
    jogos: 0, titulos: 0, perfeitos: 0, recorde: 0, legado: 0, conq: [], dailyFeito: '',
  };
  return api;
}
