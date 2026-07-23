// ============================================================================
// Choque de Eras — MOTOR (engine)
// Puro: roda no browser E no Node. NUNCA referenciar DOM/window/document nem
// i18n (t/NARR/pl/fmtM). Recebe DADOS por parâmetro e opera sobre estado
// explícito. Toda aleatoriedade do fluxo de campanha vem de RNG semeado por
// seed (invariante #3), para permitir replay/validação server-side.
// A simulação emite EVENTOS ESTRUTURADOS (neutros de idioma); a UI localiza.
// ============================================================================

// ---------------- RNG semeado ----------------
export function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return(h>>>0)||1}
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const rnd=(rng,min,max)=>Math.floor(rng()*(max-min+1))+min;
export const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];
export function rngPara(seed){return mulberry32(hashStr(seed))}

// ---------------- Regras / constantes ----------------
export const TORCIDA=1;
export const FORMACOES={
 "4-3-3":{roles:["GOL","LAT","ZAG","ZAG","LAT","VOL","MEI","MEI","ATA","ATA","ATA"],atk:3,def:-2},
 "4-4-2":{roles:["GOL","LAT","ZAG","ZAG","LAT","VOL","VOL","MEI","MEI","ATA","ATA"],atk:0,def:0},
 "3-5-2":{roles:["GOL","ZAG","ZAG","ZAG","LAT","VOL","MEI","MEI","LAT","ATA","ATA"],atk:2,def:-2},
 "5-3-2":{roles:["GOL","LAT","ZAG","ZAG","ZAG","LAT","VOL","VOL","MEI","ATA","ATA"],atk:-4,def:4}
};
export const ESTILOS={of:{atk:5,def:-5},eq:{atk:0,def:0},re:{atk:-5,def:6}};
export const ADJ={GOL:[],LAT:["ZAG"],ZAG:["LAT","VOL"],VOL:["ZAG","MEI"],MEI:["VOL","ATA"],ATA:["MEI"]};
export const FAIXA_OPP=[[66,72],[69,75],[72,78],[76,82],[80,85],[83,88],[86,93]];
export const PREMIO_V=[26,26,26,36,46,56,70], PREMIO_E=[10,10,10,0,0,0,0];
export const TIER_PESOS=[["D",.55],["S",.35],["R",.10]];
export const CONQ_IDS=["estreia","vitoria","campeao","perfeito","zebra","maodevaca","raiz","artilheiro","muralha","redencao","duelista","diario"];

export function preco(f){let p=0.035*Math.pow(f-52,2);if(f>=92)p*=1+(f-91)*0.15;return Math.max(2,Math.round(p))}
export function penalPos(pos,role){if(pos===role)return 0;if(pos==="GOL"||role==="GOL")return -20;if(ADJ[role].includes(pos))return -7;return -13}

// ---------------- Dados ----------------
// `bruto` = {DB, ERAS, OPPS, CLUBE_PAIS, CORA_CLUBES}. `nomes` (pools por idioma)
// é anexado pelo chamador via montarDados(...,nomes) ou dados.nomes = {...}.
export function montarDados(bruto,nomes){
  const SQUADS={};
  bruto.DB.forEach((p,i)=>{const k=p[3]+" "+p[4];(SQUADS[k]=SQUADS[k]||[]).push(i)});
  const SQUAD_KEYS=Object.keys(SQUADS).filter(k=>SQUADS[k].length>=5);
  return {...bruto, SQUADS, SQUAD_KEYS, nomes:nomes||null};
}

