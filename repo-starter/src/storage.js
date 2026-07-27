// ============================================================================
// src/storage.js — armazenamento ESTRITAMENTE LOCAL (localStorage)
// ============================================================================
// ⚠️  ATENÇÃO — LEIA ANTES DE USAR ESTE MÓDULO:
//
// ESTE MÓDULO É SÓ PARA DADOS LOCAIS DO PRÓPRIO JOGADOR, NESTE APARELHO.
// QUALQUER DADO CROSS-USUÁRIO (ranking global, placar de sala, dado de OUTROS
// jogadores) VAI PARA O SUPABASE — NUNCA PARA CÁ.
//
// Foi exatamente confundir "local" com "compartilhado" que gerou o bug do
// storage global do ambiente de artifact: aquela API tinha `shared:true` =
// "visível para TODOS os usuários". localStorage NÃO tem isso — é por origem/
// aparelho. Aquele global nunca existiu no navegador, mas o harness de teste
// fornecia um shim — então o Duelo e o ranking "compartilhado" pareciam
// funcionar nos testes e ficavam inertes em produção.
//
// A flag `shared` sobrevive nas assinaturas SÓ por compatibilidade com as
// chamadas existentes e significa AQUI, ESTRITAMENTE, um PREFIXO DE CHAVE —
// jamais visibilidade entre usuários. Um dado "shared" gravado aqui é tão local
// quanto qualquer outro. Se você precisa de verdade compartilhar entre pessoas,
// o destino é o Supabase, não este arquivo.
//
// Contrato: funções assíncronas; stGet devolve o valor JÁ PARSEADO ou null.
// Nenhum catch é silencioso — toda falha loga contexto (console.warn).
// ============================================================================

// Prefixo de chave por "bucket". NÃO é isolamento entre usuários — só evita
// colisão entre dados do próprio jogador (perfil) e dados de sessão de jogo.
const prefixo = (shared) => (shared ? 'shared:' : 'local:');
const chave = (k, shared) => prefixo(shared) + k;

// Grava `v` (serializado em JSON). Devolve true/false conforme sucesso real.
export async function stSet(k, v, shared) {
  try {
    localStorage.setItem(chave(k, !!shared), JSON.stringify(v));
    return true;
  } catch (e) {
    console.warn(`[storage] falha em stSet(${k})`, e);
    return false;
  }
}

// Lê e devolve o valor JÁ PARSEADO (ou null se ausente/erro). Mantém o contrato
// que as chamadas atuais esperam (objeto parseado, não o wrapper {value}).
export async function stGet(k, shared) {
  try {
    const raw = localStorage.getItem(chave(k, !!shared));
    return raw == null ? null : JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] falha em stGet(${k})`, e);
    return null;
  }
}

// Remove a chave. Devolve true/false conforme sucesso real.
export async function stDel(k, shared) {
  try {
    localStorage.removeItem(chave(k, !!shared));
    return true;
  } catch (e) {
    console.warn(`[storage] falha em stDel(${k})`, e);
    return false;
  }
}

// Lista as chaves (sem o prefixo do bucket) de um bucket local/shared.
export async function stList(shared) {
  try {
    const pre = prefixo(!!shared);
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const full = localStorage.key(i);
      if (full && full.startsWith(pre)) out.push(full.slice(pre.length));
    }
    return out;
  } catch (e) {
    console.warn('[storage] falha em stList', e);
    return [];
  }
}

// Probe REAL de disponibilidade: escreve, lê e apaga uma sentinela dentro de
// try/catch e devolve o resultado de fato. Em aba privada / quota estourada /
// localStorage ausente, devolve false honestamente (o jogo degrada gracioso).
export function storageDisponivel() {
  const sentinela = '__choque_probe__';
  try {
    localStorage.setItem(sentinela, '1');
    const ok = localStorage.getItem(sentinela) === '1';
    localStorage.removeItem(sentinela);
    return ok;
  } catch (e) {
    console.warn('[storage] indisponível (probe falhou)', e);
    return false;
  }
}
