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

export function carregarMotor({ dist, store: storeExterno, localStorage: lsExterno, location: locExterno } = {}) {
  const distPath = dist || path.join(ROOT, 'dist', 'index.html');
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
    CORA_CLUBES, ERAS, OPPS, DB,
    Engine, Replay, dadosAtuais,
    startCampaign, startMatch, tickMin, encerrarPartida,
    iniciarContratacao, colocarEm,
    rolarMercado, setFormacao, setEstilo, eventoEscolha,
    render(){ return render(); },
    ativarRender(){ render = __render_real; },
    desativarRender(){ render = function(){}; },
    // perfil: expostos p/ testar persistência através de "reload" (cargas separadas)
    loadProfile: (typeof loadProfile === 'function') ? loadProfile : undefined,
    saveProfile: (typeof saveProfile === 'function') ? saveProfile : undefined,
    salvarNick: (typeof salvarNick === 'function') ? salvarNick : undefined,
    // submissão ao ranking: expostos p/ testar o try/catch/finally do envio.
    submeterDiario: (typeof submeterDiario === 'function') ? submeterDiario : undefined,
    // retorno do link de e-mail: exposto p/ testar que nenhum caminho é mudo.
    bootSessao: (typeof bootSessao === 'function') ? bootSessao : undefined,
    vincEnviarLink: (typeof vincEnviarLink === 'function') ? vincEnviarLink : undefined,
    // perfil/erros de envio: expostos p/ testar (a)/(b) e o mapeamento específico.
    retomarPendente: (typeof retomarPendente === 'function') ? retomarPendente : undefined,
    garantirPerfil: (typeof garantirPerfil === 'function') ? garantirPerfil : undefined,
    msgEnvio: (typeof msgEnvio === 'function') ? msgEnvio : undefined,
    // validação de campos + i18n: expostos p/ testar limites/mensagens (email/apelido).
    validarEmail: (typeof validarEmail === 'function') ? validarEmail : undefined,
    irVincular: (typeof irVincular === 'function') ? irVincular : undefined,
    t: (typeof t === 'function') ? t : undefined,
    // injeta um SB falso (mesma assinatura de criarSB) reatribuindo o sb() do bundle,
    // p/ dirigir o caminho de rede sem backend (fetch rejeitando, 403, etc.).
    setSbFake(fake){ sb = function(){ return fake; }; },
    // TDMV-5 diagnóstico/observabilidade: log persistente + tela de estado.
    logEvento: (typeof logEvento === 'function') ? logEvento : undefined,
    lerLog: (typeof lerLog === 'function') ? lerLog : undefined,
    diagSnapshot: (typeof diagSnapshot === 'function') ? diagSnapshot : undefined,
    diagTexto: (typeof diagTexto === 'function') ? diagTexto : undefined,
    diagSubmit: (typeof diagSubmit === 'function') ? diagSubmit : undefined,
    renderDiag: (typeof renderDiag === 'function') ? () => renderDiag() : undefined,
    irDiag: (typeof irDiag === 'function') ? () => irDiag() : undefined,
    BUNDLE_VERSION: (typeof BUNDLE_VERSION !== 'undefined') ? BUNDLE_VERSION : undefined,
  };
})();`;

  // 3. sandbox com stubs de DOM/janela/timers.
  //    #app é um elemento que CAPTURA o innerHTML escrito pelo render (sweep).
  // store compartilhável entre cargas (para simular "reload" com persistência).
  const store = storeExterno || new Map();
  let appHTML = '';
  const appEl = Object.assign(stubEl(), {
    set innerHTML(v) { appHTML = String(v); },
    get innerHTML() { return appHTML; },
  });
  const sandbox = {
    console,
    URLSearchParams,   // API real do navegador (usada por parseHashTokens/classificarRetorno)
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
  // location injetável: o retorno do link de e-mail lê hash/search/origin; o boot
  // usa history.replaceState p/ limpar o hash. Defaults inertes; testes sobrescrevem.
  sandbox.location = Object.assign(
    { href: '', origin: '', pathname: '/', hash: '', search: '', reload: () => {} },
    locExterno || {},
  );
  sandbox.history = { replaceState: () => {}, pushState: () => {} };
  sandbox.scrollTo = () => {};
  sandbox.confirm = () => true;
  sandbox.alert = () => {};
  // localStorage headless (Web Storage API o bastante para src/storage.js): pode
  // ser injetado (ex.: jsdom real, ou um que lança exceção) para testes de borda.
  // NÃO há mais `window.storage` — era o shim de artifact que mascarava o bug.
  sandbox.localStorage = lsExterno || {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => { store.delete(k); },
    clear: () => store.clear(),
    key: i => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
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