// ---------------- Elenco / cantera ----------------
export function novoJogador(dados,i){const d=dados.DB[i];return{id:"d"+i,n:d[0],pos:d[1],f:d[2],clube:d[3],ano:d[4],preco:preco(d[2]),lenda:d[2]>=91,gols:0,amar:0,fora:0}}
export function jogadorDeEra(club,ei,era,d,i){
  return{id:"e:"+club+":"+ei+":"+i,n:d[0],pos:d[1],f:d[2],clube:club,ano:era.ano,preco:preco(d[2]),lenda:d[2]>=91,tier:era.tier,gols:0,amar:0,fora:0};
}
// ATRIBUTOS (joia, f) e estrutura vêm SEMPRE do RNG de jogo (`rng`): mesma seed
// = mesmo XI, sempre, NEUTRO de idioma. O NOME é cosmético e sai de um RNG
// SEPARADO (`rngNome`), para que o tamanho/idioma do pool de nomes jamais
// perturbe os atributos (invariante #3). A UI resolve o rótulo; o motor só sorteia.
export function gerarBase(rng,dados,rngNome){
  const roles=["GOL","LAT","LAT","ZAG","ZAG","VOL","VOL","MEI","MEI","ATA","ATA"];
  const nomes=dados.nomes, joia=rnd(rng,0,10),usados=new Set(),base=[];
  roles.forEach((pos,i)=>{
    const f=i===joia?rnd(rng,69,73):rnd(rng,56,67);            // atributo: RNG de jogo
    let n;do{n=pick(rngNome,nomes.base)+" "+pick(rngNome,nomes.sobrenomes)}while(usados.has(n));usados.add(n); // rótulo: RNG cosmético isolado
    base.push({id:"b"+i,n,pos,f,clube:"",ano:"",preco:0,lenda:false,base:true,gols:0,amar:0,fora:0});
  });
  return base;
}
// Cosmético: recebe um RNG isolado (nunca o de jogo). Não afeta pontuação.
export function nomeClube(rng,dados){const g=dados.nomes;return pick(rng,g.clubeA)+" "+pick(rng,g.clubeB)}

export function escaladosSet(camp){const s=new Set();camp.slots.forEach(x=>{if(x.p)s.add(x.p.id)});return s}
export function baseDisponivel(camp){const e=escaladosSet(camp);return camp.base.filter(b=>!e.has(b.id)&&b.fora<=0)}
export function noElenco(camp,id){return escaladosSet(camp).has(id)||camp.banco.some(p=>p.id===id)}

// Completa o XI com a cantera. Retorna as mudanças estruturadas (a UI narra).
export function autoEscalar(camp){
  const c=camp, mudancas=[];
  c.slots.forEach(s=>{if(s.p&&s.p.fora>0){
    mudancas.push({tipo:"desfalque",nome:s.p.n,jogos:s.p.fora});
    if(!s.p.base)c.banco.push(s.p);s.p=null}});
  c.slots.forEach(s=>{if(s.p)return;const cand=baseDisponivel(c).filter(b=>b.pos===s.role).sort((a,b)=>b.f-a.f);
    if(cand[0]){s.p=cand[0];mudancas.push({tipo:"entra_base",nome:cand[0].n,pos:cand[0].pos})}});
  c.slots.forEach(s=>{if(s.p)return;let best=null,bf=-1;
    baseDisponivel(c).forEach(b=>{const f=b.f+penalPos(b.pos,s.role);if(f>bf){bf=f;best=b}});
    if(best){s.p=best;mudancas.push({tipo:"improvisa",nome:best.n,pos:best.pos,role:s.role})}});
  return mudancas;
}
export function forcaEfetiva(slot,moral){
  if(!slot.p||slot.p.fora>0)return 50;
  const f=slot.p.f+penalPos(slot.p.pos,slot.role);
  return Math.max(45,f+(moral||0)*2);
}
export function mediaXI(camp){return camp.slots.reduce((a,s)=>a+forcaEfetiva(s,0),0)/11}

// ---------------- Campanha: criação ----------------
// seed é OBRIGATÓRIO (a UI gera "livre-"+timestamp+random; o motor não usa Date/Math.random).
export function criarCampanha(mode,seed,roomCode,opts,dados){
  opts=opts||{modo:"cont",nome:""};
  const rM=mulberry32(hashStr(seed+"::mercado")), rO=mulberry32(hashStr(seed+"::copa")), rB=mulberry32(hashStr(seed+"::base"));
  // RNGs COSMÉTICOS (nomes) — isolados do RNG de jogo p/ neutralidade de idioma:
  const rNb=mulberry32(hashStr(seed+"::nomebase")), rNc=mulberry32(hashStr(seed+"::nomeclube"));
  const cora=opts.modo==="cora"?opts.cora:null;
  const pool=cora?dados.OPPS.filter(o=>!o[0].startsWith(cora+" ")):dados.OPPS;
  const usados=new Set(), opps=[];
  for(let r=0;r<7;r++){const[lo,hi]=FAIXA_OPP[r];const cands=pool.filter(o=>o[1]>=lo&&o[1]<=hi&&!usados.has(o[0]));
    const c=cands.length?pick(rO,cands):pick(rO,pool);usados.add(c[0]);opps.push({n:c[0],f:c[1]})}
  const form=FORMACOES["4-3-3"];
  const camp={mode,seed,roomCode:roomCode||null,modo:opts.modo||"cont",cora,
    clube:(opts.nome&&opts.nome.trim())||nomeClube(rNc,dados),
    caixa:170,gasto:0,vendas:0,formacao:"4-3-3",estilo:"eq",
    slots:form.roles.map(r=>({role:r,p:null})),banco:[],base:gerarBase(rB,dados,rNb),
    rodada:0,opps,resultados:[],gf:0,gs:0,cs:0,moral:0,golSofrencia:false,
    rM,rolls:0,rollGratis:true,mercado:null,evento:null,
    eliminado:false,campeao:false,fim:false,contratados:0};
  refreshMercado(camp,dados);
  autoEscalar(camp);
  return camp;
}

