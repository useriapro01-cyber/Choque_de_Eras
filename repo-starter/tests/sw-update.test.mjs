// ============================================================================
// sw-update.test.mjs — atualização do service worker (TDMV-7)
// ============================================================================
// Deploy novo ⇒ sw.js novo ⇒ controllerchange ⇒ recarrega para aplicar o shell
// novo. Mas SÓ quando é seguro: nunca no meio do retorno do e-mail, no form de
// vínculo ou com uma run do Desafio em andamento. Anti-loop por flag em memória.
//
// FRONTEIRA HONESTA: jsdom/vm NÃO implementam service worker, Cache API nem o
// evento controllerchange. Aqui testamos a LÓGICA DE DECISÃO (pura) e a DEFERÊNCIA
// (dirigindo talvezRecarregar/onSWControllerChange com location.reload stubado —
// API real do navegador). A troca de SW de verdade (install/activate/claim/fetch)
// e o disparo do controllerchange são validados em NAVEGADOR REAL (preview deploy),
// não aqui — ver o checklist do PR. Verde aqui não é evidência de produção.
// ============================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carregarMotor } from './harness/carregar-motor.mjs';

// ---------------------------------------------------------------------------
// deveRecarregar — decisão PURA, tabela verdade completa
// ---------------------------------------------------------------------------
test('deveRecarregar: só com update aguardando + controller prévio + seguro + não recarregando', () => {
  const api = carregarMotor();
  const base = { atualizacaoAguardando: true, recarregando: false, tinhaControlador: true, contextoSeguro: true };
  assert.equal(api.deveRecarregar(base), true, 'caso feliz recarrega');
  assert.equal(api.deveRecarregar({ ...base, atualizacaoAguardando: false }), false, 'sem update: nada a aplicar');
  assert.equal(api.deveRecarregar({ ...base, recarregando: true }), false, 'já recarregando: anti-loop');
  assert.equal(api.deveRecarregar({ ...base, tinhaControlador: false }), false, '1º install: sem reload cosmético');
  assert.equal(api.deveRecarregar({ ...base, contextoSeguro: false }), false, 'contexto inseguro: adia');
  assert.equal(api.deveRecarregar(null), false, 'entrada nula é falsa, não lança');
});

// ---------------------------------------------------------------------------
// contextoSeguro — telas e run em andamento
// ---------------------------------------------------------------------------
test('contextoSeguro: inseguro em vínculo e com run em andamento; seguro em telas de menu', () => {
  const api = carregarMotor();
  api.S.camp = null;
  api.S.screen = 'home'; assert.equal(api.contextoSeguro(), true, 'home é seguro');
  api.S.screen = 'rankdia'; assert.equal(api.contextoSeguro(), true, 'ranking é seguro');
  api.S.screen = 'vincular'; assert.equal(api.contextoSeguro(), false, 'form de vínculo: adia');
  api.S.screen = 'jogo'; api.S.camp = { fim: false }; assert.equal(api.contextoSeguro(), false, 'run em andamento: adia');
  api.S.camp = { fim: true }; api.S.screen = 'fim'; assert.equal(api.contextoSeguro(), true, 'run concluída: seguro');
});

// ---------------------------------------------------------------------------
// Deferência: adia no meio da run, aplica ao voltar a tela segura, uma vez só
// ---------------------------------------------------------------------------
test('controllerchange: adia com run em andamento, aplica em tela segura, sem loop', () => {
  let reloads = 0;
  const api = carregarMotor({ location: { reload: () => { reloads++; } } });
  api.setSWTinhaControlador(true);          // havia controller no load (update real)
  api.S.camp = { fim: false }; api.S.screen = 'jogo';
  api.onSWControllerChange();               // SW novo assume no meio da run
  assert.equal(reloads, 0, 'não recarrega no meio da run');
  api.S.camp = null; api.S.screen = 'home'; // usuário volta ao menu
  api.talvezRecarregar();                   // (render() faz isso no topo, em produção)
  assert.equal(reloads, 1, 'aplica ao ficar seguro');
  api.talvezRecarregar();                   // já recarregando → não repete
  assert.equal(reloads, 1, 'anti-loop: não recarrega de novo');
});

// ---------------------------------------------------------------------------
// Primeiro install: controllerchange sem controller prévio NÃO recarrega
// ---------------------------------------------------------------------------
test('primeiro install (sem controller prévio) não dispara reload cosmético', () => {
  let reloads = 0;
  const api = carregarMotor({ location: { reload: () => { reloads++; } } });
  // swTinhaControlador fica false (vm não tem navigator.serviceWorker)
  api.S.camp = null; api.S.screen = 'home';
  api.onSWControllerChange();
  assert.equal(reloads, 0, 'install virgem: claim dispara controllerchange, mas não recarregamos');
});

// ---------------------------------------------------------------------------
// Hook do render(): entrar em tela segura aplica o update adiado
// ---------------------------------------------------------------------------
test('render() em tela segura aplica update que estava adiado', () => {
  let reloads = 0;
  const api = carregarMotor({ location: { reload: () => { reloads++; } } });
  api.setSWTinhaControlador(true);
  api.S.screen = 'vincular';                // inseguro (form de vínculo)
  api.onSWControllerChange();
  assert.equal(reloads, 0, 'adia no form de vínculo');
  api.ativarRender();
  api.S.camp = null; api.S.screen = 'home'; // volta a tela segura
  api.render();                             // talvezRecarregar() no topo do render()
  assert.equal(reloads, 1, 'render em tela segura aplica o update pendente');
});