// ---------------- Mercado ----------------
export function refreshMercado(camp,dados){
  const c=camp;
  if(c.modo==="cora"){
    const eras=dados.ERAS[c.cora],atual=c.mercado?c.mercado.eraIdx:-1;
    let ei=-1,g=0;
    do{
      const r=c.rM();let tier="D",acc=0;
      for(const[tk,w]of TIER_PESOS){acc+=w;if(r<acc){tier=tk;break}}
      const cands=eras.map((e,i)=>e.tier===tier?i:-1).filter(i=>i>=0);
      ei=cands.length?cands[Math.floor(c.rM()*cands.length)]:Math.floor(c.rM()*eras.length);
    }while(ei===atual&&eras.length>1&&g++<12);
    const era=eras[ei];
    const jog=era.jog.map((d,i)=>jogadorDeEra(c.cora,ei,era,d,i));
    c.mercado={key:c.cora+" "+era.ano,clube:c.cora,eraNome:era.n,ano:era.ano,tier:era.tier,eraIdx:ei,jog};
    c.rolls++;return;
  }
  const atual=c.mercado?c.mercado.key:null;
  let k=pick(c.rM,dados.SQUAD_KEYS),g=0;
  while(k===atual&&g++<20)k=pick(c.rM,dados.SQUAD_KEYS);
  c.mercado={key:k,clube:k.slice(0,k.lastIndexOf(" ")),ano:k.slice(k.lastIndexOf(" ")+1),eraNome:null,tier:null,jog:dados.SQUADS[k].map(i=>novoJogador(dados,i))};
  c.rolls++;
}
// Rola o mercado manualmente (1º grátis por rodada; depois custa 8). Retorna {ok,erro?}.
export function rolarMercado(camp,dados){
  const c=camp;
  if(c.rollGratis){c.rollGratis=false}
  else{if(c.caixa<8)return{ok:false,erro:"rolar_caixa"};c.caixa-=8}
  refreshMercado(camp,dados);
  return{ok:true};
}

// ---------------- Decisões atômicas ----------------
// Todas retornam {ok, erro?, ...} para a UI dar feedback; mutam `camp`.
export function contratar(camp,dados,mercadoIdx,slotIdx){
  const c=camp,p=c.mercado.jog[mercadoIdx];
  if(!p)return{ok:false,erro:"invalido"};
  if(noElenco(c,p.id))return{ok:false,erro:"ja_elenco",nome:p.n};
  if(p.preco>c.caixa)return{ok:false,erro:"sem_caixa",nome:p.n,preco:p.preco};
  const slot=c.slots[slotIdx],desloc=slot.p,novo=Object.assign({},p);
  c.caixa-=novo.preco;c.gasto+=novo.preco;c.contratados++;
  if(desloc&&!desloc.base)c.banco.push(desloc);
  slot.p=novo;
  refreshMercado(camp,dados); // o clube de referência muda
  autoEscalar(camp);
  return{ok:true,nome:novo.n,role:slot.role,improviso:penalPos(novo.pos,slot.role)<0};
}
export function escalarBase(camp,baseId,slotIdx){
  const c=camp,p=c.base.find(b=>b.id===baseId);
  if(!p)return{ok:false,erro:"invalido"};
  if(p.fora>0)return{ok:false,erro:"dm",nome:p.n};
  if(escaladosSet(c).has(p.id))return{ok:false,erro:"ja_campo",nome:p.n};
  const slot=c.slots[slotIdx],desloc=slot.p;
  if(desloc&&!desloc.base)c.banco.push(desloc);
  slot.p=p;autoEscalar(camp);
  return{ok:true};
}
export function escalarBanco(camp,bancoIdx,slotIdx){
  const c=camp,p=c.banco[bancoIdx];
  if(!p)return{ok:false,erro:"invalido"};
  if(p.fora>0)return{ok:false,erro:"fora",nome:p.n,jogos:p.fora};
  const slot=c.slots[slotIdx],desloc=slot.p;
  if(desloc&&!desloc.base)c.banco.push(desloc);
  slot.p=p;
  const ix=c.banco.findIndex(x=>x.id===p.id);if(ix>=0)c.banco.splice(ix,1);
  autoEscalar(camp);
  return{ok:true};
}
export function mover(camp,from,to){
  const c=camp;
  if(from!==to){const a=c.slots[from].p;c.slots[from].p=c.slots[to].p;c.slots[to].p=a}
  autoEscalar(camp);
  return{ok:true};
}
export function mandarBanco(camp,slotIdx){
  const c=camp,s=c.slots[slotIdx];if(!s.p)return{ok:false,erro:"invalido"};
  if(s.p.base)return{ok:false,erro:"jovem"};
  c.banco.push(s.p);s.p=null;autoEscalar(camp);
  return{ok:true};
}
export function vender(camp,slotIdx){
  const c=camp,s=c.slots[slotIdx];if(!s.p)return{ok:false,erro:"invalido"};
  if(s.p.base)return{ok:false,erro:"base_nv"};
  const v=Math.round(s.p.preco*0.7),nome=s.p.n;
  c.caixa+=v;c.vendas++;s.p=null;autoEscalar(camp);
  return{ok:true,nome,valor:v};
}
export function venderBanco(camp,idx){
  const c=camp,p=c.banco[idx];if(!p)return{ok:false,erro:"invalido"};
  const v=Math.round(p.preco*0.7),nome=p.n;
  c.caixa+=v;c.vendas++;c.banco.splice(idx,1);
  return{ok:true,nome,valor:v};
}
export function setFormacao(camp,f){
  const c=camp;if(f===c.formacao)return{ok:false};
  const atuais=c.slots.filter(s=>s.p).map(s=>s.p);
  c.formacao=f;c.slots=FORMACOES[f].roles.map(r=>({role:r,p:null}));
  const conts=atuais.filter(p=>!p.base).sort((a,b)=>b.f-a.f);
  conts.forEach(p=>{let i=c.slots.findIndex(s=>!s.p&&s.role===p.pos);
    if(i<0)i=c.slots.findIndex(s=>!s.p&&ADJ[s.role].includes(p.pos));
    if(i<0)i=c.slots.findIndex(s=>!s.p&&s.role!=="GOL");
    if(i>=0)c.slots[i].p=p;else c.banco.push(p)});
  autoEscalar(camp);
  return{ok:true};
}
export function setEstilo(camp,e){camp.estilo=e;return{ok:true}}

// ---------------- Simulação de partida ----------------
export function ratingTime(camp){
  const c=camp,WD={GOL:1.4,ZAG:1.25,LAT:1.0,VOL:.85,MEI:.35,ATA:.1},WA={GOL:0,ZAG:.15,LAT:.55,VOL:.7,MEI:1.15,ATA:1.35};
  let da=0,dw=0,aa=0,aw=0;
  c.slots.forEach(s=>{const f=forcaEfetiva(s,c.moral);da+=f*WD[s.role];dw+=WD[s.role];aa+=f*WA[s.role];aw+=WA[s.role]});
  const fm=FORMACOES[c.formacao],es=ESTILOS[c.estilo];
  return{atk:aa/aw+fm.atk+es.atk+TORCIDA,def:da/dw+fm.def+es.def+TORCIDA};
}
export function lambdaGols(atk,def,sup){let l=1.28*Math.pow(1.7,(atk-def)/15);if(sup)l*=Math.pow(0.86,Math.max(0,def-atk)/4);return Math.min(5.2,Math.max(.06,l))}
export function recalcLambdas(camp,sim){
  const r=ratingTime(camp);
  sim.lambF=lambdaGols(r.atk,sim.oDef)/94;
  sim.lambC=lambdaGols(sim.oAtk,r.def,true)/94;
}
function sorteiaAutor(camp,rng){
  const cand=[];
  camp.slots.forEach((s,i)=>{if(!s.p||s.p.fora>0)return;const w=s.role==="ATA"?6:s.role==="MEI"?3:s.role==="VOL"?1:s.role==="GOL"?0:.6;
    for(let k=0;k<w*10;k++)cand.push(i)});
  if(!cand.length)return -1;
  return cand[Math.floor(rng()*cand.length)];
}
function sorteiaCartao(camp,rng){
  const cand=[];
  camp.slots.forEach((s,i)=>{if(!s.p||s.p.fora>0)return;const w={ZAG:3,VOL:3,LAT:2,MEI:1.5,ATA:1,GOL:.2}[s.role];
    for(let k=0;k<w*10;k++)cand.push(i)});
  if(!cand.length)return -1;
  return cand[Math.floor(rng()*cand.length)];
}
export function substituir(camp,slotIdx){
  const c=camp,slot=c.slots[slotIdx],e=escaladosSet(c);
  const cands=[];
  c.banco.forEach(p=>{if(p.fora<=0)cands.push(p)});
  c.base.forEach(b=>{if(b.fora<=0&&!e.has(b.id))cands.push(b)});
  let best=null,bf=-1;
  cands.forEach(p=>{const f=p.f+penalPos(p.pos,slot.role);if(f>bf){bf=f;best=p}});
  if(!best){slot.p=null;return null}
  const ix=c.banco.findIndex(x=>x.id===best.id);if(ix>=0)c.banco.splice(ix,1);
  slot.p=best;return best;
}
// Inicia a partida da rodada atual. RNG semeado por seed+rodada (reprodutível).
// Retorna {sim, escalacao} — escalacao = mudanças da cantera para a UI narrar.
export function iniciarPartida(camp){
  const c=camp,opp=c.opps[c.rodada];
  const escalacao=autoEscalar(camp);
  [...c.slots.filter(s2=>s2.p).map(s2=>s2.p),...c.banco,...c.base].forEach(p=>p.amarJogo=0);
  const rng=mulberry32(hashStr(c.seed+"o"+c.rodada));
  const oAtk=opp.f+rnd(rng,-2,2),oDef=opp.f;
  const sim={min:0,gf:0,gs:0,eventos:[],oAtk,oDef,fim:false,penaltis:null,prorroga:false,gols:[],subs:0,opp,rng};
  recalcLambdas(camp,sim);
  return{sim,escalacao};
}
// Avança 1 minuto; muta sim/camp; anexa eventos estruturados a sim.eventos.
export function simularMinuto(camp,sim){
  const c=camp,rng=sim.rng;if(sim.fim)return;
  sim.min++;
  const lim=sim.prorroga?120:90;
  const ev=e=>{e.min=sim.min;sim.eventos.push(e);return e};
  if(rng()<sim.lambF*(sim.prorroga?.4:1)){
    const i=sorteiaAutor(c,rng),a=i>=0?c.slots[i].p:null;
    sim.gf++;sim.gols.push({m:sim.min,p:a?a.n:"—",nosso:true});
    if(a){a.gols++;if(a.tier==="R")c.golSofrencia=true}
    ev({tipo:"gol",nome:a?a.n:null,gf:sim.gf,gs:sim.gs,flavor:rng()});
  }else if(rng()<sim.lambC*(sim.prorroga?.4:1)){
    sim.gs++;sim.gols.push({m:sim.min,p:sim.opp.n,nosso:false});
    ev({tipo:"golContra",opp:sim.opp.n,gf:sim.gf,gs:sim.gs});
  }else if(rng()<.035){
    const i=sorteiaAutor(c,rng),a=i>=0?c.slots[i].p:null;
    if(a)ev({tipo:"chance",nome:a.n,flavor:rng()});
  }else if(rng()<.02){
    ev({tipo:"defesa",flavor:rng()});
  }
  if(rng()<.012){
    const i=sorteiaCartao(c,rng),a=i>=0?c.slots[i].p:null;
    if(a){
      a.amarJogo=(a.amarJogo||0)+1;a.amar++;
      if(a.amarJogo>=2){
        a.amar=0;a.amarJogo=0;a.fora=1;a._nl=true;
        if(!a.base)c.banco.push(a);
        c.slots[i].p=null;recalcLambdas(c,sim);
        ev({tipo:"expulsao",nome:a.n});
      }else if(a.amar>=2){ev({tipo:"pendurado",nome:a.n});}
      else{ev({tipo:"amarelo",nome:a.n});}
    }
  }
  if(rng()<.0004){
    const i=sorteiaCartao(c,rng),a=i>=0?c.slots[i].p:null;
    if(a){
      a.fora=rnd(rng,1,2);a._nl=true;a.amarJogo=0;
      if(!a.base)c.banco.push(a);
      c.slots[i].p=null;recalcLambdas(c,sim);
      ev({tipo:"vermDireto",nome:a.n,jogos:a.fora});
    }
  }
  if(sim.subs<5&&rng()<.006){
    const i=sorteiaAutor(c,rng);
    if(i>=0&&c.slots[i].p){
      const a=c.slots[i].p;a.fora=rnd(rng,1,2);a._nl=true;
      if(!a.base)c.banco.push(a);
      c.slots[i].p=null;
      const sub=substituir(c,i);sim.subs++;recalcLambdas(c,sim);
      ev({tipo:"subLesao",nome:a.n,jogos:a.fora,subNome:sub?sub.n:null,improviso:sub?sub.pos!==c.slots[i].role:false});
    }
  }
  if(sim.min>=lim){
    const ko=c.rodada>=3;
    if(ko&&sim.gf===sim.gs&&!sim.prorroga){sim.prorroga=true;ev({tipo:"prorrogacao"});return}
    if(ko&&sim.gf===sim.gs&&sim.prorroga){disputaPenaltis(c,sim);return}
    sim.fim=true;ev({tipo:"fim",gf:sim.gf,gs:sim.gs});
  }
}
export function simularPartida(camp,sim){let g=0;while(!sim.fim&&g++<100000)simularMinuto(camp,sim);return sim}
export function disputaPenaltis(camp,sim){
  const c=camp,rng=sim.rng;
  const gol=c.slots.find(s=>s.role==="GOL");
  const minhaDef=forcaEfetiva(gol,0), kickers=c.slots.filter(s=>s.p).map(s=>s.p).sort((a,b)=>b.f-a.f);
  let pf=0,pc=0;
  for(let i=0;i<5||pf===pc;i++){
    if(i>10)break;
    const k=kickers[i%Math.max(1,kickers.length)];
    if(rng()<.76+((k?k.f:60)-sim.opp.f)/200)pf++;
    if(rng()<.76+(sim.opp.f-minhaDef)/200)pc++;
    if(i>=4&&pf!==pc)break;
    if(i<4){const rest=4-i;if(pf>pc+rest||pc>pf+rest)break}
  }
  if(pf===pc)rng()<.5?pf++:pc++;
  sim.penaltis={pf,pc};sim.fim=true;
  sim.eventos.push({tipo:"penaltis",pf,pc});
}

// ---------------- Pós-jogo ----------------
// Encerra a partida: pontua, avança rodada, aplica recuperação/suspensão.
// Se a campanha não acabou: sorteia evento (RNG semeado) e rola o mercado.
// Retorna {res, premio, fim}. NÃO finaliza/pontua a campanha (a UI faz isso).
export function encerrarPartida(camp,sim,dados){
  const c=camp,ko=c.rodada>=3,rodadaJogada=c.rodada;
  let res, venceu=sim.gf>sim.gs||(sim.penaltis&&sim.penaltis.pf>sim.penaltis.pc);
  const empatou=sim.gf===sim.gs&&!sim.penaltis;
  c.gf+=sim.gf;c.gs+=sim.gs;if(sim.gs===0)c.cs++;
  let premio=0;
  if(venceu){premio+=PREMIO_V[c.rodada];c.moral=Math.min(3,c.moral+1);res=sim.gs===0?"V0":"V"}
  else if(empatou&&!ko){premio+=PREMIO_E[c.rodada];res="E"}
  else{c.moral=Math.max(-3,c.moral-1);res="D"}
  premio+=sim.gf*3+(sim.gs===0?10:0);
  c.caixa+=premio;
  c.resultados.push({fase:c.rodada,opp:sim.opp.n,gf:sim.gf,gs:sim.gs,res,pen:sim.penaltis,premio});
  const todos=[...c.slots.filter(s=>s.p).map(s=>s.p),...c.banco,...c.base];
  todos.forEach(p=>{if(p.fora>0&&!p._nl)p.fora--});
  todos.forEach(p=>{delete p._nl});
  todos.forEach(p=>{if(p.amar>=2){p.amar=0;p.fora=Math.max(p.fora,1)}});
  if(ko&&!venceu){c.eliminado=true;c.fim=true}
  if(!ko&&c.rodada===2){
    const pts=c.resultados.slice(0,3).reduce((a,r)=>a+(r.res[0]==="V"?3:r.res==="E"?1:0),0);
    if(pts<4){c.eliminado=true;c.fim=true;c.notaGrupo=pts}
  }
  if(c.rodada===6&&venceu){c.campeao=true;c.fim=true}
  c.rodada++;
  if(!c.fim){
    c.evento=sortearEvento(c,dados,mulberry32(hashStr(c.seed+"::ev"+rodadaJogada)));
    c.rollGratis=true;
    autoEscalar(camp);
    refreshMercado(camp,dados);
  }
  return{res,premio,fim:c.fim};
}
export function melhorContratado(camp){
  const c=camp,pool=[...c.slots.filter(s=>s.p&&!s.p.base).map(s=>s.p),...c.banco.filter(p=>!p.base)];
  pool.sort((a,b)=>b.f-a.f);return pool[0]||null;
}
// Sorteia evento pós-jogo (RNG semeado). Muta camp; devolve dados CRUS (a UI formata).
export function sortearEvento(camp,dados,rng){
  const c=camp,r=rng();
  if(r<.16){const v=rnd(rng,8,18);c.caixa+=v;return{k:"pat",clube:c.clube,valor:v}}
  if(r<.30){const alvo=melhorContratado(c);
    if(alvo){const of=Math.round(alvo.preco*1.3);
      return{k:"ass",valor:of,nome:alvo.n,forca:alvo.f,escolha:true,alvoId:alvo.id,oferta:of}}}
  if(r<.42){const p=novoJogador(dados,pick(rng,dados.SQUADS[pick(rng,dados.SQUAD_KEYS)]));p.preco=Math.round(p.preco*.6);
    if(!noElenco(c,p.id))return{k:"emp",nome:p.n,pos:p.pos,forca:p.f,clube:p.clube,ano:p.ano,valor:p.preco,escolha:true,promo:p}}
  if(r<.50){const alvos=c.slots.filter(s=>s.p);if(alvos.length){const s=pick(rng,alvos);s.p.fora=1;
    return{k:"les",nome:s.p.n}}}
  if(r<.58){c.moral=Math.min(3,c.moral+1);return{k:"chu"}}
  if(r<.64){const v=rnd(rng,3,6);c.caixa+=v;return{k:"rifa",valor:v}}
  return null;
}
// Aplica a escolha do jogador no evento. Muta camp; retorna info p/ a UI.
export function aplicarEvento(camp,aceita){
  const c=camp,ev=c.evento;if(!ev)return{ok:false};
  const out={ok:true,k:ev.k,aceita};
  if(ev.alvoId&&aceita){
    const i=c.slots.findIndex(s=>s.p&&s.p.id===ev.alvoId);
    let nome="";
    if(i>=0){nome=c.slots[i].p.n;c.slots[i].p=null}
    else{const j=c.banco.findIndex(p=>p.id===ev.alvoId);if(j>=0){nome=c.banco[j].n;c.banco.splice(j,1)}}
    c.caixa+=ev.oferta;c.vendas++;autoEscalar(camp);
    out.venda={nome,valor:ev.oferta};
  }else if(ev.alvoId){out.recusouVenda=true}
  if(ev.promo&&aceita){
    if(ev.promo.preco>c.caixa){out.empSemCaixa=true}
    else{c.caixa-=ev.promo.preco;c.gasto+=ev.promo.preco;c.contratados++;c.banco.push(ev.promo);out.empContratado={nome:ev.promo.n}}
  }
  c.evento=null;
  return out;
}

// ---------------- Pontuação / conquistas ----------------
export function calcScore(camp){
  const c=camp;
  const wins=c.resultados.filter(r=>r.res[0]==="V").length;
  const draws=c.resultados.filter(r=>r.res==="E").length;
  const alcance=[0,0,0,50,100,160,230][Math.min(6,c.rodada-1)]+(c.campeao?320:0);
  const media=mediaXI(c);
  const zebra=1+Math.max(0,(85-media))*.06;
  const perfeito=c.campeao&&wins===7&&c.gs===0;
  let base=wins*100+draws*30+c.gf*8+c.cs*40+alcance+Math.floor(c.caixa/3);
  let total=Math.round(base*zebra*(perfeito?2:c.campeao?1.3:1));
  return{total,base,zebra:zebra.toFixed(2),perfeito,wins,draws,media:Math.round(media)};
}
export function checarConquistas(camp,profile,sc){
  const c=camp,p=profile,novas=[];
  const add=id=>{if(!p.conq.includes(id)){p.conq.push(id);novas.push(id)}};
  add("estreia");
  if(sc.wins>0)add("vitoria");
  if(c.campeao)add("campeao");
  if(sc.perfeito)add("perfeito");
  if(c.campeao&&sc.media<78)add("zebra");
  if(c.campeao&&c.gasto<100)add("maodevaca");
  if(c.contratados===0&&c.resultados.length>=4)add("raiz");
  const todos=[...c.slots.filter(s=>s.p).map(s=>s.p),...c.banco,...c.base];
  if(Math.max(0,...todos.map(p2=>p2.gols))>=8)add("artilheiro");
  if(c.cs>=5)add("muralha");
  if(c.campeao&&c.golSofrencia)add("redencao");
  if(c.mode==="duelo")add("duelista");
  if(c.mode==="diario")add("diario");
  return novas;
}

// ---------------- Replay: aplicar lista de decisões ----------------
// Cada decisão: {t:"contratar",mercadoIdx,slotIdx} | {t:"escalarBase",baseId,slotIdx}
//  | {t:"escalarBanco",bancoIdx,slotIdx} | {t:"mover",from,to} | {t:"mandarBanco",slotIdx}
//  | {t:"vender",slotIdx} | {t:"venderBanco",idx} | {t:"rolar"} | {t:"formacao",f}
//  | {t:"estilo",e} | {t:"jogar"} (joga a partida da rodada) | {t:"evento",aceita}
export function aplicarDecisao(camp,dados,d){
  switch(d.t){
    case"contratar":return contratar(camp,dados,d.mercadoIdx,d.slotIdx);
    case"escalarBase":return escalarBase(camp,d.baseId,d.slotIdx);
    case"escalarBanco":return escalarBanco(camp,d.bancoIdx,d.slotIdx);
    case"mover":return mover(camp,d.from,d.to);
    case"mandarBanco":return mandarBanco(camp,d.slotIdx);
    case"vender":return vender(camp,d.slotIdx);
    case"venderBanco":return venderBanco(camp,d.idx);
    case"rolar":return rolarMercado(camp,dados);
    case"formacao":return setFormacao(camp,d.f);
    case"estilo":return setEstilo(camp,d.e);
    case"jogar":{if(camp.fim)return{ok:false,erro:"campanha_encerrada"};const{sim}=iniciarPartida(camp);simularPartida(camp,sim);return encerrarPartida(camp,sim,dados);}
    case"evento":return aplicarEvento(camp,d.aceita);
    default:return{ok:false,erro:"decisao_desconhecida"};
  }
}

// Projeção do RESULTADO (o que o teste de paridade compara). Neutro de idioma.
export function resultadoCampanha(camp,profile){
  const sc=calcScore(camp);
  const novasConq=profile?checarConquistas(camp,profile,sc):null;
  return{
    score:sc, gf:camp.gf, gs:camp.gs, cs:camp.cs, rodada:camp.rodada,
    campeao:camp.campeao, eliminado:camp.eliminado, notaGrupo:camp.notaGrupo??null,
    resultados:camp.resultados.map(r=>({fase:r.fase,opp:r.opp,gf:r.gf,gs:r.gs,res:r.res,pen:r.pen})),
    conquistas:novasConq
  };
}
