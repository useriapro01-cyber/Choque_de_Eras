/* ================= IDIOMAS (PT-BR / ES) ================= */
const I18N={
pt:{
 tag:"O MANAGER DA AMÉRICA",tec_label:"Técnico(a):",card:"carteirinha 🪪",
 antes:"Antes de apitar",comoChamar:"Como a torcida vai te chamar?",nickPh:"Apelido de técnico(a)",assinar:"Assinar a súmula",
 hero_eb:"7 jogos · o dado comanda o mercado",
 hero_h:'Monte a lenda.<br>Dome o dado.<br><span style="color:var(--ouro)">Glória Eterna.</span>',
 hero_p:"Seu clube de bairro caiu no torneio dos gigantes da América, contra os times que fizeram história no continente. Contrate quantos craques o caixa aguentar — mas cada contratação <b>embaralha o clube de referência</b> do mercado. Administre base, banco, lesões e vaidades atrás da <b>Campanha Imortal</b>: 7 vitórias, nenhum gol sofrido.",
 b_livre:"⚽ Campanha livre",b_dia:"📅 Desafio do dia",jaPontuado:"· já pontuado ✔",b_duelo:"🤝 Duelo entre amigos",b_rank:"🏅 Ranking do dia",b_ajuda:"📖 Como jogar",
 sem_storage:"⚠️ Sem conexão com o armazenamento: rankings e perfil não vão persistir nesta sessão.",
 footer:"GLÓRIA ETERNA · protótipo",toast_nick:"Digita um apelido aí, professor!",
 daily_replay:"Você já pontuou hoje. Jogar de novo só por diversão (não conta no ranking)?",
 duelo_eb:"Duelo entre amigos",duelo_h:"Mesma sorte, gestão diferente",
 duelo_p:"Todo mundo na sala começa com a mesma base, o mesmo mercado e os mesmos adversários. Vence quem gerenciar melhor. O placar da sala é público para quem tiver o código.",
 b_criarsala:"Criar sala nova",cod_ph:"CÓDIGO da sala (ex: XKQZP)",b_jogarsala:"Jogar nessa sala",b_versala:"Só ver o placar",
 toast_sala:"Sala {c} criada! Compartilhe o código.",toast_cod5:"Código tem 5 letras",
 abandonar:"✖ abandonar",voltar:"← voltar",confirm_ab:"Abandonar a campanha atual?",
 h_caixa:"Caixa",h_fase:"Fase",h_atq:"Ataque",h_def:"Defesa",h_moral:"Moral",
 fase_0:"Grupo · Jogo 1",fase_1:"Grupo · Jogo 2",fase_2:"Grupo · Jogo 3",fase_3:"Oitavas de final",fase_4:"Quartas de final",fase_5:"Semifinal",fase_6:"GRANDE FINAL",
 grupo_regra:"Fase de grupos: precisa somar 4+ pontos em 3 jogos.",mata_regra:"Mata-mata: perdeu, tá fora.",media_xi:"Média do seu XI",
 form_lbl:"Formação",estilo_lbl:"Estilo",st_of:"Ofensivo",st_eq:"Equilibrado",st_re:"Retranca",
 b_bola:"🎙️ Bola rolando!",
 mercado_eb:"Mercado — janela {n}",mercado_note:"🎰 Cada contratação sorteia um novo clube de referência.",
 b_rolar:"🎲 Rolar",gratis:"(grátis)",pago:"($8M)",
 p_GOL:"GOL",p_LAT:"LAT",p_ZAG:"ZAG",p_VOL:"VOL",p_MEI:"MEI",p_ATA:"ATA",
 vaga:"vaga",buraco:"buraco",aqui:"jogaria aqui",fora_nj:"fora {n}j",base_tag:"base",
 base_h:"La cantera — nossa base",base_badge:"11 crias",cria:"cria do clube",banco_h:"Banco de contratados",
 b_escalar:"Escalar",b_contratar:"Contratar",no_elenco:"no elenco",em_campo:"em campo",dm:"DM {n}j",
 b_mover:"Mover",b_banco:"Banco",b_vender:"Vender {v}",fechar:"fechar",
 improv_nota:"⚠ improvisado: joga com {p}",
 pend_mover:"Mover {n}",pend_escalar:"Escalar {n} ({pos} {f})",
 pend_p:"Toque na posição do campo onde ele vai jogar. Fora de posição a força cai (vizinha −7, longe −13, gol −20).",
 b_cancelar:"Cancelar",
 t_ja_elenco:"{n} já está no seu elenco",t_sem_caixa:"Caixa insuficiente: {n} custa {v}",t_fora:"{n} está fora por {k} jogo(s)",
 t_dm:"{n} está no departamento médico",t_ja_campo:"{n} já está em campo",
 t_contratado:"{n} contratado! Titular como {r}",t_improv:" (improvisado)",t_vendido:"{n} vendido por {v}",
 t_base_nv:"Cria da base não se vende. É patrimônio do clube!",t_jovem:"Jovem da base volta pro grupo sozinho — use Mover",
 t_rolar_caixa:"Caixa insuficiente pra rolar de novo ($8M)",
 prorroga:"· prorrogação",fim_lbl:"FIM",pen_lbl:"PÊN",b_continuar:"Continuar →",
 v_radio:"▶ Rádio",v_rapido:"⏩ Rápido",v_direto:"⏭ Direto pro fim",aguarda:"A bola vai rolar...",
 res_v:"VITÓRIA!",res_e:"Empate...",res_d:"Derrota",gols_lbl:"Gols",premio_lbl:"Premiação: +{v}",cs_badge:"VALLA INVICTA +10M",
 b_janela:"🛒 Abrir janela de transferências",b_aceitar:"Aceitar",b_recusar:"Recusar",b_seguir:"Seguir o baile",
 perf_t:"👑 CAMPANHA IMORTAL!",perf_s:"Campeão da América invicto e sem sofrer UM gol. Glória Eterna de verdade.",
 camp_t:"🏆 CAMPEÃO DA AMÉRICA!",camp_s:"A taça é sua — mas a Campanha Imortal ainda te espera.",
 elim_t:"📉 Eliminado",elim_grupo:"Só {p} pts no grupo (precisava de 4). A diretoria quer conversar.",elim_s:"Caiu na porrada do mata-mata. Bola pra frente.",
 mult_imortal:" × 2 (imortal)",mult_camp:" × 1.3 (campeão)",pts_base:"base {b} × zebra {z}",
 tb_fase:"Fase",tb_adv:"Adversário",tb_placar:"Placar",tb_tec:"Técnico",
 resumo:"Gols pró {gf} · sofridos {gs} · jogos sem sofrer {cs} · gasto total {g} · média XI {m}",
 b_copiar:"📋 Copiar resultado pro grupo",b_rankdia2:"🏅 Ver ranking do dia",b_sala2:"🤝 Placar da sala {c}",
 b_denovo:"↻ Jogar de novo",b_inicio:"🏠 Início",
 rank_eb:"Ranking mundial · desafio de {d}",
 rank_p:"Todo mundo joga a mesma seed hoje: mesma base, mesmo mercado, mesmos adversários. Só a primeira campanha finalizada do dia pontua. O ranking é público entre jogadores.",
 rank_vazio:"Ninguém pontuou ainda. Seja o primeiro nome da súmula!",b_jogar_hoje:"Jogar o desafio de hoje",carregando:"Carregando súmula...",
 sala_eb:"Duelo · sala",sala_p:"Compartilhe o código <b>{c}</b> com a galera. Mesma seed, placares públicos na sala.",
 sala_nao:"Sala não encontrada — confere o código ou crie uma nova.",b_jogar_sala:"Jogar nesta sala",buscando:"Buscando placar...",
 perfil_eb:"Carteirinha de técnico(a)",sem_nome:"Sem nome",p_camp:"Campanhas",p_tit:"Títulos da América",p_imort:"Campanhas imortais",p_rec:"Recorde de pontos",p_leg:"Legado (pontos acumulados)",trofeus:"Sala de troféus",
 aj_t:"Como jogar",
 aj_1:"Seu clube de bairro foi convidado pro <b>torneio dos gigantes da América</b>: 3 jogos de grupo (some 4+ pontos) e mata-mata até a final, sempre contra esquadrões históricos do continente cada vez mais fortes.",
 aj_2:"<b>🎰 Mercado:</b> o dado sorteia um clube histórico de referência. Contrate quantos couberem no caixa — mas cada contratação embaralha o clube e traz outro. Rolar na mão: 1x grátis por janela, depois $8M. Venda por 70% do valor. Lendas custam MUITO caro.",
 aj_3:"<b>📋 Gestão:</b> você escolhe a posição de cada um — fora de posição a força despenca. Formação e estilo mudam ataque/defesa. Lesionou, entra alguém do banco na hora; 2 amarelos = suspensão. A base (11 crias, todas as posições) completa o time sozinha: dá até pra disputar só com ela.",
 aj_4:"<b>👑 O objetivo:</b> ser campeão com <b>7 vitórias e nenhum gol sofrido</b> — a Campanha Imortal, que dobra a pontuação. Times mais fracos multiplicam pontos: fácil é ganhar de galáctico, glorioso é ganhar com o Operário Pé Quente.",
 aj_5:"<b>🤝 Com amigos:</b> no Desafio do Dia todos jogam a mesma seed e disputam o ranking. No Duelo, crie uma sala, mande o código e compare campanhas. Copie o resultado com emojis e cole no grupo.",
 share:"GLÓRIA ETERNA ⚽ {modo}\n{clube} — {st}\n{em}\n{pts} pts (média XI {m}, zebra ×{z})",
 sh_perf:"👑 CAMPANHA IMORTAL!!",sh_camp:"🏆 CAMPEÃO DA AMÉRICA",sh_elim:"❌ eliminado ({f})",
 modo_dia:"Desafio {d}",modo_duelo:"Duelo sala {c}",modo_livre:"Campanha livre",
 t_copiado:"Resultado copiado! Cola no grupo 😎",t_nao_copiou:"Não consegui copiar automaticamente",
 desfalque:"Desfalque: {n} (fora {k} jogo{s})",entra_base:"Da base, entra {n} ({pos})",improvisa:"Da base, improvisa {n} ({pos}→{r})",
 sub_les:"🩹 {n} sai de maca (fora {k}j). <b>Entra {s}</b>{im}.",sub_im:" improvisado",sub_sem:"🩹 {n} sai de maca e o banco acabou! Jogamos com um a menos.",
 expulso:"🟥 Segundo amarelo NO JOGO! {n} está expulso — fora do restante da partida e suspenso do próximo jogo. Jogamos com um a menos!",pendurado:"🟨 Amarelo para {n} — segundo cartão na campanha: cumpre suspensão no PRÓXIMO jogo, mas segue em campo.",verm_direto:"🟥 VERMELHO DIRETO! {n} entrou de carrinho criminoso: expulso e fora por {k} jogo(s). Um a menos!",amarelo:"🟨 Amarelo para {n}",susp_prox:" — <b>suspenso do próximo jogo!</b>",
 prorrog_msg:"⏱️ Empate no tempo normal. PRORROGAÇÃO!",fimjogo:"📢 FIM DE JOGO: {a} × {b}",
 pen_win:"🥅 PÊNALTIS {a}×{b} — CLASSIFICADOS! O goleiro virou herói!",pen_lose:"🥅 PÊNALTIS {a}×{b} — eliminados na marca da cal...",
 gol_deles:"Gol do {o}... {a}×{b}",
 ev_pat_t:"💰 Patrocínio fechado!",ev_pat_d:"A Pamonharia Eletrônica do seu Zé assinou com o {c}. Entram {v} no caixa.",
 ev_ass_t:"📞 Assédio de gigante europeu",ev_ass_d:"Um clube milionário ofereceu {v} pelo seu craque {n} ({f}). Vender?",
 ev_emp_t:"🕵️ Oportunidade de empresário",ev_emp_d:"{n} ({pos} {f}, {cl} {ano}) direto pro seu banco por {v} — 40% off, sem mexer no mercado. Fechar?",
 ev_les_t:"🩹 Lesão no treino",ev_les_d:"{n} torceu o tornozelo no rachão. Fora do próximo jogo.",
 ev_chu_t:"🍖 Churrasco do elenco",ev_chu_d:"A resenha foi boa e o grupo tá fechado. Moral +1.",
 ev_rifa_t:"🎟️ Rifa do clube",ev_rifa_d:"A comunidade se mobilizou: +{v} pro caixa.",
 t_ass_ok:"{n} vendido por {v}",t_ass_nao:"Proposta recusada. O craque fica!",t_emp_ok:"{n} chegou direto pro banco!",t_emp_caixa:"Caixa insuficiente pra fechar...",
 cq_estreia:"Estreia no comando",cqd_estreia:"Termine sua primeira campanha",
 cq_vitoria:"Primeira vitória",cqd_vitoria:"Vença um jogo",
 cq_campeao:"Campeão da América",cqd_campeao:"Levante a taça",
 cq_perfeito:"CAMPANHA IMORTAL",cqd_perfeito:"Campeão com 7 vitórias e nenhum gol sofrido",
 cq_zebra:"Zebra suprema",cqd_zebra:"Seja campeão com XI de média final abaixo de 78",
 cq_maodevaca:"Mão de vaca",cqd_maodevaca:"Seja campeão gastando menos de $100M",
 cq_raiz:"Time raiz",cqd_raiz:"Passe da fase de grupos sem contratar ninguém — só a cantera",
 cq_artilheiro:"Fábrica de artilheiro",cqd_artilheiro:"Um jogador seu com 8+ gols na campanha",
 cq_muralha:"Valla invicta",cqd_muralha:"5+ jogos sem sofrer gol numa campanha",
 cq_duelista:"Resenha valendo",cqd_duelista:"Termine um duelo entre amigos",
 cq_diario:"Ponto batido",cqd_diario:"Termine um desafio do dia",
 cq_novas:"🎖️ Conquista{s} desbloqueada{s}!"
},
es:{
 tag:"EL MÁNAGER DE AMÉRICA",tec_label:"DT:",card:"carnet 🪪",
 antes:"Antes del pitazo",comoChamar:"¿Cómo te va a gritar la hinchada?",nickPh:"Apodo de DT",assinar:"Firmar la planilla",
 hero_eb:"7 partidos · el dado maneja el mercado",
 hero_h:'Armá la leyenda.<br>Domá el dado.<br><span style="color:var(--ouro)">Gloria Eterna.</span>',
 hero_p:"Tu club de barrio cayó en el torneo de los gigantes de América, contra los equipos que hicieron historia en el continente. Fichá todos los cracks que aguante la caja — pero cada fichaje <b>sortea un nuevo club de referencia</b> en el mercado. Administrá cantera, banco, lesiones y egos detrás de la <b>Campaña Inmortal</b>: 7 victorias, ningún gol en contra.",
 b_livre:"⚽ Campaña libre",b_dia:"📅 Desafío del día",jaPontuado:"· ya puntuado ✔",b_duelo:"🤝 Duelo entre amigos",b_rank:"🏅 Ranking del día",b_ajuda:"📖 Cómo jugar",
 sem_storage:"⚠️ Sin conexión con el almacenamiento: rankings y perfil no van a persistir en esta sesión.",
 footer:"GLORIA ETERNA · prototipo",toast_nick:"¡Poné un apodo, profe!",
 daily_replay:"Ya puntuaste hoy. ¿Jugar de nuevo solo por diversión (no cuenta pal ranking)?",
 duelo_eb:"Duelo entre amigos",duelo_h:"Misma suerte, distinta gestión",
 duelo_p:"Todos en la sala arrancan con la misma cantera, el mismo mercado y los mismos rivales. Gana el que mejor gestione. El marcador de la sala es público para quien tenga el código.",
 b_criarsala:"Crear sala nueva",cod_ph:"CÓDIGO de la sala (ej: XKQZP)",b_jogarsala:"Jugar en esa sala",b_versala:"Solo ver el marcador",
 toast_sala:"¡Sala {c} creada! Compartí el código.",toast_cod5:"El código tiene 5 letras",
 abandonar:"✖ abandonar",voltar:"← volver",confirm_ab:"¿Abandonar la campaña actual?",
 h_caixa:"Caja",h_fase:"Fase",h_atq:"Ataque",h_def:"Defensa",h_moral:"Moral",
 fase_0:"Grupo · Partido 1",fase_1:"Grupo · Partido 2",fase_2:"Grupo · Partido 3",fase_3:"Octavos de final",fase_4:"Cuartos de final",fase_5:"Semifinal",fase_6:"GRAN FINAL",
 grupo_regra:"Fase de grupos: hay que sumar 4+ puntos en 3 partidos.",mata_regra:"Mata-mata: si perdés, afuera.",media_xi:"Promedio de tu XI",
 form_lbl:"Formación",estilo_lbl:"Estilo",st_of:"Ofensivo",st_eq:"Equilibrado",st_re:"Cerrojo",
 b_bola:"🎙️ ¡Que ruede la pelota!",
 mercado_eb:"Mercado — ventana {n}",mercado_note:"🎰 Cada fichaje sortea un nuevo club de referencia.",
 b_rolar:"🎲 Tirar",gratis:"(gratis)",pago:"($8M)",
 p_GOL:"ARQ",p_LAT:"LAT",p_ZAG:"DEF",p_VOL:"VOL",p_MEI:"MED",p_ATA:"DEL",
 vaga:"puesto",buraco:"hueco",aqui:"jugaría acá",fora_nj:"afuera {n}p",base_tag:"cantera",
 base_h:"La cantera",base_badge:"11 pibes",cria:"canterano",banco_h:"Banco de fichajes",
 b_escalar:"Poner",b_contratar:"Fichar",no_elenco:"en plantel",em_campo:"en cancha",dm:"enfermería {n}p",
 b_mover:"Mover",b_banco:"Al banco",b_vender:"Vender {v}",fechar:"cerrar",
 improv_nota:"⚠ fuera de puesto: juega con {p}",
 pend_mover:"Mover a {n}",pend_escalar:"Poner a {n} ({pos} {f})",
 pend_p:"Tocá la posición de la cancha donde va a jugar. Fuera de puesto la fuerza baja (vecina −7, lejos −13, arco −20).",
 b_cancelar:"Cancelar",
 t_ja_elenco:"{n} ya está en tu plantel",t_sem_caixa:"Caja insuficiente: {n} cuesta {v}",t_fora:"{n} está afuera por {k} partido(s)",
 t_dm:"{n} está en la enfermería",t_ja_campo:"{n} ya está en cancha",
 t_contratado:"¡{n} fichado! Titular como {r}",t_improv:" (fuera de puesto)",t_vendido:"{n} vendido por {v}",
 t_base_nv:"El canterano no se vende. ¡Es patrimonio del club!",t_jovem:"El pibe vuelve solo al grupo — usá Mover",
 t_rolar_caixa:"Caja insuficiente para tirar de nuevo ($8M)",
 prorroga:"· alargue",fim_lbl:"FIN",pen_lbl:"PEN",b_continuar:"Continuar →",
 v_radio:"▶ Relato",v_rapido:"⏩ Rápido",v_direto:"⏭ Al final",aguarda:"La pelota va a rodar...",
 res_v:"¡VICTORIA!",res_e:"Empate...",res_d:"Derrota",gols_lbl:"Goles",premio_lbl:"Premio: +{v}",cs_badge:"VALLA INVICTA +10M",
 b_janela:"🛒 Abrir ventana de fichajes",b_aceitar:"Aceptar",b_recusar:"Rechazar",b_seguir:"Seguir nomás",
 perf_t:"👑 ¡CAMPAÑA INMORTAL!",perf_s:"Campeón de América invicto y sin recibir UN gol. Gloria Eterna de verdad.",
 camp_t:"🏆 ¡CAMPEÓN DE AMÉRICA!",camp_s:"La copa es tuya — pero la Campaña Inmortal todavía te espera.",
 elim_t:"📉 Eliminado",elim_grupo:"Solo {p} pts en el grupo (necesitabas 4). La dirigencia quiere charlar.",elim_s:"Te bajaron en el mata-mata. La próxima es nuestra.",
 mult_imortal:" × 2 (inmortal)",mult_camp:" × 1.3 (campeón)",pts_base:"base {b} × sorpresa {z}",
 tb_fase:"Fase",tb_adv:"Rival",tb_placar:"Marcador",tb_tec:"DT",
 resumo:"Goles a favor {gf} · en contra {gs} · vallas invictas {cs} · gasto total {g} · promedio XI {m}",
 b_copiar:"📋 Copiar resultado pal grupo",b_rankdia2:"🏅 Ver ranking del día",b_sala2:"🤝 Marcador de la sala {c}",
 b_denovo:"↻ Jugar de nuevo",b_inicio:"🏠 Inicio",
 rank_eb:"Ranking mundial · desafío del {d}",
 rank_p:"Todos juegan la misma seed hoy: misma cantera, mismo mercado, mismos rivales. Solo la primera campaña terminada del día puntúa. El ranking es público entre jugadores.",
 rank_vazio:"Nadie puntuó todavía. ¡Sé el primer nombre de la planilla!",b_jogar_hoje:"Jugar el desafío de hoy",carregando:"Cargando planilla...",
 sala_eb:"Duelo · sala",sala_p:"Compartí el código <b>{c}</b> con la banda. Misma seed, marcadores públicos en la sala.",
 sala_nao:"Sala no encontrada — revisá el código o creá una nueva.",b_jogar_sala:"Jugar en esta sala",buscando:"Buscando marcador...",
 perfil_eb:"Carnet de DT",sem_nome:"Sin nombre",p_camp:"Campañas",p_tit:"Títulos de América",p_imort:"Campañas inmortales",p_rec:"Récord de puntos",p_leg:"Legado (puntos acumulados)",trofeus:"Sala de trofeos",
 aj_t:"Cómo jugar",
 aj_1:"Tu club de barrio fue invitado al <b>torneo de los gigantes de América</b>: 3 partidos de grupo (sumá 4+ puntos) y mata-mata hasta la final, siempre contra escuadrones históricos del continente cada vez más fuertes.",
 aj_2:"<b>🎰 Mercado:</b> el dado sortea un club histórico de referencia. Fichá todos los que entren en la caja — pero cada fichaje baraja el club y trae otro. Tirar a mano: 1x gratis por ventana, después $8M. Vendé al 70% del valor. Las leyendas cuestan CARÍSIMO.",
 aj_3:"<b>📋 Gestión:</b> vos elegís la posición de cada uno — fuera de puesto la fuerza se derrumba. Formación y estilo cambian ataque/defensa. Si se lesiona, entra uno del banco al toque; 2 amarillas = suspensión. La cantera (11 pibes, todas las posiciones) completa el equipo sola: hasta podés competir solo con ella.",
 aj_4:"<b>👑 El objetivo:</b> salir campeón con <b>7 victorias y ningún gol en contra</b> — la Campaña Inmortal, que duplica el puntaje. Los equipos más débiles multiplican puntos: fácil es ganar con un galáctico, glorioso es ganar con el Defensores del Barrio.",
 aj_5:"<b>🤝 Con amigos:</b> en el Desafío del Día todos juegan la misma seed y pelean el ranking. En el Duelo, creá una sala, pasá el código y comparen campañas. Copiá el resultado con emojis y pegalo en el grupo.",
 share:"GLORIA ETERNA ⚽ {modo}\n{clube} — {st}\n{em}\n{pts} pts (promedio XI {m}, sorpresa ×{z})",
 sh_perf:"👑 ¡¡CAMPAÑA INMORTAL!!",sh_camp:"🏆 CAMPEÓN DE AMÉRICA",sh_elim:"❌ eliminado ({f})",
 modo_dia:"Desafío {d}",modo_duelo:"Duelo sala {c}",modo_livre:"Campaña libre",
 t_copiado:"¡Resultado copiado! Pegalo en el grupo 😎",t_nao_copiou:"No pude copiar automáticamente",
 desfalque:"Baja: {n} (afuera {k} partido{s})",entra_base:"De la cantera, entra {n} ({pos})",improvisa:"De la cantera, improvisa {n} ({pos}→{r})",
 sub_les:"🩹 {n} sale en camilla (afuera {k}p). <b>Entra {s}</b>{im}.",sub_im:" fuera de puesto",sub_sem:"🩹 {n} sale en camilla ¡y no queda banco! Jugamos con uno menos.",
 expulso:"🟥 ¡Segunda amarilla EN EL PARTIDO! {n} expulsado — afuera del resto del partido y suspendido del próximo. ¡Jugamos con uno menos!",pendurado:"🟨 Amarilla para {n} — segunda en la campaña: suspendido para el PRÓXIMO partido, pero sigue en cancha.",verm_direto:"🟥 ¡ROJA DIRECTA! {n} entró asesino: expulsado y afuera por {k} partido(s). ¡Uno menos!",amarelo:"🟨 Amarilla para {n}",susp_prox:" — <b>¡suspendido del próximo partido!</b>",
 prorrog_msg:"⏱️ Empate en los 90. ¡ALARGUE!",fimjogo:"📢 FINAL DEL PARTIDO: {a} × {b}",
 pen_win:"🥅 PENALES {a}×{b} — ¡CLASIFICADOS! ¡El arquero es héroe!",pen_lose:"🥅 PENALES {a}×{b} — eliminados desde los doce pasos...",
 gol_deles:"Gol de {o}... {a}×{b}",
 ev_pat_t:"💰 ¡Sponsor cerrado!",ev_pat_d:"La Parrilla Eléctrica de Don Cacho firmó con {c}. Entran {v} a la caja.",
 ev_ass_t:"📞 Acoso de gigante europeo",ev_ass_d:"Un club millonario ofreció {v} por tu crack {n} ({f}). ¿Vender?",
 ev_emp_t:"🕵️ Oportunidad de representante",ev_emp_d:"{n} ({pos} {f}, {cl} {ano}) directo a tu banco por {v} — 40% off, sin tocar el mercado. ¿Cerramos?",
 ev_les_t:"🩹 Lesión en la práctica",ev_les_d:"{n} se dobló el tobillo en el picado. Afuera del próximo partido.",
 ev_chu_t:"🥩 Asado del plantel",ev_chu_d:"La juntada estuvo buena y el grupo está cerrado. Moral +1.",
 ev_rifa_t:"🎟️ Rifa del club",ev_rifa_d:"El barrio se movilizó: +{v} pa' la caja.",
 t_ass_ok:"{n} vendido por {v}",t_ass_nao:"Propuesta rechazada. ¡El crack se queda!",t_emp_ok:"¡{n} llegó directo al banco!",t_emp_caixa:"Caja insuficiente para cerrar...",
 cq_estreia:"Debut en el banco",cqd_estreia:"Terminá tu primera campaña",
 cq_vitoria:"Primera victoria",cqd_vitoria:"Ganá un partido",
 cq_campeao:"Campeón de América",cqd_campeao:"Levantá la copa",
 cq_perfeito:"CAMPAÑA INMORTAL",cqd_perfeito:"Campeón con 7 victorias y ningún gol en contra",
 cq_zebra:"Batacazo supremo",cqd_zebra:"Salí campeón con XI de promedio final abajo de 78",
 cq_maodevaca:"Amarrete",cqd_maodevaca:"Salí campeón gastando menos de $100M",
 cq_raiz:"Puro potrero",cqd_raiz:"Pasá la fase de grupos sin fichar a nadie — pura cantera",
 cq_artilheiro:"Fábrica de goleador",cqd_artilheiro:"Un jugador tuyo con 8+ goles en la campaña",
 cq_muralha:"Valla invicta",cqd_muralha:"5+ partidos sin recibir gol en una campaña",
 cq_duelista:"Picadito que vale",cqd_duelista:"Terminá un duelo entre amigos",
 cq_diario:"Presente firmado",cqd_diario:"Terminá un desafío del día",
 cq_novas:"🎖️ ¡Logro{s} desbloqueado{s}!"
}};
const NARR={
pt:{gol:["GOOOOOL! {p} balança as redes","QUE PINTURA! Golaço de {p}","{p} aproveita o rebote e marca","De cabeça! {p} sobe mais que todo mundo","Contra-ataque fulminante e {p} finaliza no canto","{p} cobra falta com categoria: é gol","Pênalti convertido com frieza por {p}","{p} dribla o goleiro e empurra pro fundo do gasoso"],
chance:["{p} carimba a trave!","Defesaça do goleiro em chute de {p}!","{p} manda por cima, tirando tinta do travessão","Que perdida de {p}, na cara do gol!","Bicicleta de {p}... pra fora!"],
def:["Nosso goleiro faz um MILAGRE!","A zaga tira em cima da linha!","O adversário para na nossa muralha","Pressão adversária, mas a defesa segura firme"]},
es:{gol:["¡GOOOOOL! {p} sacude la red","¡QUÉ PINTURA! Golazo de {p}","{p} aprovecha el rebote y la manda a guardar","¡De cabeza! {p} le gana a todos por arriba","Contragolpe letal y {p} define al palo","{p} clava el tiro libre: es gol","Penal cambiado por gol con frialdad por {p}","{p} gambetea al arquero y la empuja adentro"],
chance:["¡{p} sacude el palo!","¡Atajadón del arquero al remate de {p}!","{p} la tira por arriba, rozando el travesaño","¡Qué se perdió {p}, solo frente al arco!","Chilena de {p}... ¡afuera!"],
def:["¡Nuestro arquero hace un MILAGRO!","¡La defensa la saca sobre la línea!","El rival choca contra nuestra muralla","Presión rival, pero la defensa aguanta firme"]}};
function t(k,v){let s=(I18N[S.lang]&&I18N[S.lang][k])||I18N.pt[k]||k;if(v)for(const x in v)s=s.split("{"+x+"}").join(v[x]);return s}
/* ================= DADOS — GIGANTES DA AMÉRICA ================= */
/* [nome, posição, força, clube, ano] */
/* @DATA: DB injetado no build */
/* @DATA: CLUBE_PAIS injetado no build */
/* @DATA: FLAG_PAIS injetado no build */
function flagClube(nome){return FLAG_PAIS[CLUBE_PAIS[nome]]||"🏳️"}
/* Adversários históricos (nem todos precisam de elenco no mercado) */
/* @DATA: OPPS injetado no build */
/* La cantera: pools de nome (NOMES_BASE/SOBRENOMES_BASE/NOMES_CLUBE) vêm do bloco de dados injetado no build (fonte: data/nomes.json) */
/* ================= MOTOR — a lógica pura vive em src/engine.js ================= */
const MR=Math.random;
function fmtM(v){return "$"+Math.round(v)+"M"}
/* dados para o motor (DB/ERAS/OPPS vêm do bloco injetado no build) */
const NOMES_POOLS=lang=>({base:NOMES_BASE[lang],sobrenomes:SOBRENOMES_BASE[lang],clubeA:NOMES_CLUBE[lang].a,clubeB:NOMES_CLUBE[lang].b});
const DADOS=Engine.montarDados({DB,ERAS,OPPS});
function dadosAtuais(){DADOS.nomes=NOMES_POOLS(S.lang);return DADOS}
function geraSeed(){return "livre-"+Date.now()+"-"+Math.floor(MR()*1e6)}
/* reexpõe helpers do motor com os nomes que a UI usa */
const {FORMACOES,ESTILOS,ADJ,CONQ_IDS,preco,penalPos,forcaEfetiva}=Engine;
function mediaXI(){return Engine.mediaXI(S.camp)}
function ratingTime(){return Engine.ratingTime(S.camp)}
function escaladosSet(){return Engine.escaladosSet(S.camp)}
function baseDisponivel(){return Engine.baseDisponivel(S.camp)}
function noElenco(id){return Engine.noElenco(S.camp,id)}
/* ---------- storage / estado ---------- */
async function stGet(k,shared){try{const r=await window.storage.get(k,!!shared);return r?JSON.parse(r.value):null}catch(e){return null}}
async function stSet(k,v,shared){try{await window.storage.set(k,JSON.stringify(v),!!shared)}catch(e){}}
const PROFILE_KEY="choque:perfil";
let S={screen:"home",lang:"pt",profile:null,camp:null,sim:null,sel:null,pend:null,salaCode:null,storageOk:(typeof window!=="undefined"&&!!window.storage)};
async function loadProfile(){
  let p=await stGet(PROFILE_KEY,false);
  if(!p)p={nick:"",lang:"pt",jogos:0,titulos:0,perfeitos:0,recorde:0,legado:0,conq:[],dailyFeito:""};
  S.profile=p;S.lang=p.lang||"pt";
}
function saveProfile(){S.profile.lang=S.lang;stSet(PROFILE_KEY,S.profile,false)}
function toggleLang(){S.lang=S.lang==="pt"?"es":"pt";saveProfile();render()}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(el._to);el._to=setTimeout(()=>el.classList.remove("show"),2600)}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function pl(p){return t("p_"+p)}
/* ---------- mercado (rolar manual) ---------- */
function rolarMercado(){
  const r=Engine.rolarMercado(S.camp,dadosAtuais());
  if(!r.ok){toast(t("t_rolar_caixa"));return}
  render();
}
/* ---------- escolher onde o jogador vai jogar ---------- */
function iniciarContratacao(pi){
  const c=S.camp,p=c.mercado.jog[pi];
  if(noElenco(p.id)){toast(t("t_ja_elenco",{n:p.n}));return}
  if(p.preco>c.caixa){toast(t("t_sem_caixa",{n:p.n,v:fmtM(p.preco)}));return}
  S.pend={tipo:"mercado",p,pi};S.sel=null;render();window.scrollTo(0,0);
}
function iniciarEscalarBanco(i){const p=S.camp.banco[i];if(!p)return;
  if(p.fora>0){toast(t("t_fora",{n:p.n,k:p.fora}));return}
  S.pend={tipo:"banco",p,idx:i};S.sel=null;render();window.scrollTo(0,0)}
function iniciarEscalarBase(id){const p=S.camp.base.find(b=>b.id===id);if(!p)return;
  if(p.fora>0){toast(t("t_dm",{n:p.n}));return}
  if(escaladosSet().has(p.id)){toast(t("t_ja_campo",{n:p.n}));return}
  S.pend={tipo:"base",p};S.sel=null;render();window.scrollTo(0,0)}
function iniciarMover(i){S.pend={tipo:"mover",from:i,p:S.camp.slots[i].p};S.sel=null;render();window.scrollTo(0,0)}
function cancelarPend(){S.pend=null;render()}
function colocarEm(i){
  const pd=S.pend;if(!pd)return;
  if(pd.tipo==="mover"){Engine.mover(S.camp,pd.from,i);}
  else if(pd.tipo==="mercado"){
    const r=Engine.contratar(S.camp,dadosAtuais(),pd.pi,i);
    if(r.ok)toast(t("t_contratado",{n:r.nome,r:pl(r.role)})+(r.improviso?t("t_improv"):""));
  }
  else if(pd.tipo==="banco"){Engine.escalarBanco(S.camp,pd.idx,i);}
  else if(pd.tipo==="base"){Engine.escalarBase(S.camp,pd.p.id,i);}
  S.pend=null;S.sel=null;render();
}
function selSlot(i){if(S.pend){colocarEm(i);return}S.sel=(S.sel===i?null:i);render()}
function mandarBanco(i){
  const r=Engine.mandarBanco(S.camp,i);
  if(!r.ok&&r.erro==="jovem"){toast(t("t_jovem"));return}
  S.sel=null;render();
}
function venderSlot(i){
  const r=Engine.vender(S.camp,i);
  if(!r.ok){if(r.erro==="base_nv")toast(t("t_base_nv"));return}
  toast(t("t_vendido",{n:r.nome,v:fmtM(r.valor)}));S.sel=null;render();
}
function venderBanco(i){
  const r=Engine.venderBanco(S.camp,i);
  if(r.ok)toast(t("t_vendido",{n:r.nome,v:fmtM(r.valor)}));
  render();
}
function setFormacao(f){
  const r=Engine.setFormacao(S.camp,f);
  if(!r.ok)return;
  S.pend=null;S.sel=null;render();
}
function setEstilo(e){Engine.setEstilo(S.camp,e);render()}
/* ================= PARTIDA (UI sobre o motor) ================= */
function startMatch(){
  const {sim,escalacao}=Engine.iniciarPartida(S.camp);
  S.sim=sim;S.pend=null;S.sel=null;
  S.sim.escalacaoMsgs=escalacao.map(narrarEscalacao);
  S.screen="jogo";render();
  runTicker();
}
function runTicker(){
  const sim=S.sim;clearInterval(sim.timer);
  if(sim.speed>=99){Engine.simularPartida(S.camp,sim);render();return}
  sim.timer=setInterval(()=>{Engine.simularMinuto(S.camp,sim);renderPlacarVivo();if(sim.fim){clearInterval(sim.timer);setTimeout(render,650)}},sim.speed===1?520:180);
}
function tickMin(){return Engine.simularMinuto(S.camp,S.sim)}
function setSpeed(v){S.sim.speed=v;if(!S.sim.fim)runTicker();else render()}
/* narração: eventos estruturados do motor -> texto localizado */
function narrarEscalacao(m){
  if(m.tipo==="desfalque")return "📋 "+esc(t("desfalque",{n:m.nome,k:m.jogos,s:m.jogos>1?"s":""}));
  if(m.tipo==="entra_base")return "📋 "+esc(t("entra_base",{n:m.nome,pos:pl(m.pos)}));
  return "📋 "+esc(t("improvisa",{n:m.nome,pos:pl(m.pos),r:pl(m.role)}));
}
function narrarEvento(e){
  const N=NARR[S.lang]||NARR.pt, m=e.min;
  switch(e.tipo){
    case"gol":return{c:"gol",t:m+"' — "+N.gol[Math.floor(e.flavor*N.gol.length)].replace("{p}","<b>"+esc(e.nome||"#9")+"</b>")+"! <b>"+e.gf+"×"+e.gs+"</b>"};
    case"golContra":return{c:"contra",t:m+"' — "+t("gol_deles",{o:esc(e.opp),a:e.gf,b:e.gs})};
    case"chance":return{c:"",t:m+"' — "+N.chance[Math.floor(e.flavor*N.chance.length)].replace("{p}",esc(e.nome))};
    case"defesa":return{c:"",t:m+"' — "+N.def[Math.floor(e.flavor*N.def.length)]};
    case"amarelo":return{c:"",t:m+"' — "+t("amarelo",{n:esc(e.nome)})};
    case"pendurado":return{c:"",t:m+"' — "+t("pendurado",{n:esc(e.nome)})};
    case"expulsao":return{c:"contra",t:m+"' — "+t("expulso",{n:esc(e.nome)})};
    case"vermDireto":return{c:"contra",t:m+"' — "+t("verm_direto",{n:esc(e.nome),k:e.jogos})};
    case"subLesao":return e.subNome?{c:"contra",t:m+"' — "+t("sub_les",{n:esc(e.nome),k:e.jogos,s:esc(e.subNome),im:e.improviso?t("sub_im"):""})}:{c:"contra",t:m+"' — "+t("sub_sem",{n:esc(e.nome)})};
    case"prorrogacao":return{c:"fim",t:t("prorrog_msg")};
    case"penaltis":return{c:"fim",t:t(e.pf>e.pc?"pen_win":"pen_lose",{a:e.pf,b:e.pc})};
    case"fim":return{c:"fim",t:t("fimjogo",{a:e.gf,b:e.gs})};
  }
  return{c:"",t:""};
}
/* ---------- pós-jogo (UI sobre o motor) ---------- */
function encerrarPartida(){
  Engine.encerrarPartida(S.camp,S.sim,dadosAtuais());
  if(S.camp.fim){finalizarCampanha();return}
  S.screen="posjogo";render();
}
function eventoEscolha(aceita){
  const r=Engine.aplicarEvento(S.camp,aceita);
  if(r.venda)toast(t("t_ass_ok",{n:r.venda.nome,v:fmtM(r.venda.valor)}));
  else if(r.recusouVenda)toast(t("t_ass_nao"));
  if(r.empSemCaixa)toast(t("t_emp_caixa"));
  else if(r.empContratado)toast(t("t_emp_ok",{n:r.empContratado.nome}));
  render();
}
/* pontuação e conquistas vivem no motor (Engine.calcScore / Engine.checarConquistas) */
async function finalizarCampanha(){
  const c=S.camp,sc=Engine.calcScore(c);
  c.score=sc;
  const p=S.profile;
  p.jogos++;if(c.campeao)p.titulos++;if(sc.perfeito)p.perfeitos++;
  p.recorde=Math.max(p.recorde,sc.total);p.legado+=sc.total;
  c.novasConq=Engine.checarConquistas(c,p,sc);
  saveProfile();
  if(S.storageOk&&p.nick){
    if(c.mode==="diario"&&p.dailyFeito!==hojeStr()){
      p.dailyFeito=hojeStr();saveProfile();
      await pushRank("choque:dia:"+hojeStr(),sc,c);
    }
    if(c.mode==="duelo"&&c.roomCode)await pushRank("choque:sala:"+c.roomCode,sc,c);
  }
  S.screen="fim";render();
}
async function pushRank(key,sc,c){
  try{
    const cur=(await stGet(key,true))||{entries:[]};
    cur.entries.push({nick:S.profile.nick,pts:sc.total,perf:sc.perfeito,campeao:c.campeao,fase:c.rodada,ts:Date.now()});
    cur.entries.sort((a,b)=>b.pts-a.pts);cur.entries=cur.entries.slice(0,50);
    await stSet(key,cur,true);
  }catch(e){}
}
function hojeStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
async function copiarShare(){
  try{await navigator.clipboard.writeText(shareText());toast(t("t_copiado"))}
  catch(e){toast(t("t_nao_copiou"))}
}
/* ================= TELAS ================= */
const LINHAS={"4-3-3":[[8,9,10],[5,6,7],[1,2,3,4],[0]],"4-4-2":[[9,10],[5,6,7,8],[1,2,3,4],[0]],
"3-5-2":[[9,10],[4,5,6,7,8],[1,2,3],[0]],"5-3-2":[[9,10],[6,7,8],[1,2,3,4,5],[0]]};
function el(){return document.getElementById("app")}
const LOGO_MARK=`<svg class="mark" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 1L22 6.5V17.5L12 23L2 17.5V6.5L12 1Z" stroke="var(--ouro)" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M7 6.5H17L12 11.8L17 17.5H7L12 11.8L7 6.5Z" stroke="var(--gelo)" stroke-width="1.4" stroke-linejoin="round" fill="none"/>
  <line x1="4" y1="19.5" x2="20" y2="4.5" stroke="var(--ouro)" stroke-width="1.3"/>
</svg>`;
function header(extra){
  const nome=`<span class="wm">CHOQUE DE <b>ERAS</b></span>`;
  return `<div class="top"><div class="logo" onclick="irHome()">${LOGO_MARK}<div class="txt">${nome}<small>${t("tag")}</small></div></div><div class="row">${extra||""}<button class="pill" onclick="toggleLang()">🌎 ${S.lang==="pt"?"ES":"PT"}</button></div></div>`;
}
function fclass(f){return f>=85?"boa":f>=72?"media":"ruim"}
function irHome(){if(S.camp&&!S.camp.fim&&!confirm(t("confirm_ab")))return;S.camp=null;S.pend=null;S.screen="home";render()}
function render(){
  const scr=S.screen;
  if(scr==="home")return renderHome();
  if(scr==="setup")return renderSetup();
  if(scr==="duelo")return renderDuelo();
  if(scr==="janela")return renderJanela();
  if(scr==="jogo")return renderJogo();
  if(scr==="posjogo")return renderPosjogo();
  if(scr==="fim")return renderFim();
  if(scr==="rankdia")return renderRankDia();
  if(scr==="sala")return renderSala();
  if(scr==="perfil")return renderPerfil();
  if(scr==="ajuda")return renderAjuda();
}
/* ---------- HOME ---------- */
function renderHome(){
  const p=S.profile||{nick:""};
  const nickBox=p.nick?
    `<div class="spread" style="margin-bottom:10px"><span class="muted">${t("tec_label")} <b style="color:var(--ouro)">${esc(p.nick)}</b></span><button class="pill" onclick="go('perfil')">${t("card")}</button></div>`:
    `<div class="panel"><div class="eyebrow">${t("antes")}</div>
     <p class="muted" style="margin-bottom:8px">${t("comoChamar")}</p>
     <input type="text" id="nick" maxlength="16" placeholder="${t("nickPh")}">
     <button class="btn gold" onclick="salvarNick()">${t("assinar")}</button></div>`;
  const jaFez=p.dailyFeito===hojeStr();
  el().innerHTML=header()+nickBox+`
  <div class="panel hero">
    <div class="eyebrow">${t("hero_eb")}</div>
    <h1>${t("hero_h")}</h1>
    <p>${t("hero_p")}</p>
    <button class="btn gold" onclick="abrirSetup('livre')">${t("b_livre")}</button>
    <button class="btn green" ${p.nick?"":"disabled"} onclick="startDaily()">${t("b_dia")} ${jaFez?t("jaPontuado"):""}</button>
    <button class="btn green" ${p.nick?"":"disabled"} onclick="go('duelo')">${t("b_duelo")}</button>
    <div class="grid2">
      <button class="btn ghost" onclick="go('rankdia')">${t("b_rank")}</button>
      <button class="btn ghost" onclick="go('ajuda')">${t("b_ajuda")}</button>
    </div>
  </div>
  ${S.storageOk?"":`<div class="panel"><p class="muted">${t("sem_storage")}</p></div>`}
  <div class="footer">${t("footer")}</div>`;
}
function salvarNick(){const v=document.getElementById("nick").value.trim();if(!v){toast(t("toast_nick"));return}S.profile.nick=v;saveProfile();render()}
function go(s){S.screen=s;render();if(s==="rankdia")carregarRankDia()}
/* ---------- DUELO ---------- */
function renderDuelo(){
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="panel"><div class="eyebrow">${t("duelo_eb")}</div>
    <h2 style="margin-bottom:6px">${t("duelo_h")}</h2>
    <p class="muted">${t("duelo_p")}</p>
    <button class="btn gold" onclick="abrirSetup('duelo')">${t("b_criarsala")}</button>
    <div style="margin-top:14px"><input type="text" id="codigo" maxlength="5" placeholder="${t("cod_ph")}" style="text-transform:uppercase"></div>
    <div class="grid2">
      <button class="btn green" onclick="entrarSala(true)">${t("b_jogarsala")}</button>
      <button class="btn ghost" onclick="entrarSala(false)">${t("b_versala")}</button>
    </div>
  </div>`;
}
/* ---------- JANELA ---------- */
function hud(){
  const c=S.camp,r=ratingTime();
  return `<div class="hud">
    <div class="box"><small>${t("h_caixa")}</small><b class="gold">${fmtM(c.caixa)}</b></div>
    <div class="box"><small>${t("h_fase")}</small><b>${Math.min(7,c.rodada+1)}/7</b></div>
    <div class="box"><small>${t("h_atq")}</small><b>${Math.round(r.atk)}</b></div>
    <div class="box"><small>${t("h_def")}</small><b>${Math.round(r.def)}</b></div>
    <div class="box"><small>${t("h_moral")}</small><b>${c.moral>0?"+":""}${c.moral}</b></div>
  </div>`;
}
function slotHtml(i){
  const c=S.camp,s=c.slots[i],alvo=!!S.pend;
  const click=`onclick="selSlot(${i})"`;
  if(!s.p)return `<div class="slot vazio ${alvo?'alvo':''} ${S.sel===i?'sel':''}" ${click} role="button" tabindex="0"><div class="pos">${pl(s.role)}</div><div class="nome">${t("vaga")}</div><div class="forca ruim">${alvo?Math.max(45,S.pend.p.f+penalPos(S.pend.p.pos,s.role)):50}</div><div class="sub">${alvo?t("aqui"):t("buraco")}</div></div>`;
  const fe=Math.round(forcaEfetiva(s,c.moral));
  const fora=s.p.fora>0, pen=penalPos(s.p.pos,s.role);
  const subtxt=alvo?("→ "+Math.max(45,S.pend.p.f+penalPos(S.pend.p.pos,s.role))):
    fora?t("fora_nj",{n:s.p.fora}):esc((s.p.clube?flagClube(s.p.clube)+" ":"")+(s.p.ano||t("base_tag")));
  return `<div class="slot ${alvo?'alvo':''} ${S.sel===i?'sel':''}" ${click} role="button" tabindex="0">
    ${s.p.lenda?'<span class="lenda">⭐</span>':''}
    ${fora?'<span class="tag">🩹</span>':s.p.amar===1?'<span class="tag">🟨</span>':''}
    <div class="pos">${pl(s.role)}${pen<0?" ⚠"+pen:""}</div>
    <div class="nome">${esc(s.p.n)}</div>
    <div class="forca ${fclass(fe)}">${fe}</div>
    <div class="sub">${subtxt}</div>
    ${s.p.base?'<span class="tagb">'+t("base_tag").toUpperCase()+'</span>':''}
  </div>`;
}
function figJog(p,botoes){
  return `<div class="fig ${p.lenda?'lend':''}">${p.lenda?'<span class="star">⭐</span>':''}
    <div class="p">${pl(p.pos)}${p.fora>0?" 🩹":""}</div><div class="n">${esc(p.n)}</div><div class="f">${p.f}</div>
    <div class="pr">${p.preco?fmtM(p.preco):t("cria")}</div>${botoes}</div>`;
}
function renderJanela(){
  const c=S.camp,opp=c.opps[c.rodada];
  const pendBar=S.pend?`<div class="evento"><h3>${S.pend.tipo==="mover"?t("pend_mover",{n:esc(S.pend.p.n)}):t("pend_escalar",{n:esc(S.pend.p.n),pos:pl(S.pend.p.pos),f:S.pend.p.f})}</h3>
    <p>${t("pend_p")}</p>
    <button class="btn ghost" style="margin-top:8px" onclick="cancelarPend()">${t("b_cancelar")}</button></div>`:"";
  const selBar=(!S.pend&&S.sel!=null&&c.slots[S.sel].p)?(()=>{const p=c.slots[S.sel].p;
    return `<div class="pane"><div class="spread"><div><b>${esc(p.n)}</b> · ${pl(p.pos)} ${p.f} <span class="muted">${esc(p.clube||"")} ${p.ano||""}</span>${penalPos(p.pos,c.slots[S.sel].role)<0?'<div class="muted">'+t("improv_nota",{p:penalPos(p.pos,c.slots[S.sel].role)})+'</div>':''}</div>
    <div class="row wrap" style="justify-content:flex-end"><button class="mini dark" onclick="iniciarMover(${S.sel})">${t("b_mover")}</button>${p.base?"":`<button class="mini dark" onclick="mandarBanco(${S.sel})">${t("b_banco")}</button><button class="mini red" onclick="venderSlot(${S.sel})">${t("b_vender",{v:fmtM(Math.round(p.preco*.7))})}</button>`}<button class="mini dark" onclick="selSlot(${S.sel})">${t("fechar")}</button></div></div></div>`})():"";
  const mm=c.mercado,mClube=mm.clube||mm.key.slice(0,mm.key.lastIndexOf(" ")),mAno=mm.ano||mm.key.slice(mm.key.lastIndexOf(" ")+1);
  const mercadoHtml=`<div class="sqhead"><span style="font-size:1.2rem">${flagClube(mClube)}</span><span class="band">${esc(mClube)}</span><span class="yr">${mAno}</span>${mm.tier?`<span class="badgeTier ${mm.tier}">${t("tier_"+mm.tier)}</span>`:""}</div>${mm.eraNome?`<p class="muted" style="margin:2px 0 2px">${esc(mm.eraNome)}</p>`:""}
    <div class="figs">${c.mercado.jog.map((p,pi)=>{
      const meu=noElenco(p.id);
      const btn=`<button class="mini ${meu?'dark':'gold'}" ${meu||p.preco>c.caixa?"disabled":""} onclick="iniciarContratacao(${pi})">${meu?t("no_elenco"):t("b_contratar")}</button>`;
      return figJog(p,btn)}).join("")}</div>`;
  const escalados=escaladosSet();
  const baseHtml=`<div class="sqhead"><span style="font-size:1.2rem">🧒</span><span class="band">${t("base_h")}</span><span class="yr" style="background:#5B8DB8;color:#fff">${t("base_badge")}</span></div>
    <div class="figs">${c.base.map(b=>{
      const emCampo=escalados.has(b.id);
      const btn=emCampo?`<span class="badge verde">${t("em_campo")}</span>`:
        b.fora>0?`<span class="badge verm">${t("dm",{n:b.fora})}</span>`:
        `<button class="mini gold" onclick="iniciarEscalarBase('${b.id}')">${t("b_escalar")}</button>`;
      return figJog(b,btn)}).join("")}</div>`;
  const bancoHtml=c.banco.length?`<div class="sqhead"><span style="font-size:1.2rem">🪑</span><span class="band">${t("banco_h")}</span></div>
    <div class="figs">${c.banco.map((p,i)=>figJog(p,`<div class="row" style="justify-content:center;gap:4px"><button class="mini gold" ${p.fora>0?"disabled":""} onclick="iniciarEscalarBanco(${i})">${t("b_escalar")}</button><button class="mini red" onclick="venderBanco(${i})">${fmtM(Math.round(p.preco*.7))}</button></div>`)).join("")}</div>`:"";
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("abandonar")}</button>`)+hud()+pendBar+`
  <div class="panel">
    <div class="eyebrow">${t("fase_"+c.rodada)}</div>
    <div class="spread"><h2 style="font-size:1.05rem">${esc(c.clube)}</h2><span class="badge verm">vs ${esc(opp.n)} · ${opp.f}</span></div>
    <p class="muted" style="margin-top:4px">${c.rodada<3?t("grupo_regra"):t("mata_regra")} ${t("media_xi")}: <b>${Math.round(mediaXI())}</b></p>
    <div class="campo">${LINHAS[c.formacao].map(l=>`<div class="linha-t">${l.map(slotHtml).join("")}</div>`).join("")}</div>
    ${selBar}
    <div class="eyebrow">${t("form_lbl")}</div>
    <div class="chips">${Object.keys(FORMACOES).map(f=>`<button class="chip ${c.formacao===f?'on':''}" onclick="setFormacao('${f}')">${f}</button>`).join("")}</div>
    <div class="eyebrow" style="margin-top:10px">${t("estilo_lbl")}</div>
    <div class="chips">${Object.keys(ESTILOS).map(e=>`<button class="chip ${c.estilo===e?'on':''}" onclick="setEstilo('${e}')">${t("st_"+e)}</button>`).join("")}</div>
    <button class="btn gold" onclick="startMatch()">${t("b_bola")}</button>
  </div>
  <div class="panel ${c.mercado.tier?("tier"+c.mercado.tier):""}">
    <div class="spread"><div class="eyebrow" style="margin:0">${t("mercado_eb",{n:Math.min(7,c.rodada+1)})}</div>
    <button class="mini gold" onclick="rolarMercado()">${t("b_rolar")} ${c.rollGratis?t("gratis"):t("pago")}</button></div>
    <p class="muted" style="margin:4px 0 2px">${t("mercado_note")}</p>
    ${mercadoHtml}
  </div>
  <div class="panel">${bancoHtml}${baseHtml}</div>`;
  if(!S.pend)window.scrollTo(0,0);
}
/* ---------- JOGO ---------- */
function renderJogo(){
  const sim=S.sim,c=S.camp;
  el().innerHTML=header()+`
  <div class="panel">
    <div class="eyebrow">${t("fase_"+c.rodada)} ${sim.prorroga?t("prorroga"):""}</div>
    <div class="placar">
      <div class="times"><span>${esc(c.clube).toUpperCase()}</span><span>${esc(sim.opp.n).toUpperCase()}</span></div>
      <div class="gols" id="pgols">${sim.gf} × ${sim.gs}</div>
      <div class="min" id="pmin">${sim.fim?t("fim_lbl"):sim.min+"'"}${sim.penaltis?" · "+t("pen_lbl")+" "+sim.penaltis.pf+"×"+sim.penaltis.pc:""}</div>
      <div class="barra"><i id="pbar" style="width:${Math.min(100,sim.min/(sim.prorroga?120:90)*100)}%"></i></div>
    </div>
    <div class="feed" id="pfeed">${feedHtml()}</div>
    ${sim.fim?`<button class="btn gold" onclick="encerrarPartida()">${t("b_continuar")}</button>`:
    `<div class="speed">
      <button class="mini dark ${sim.speed===1?'on':''}" onclick="setSpeed(1)">${t("v_radio")}</button>
      <button class="mini dark ${sim.speed===3?'on':''}" onclick="setSpeed(3)">${t("v_rapido")}</button>
      <button class="mini dark" onclick="setSpeed(99)">${t("v_direto")}</button>
    </div>`}
  </div>`;
}
function feedHtml(){
  const eventos=S.sim.eventos.map(narrarEvento).reverse();
  const msgs=(S.sim.escalacaoMsgs||[]).slice().reverse();
  const html=eventos.map(f=>`<p class="${f.c}">${f.t}</p>`).concat(msgs.map(m=>`<p class="">${m}</p>`)).slice(0,40).join("");
  return html||`<p class="muted pulse">${t("aguarda")}</p>`;
}
function renderPlacarVivo(){
  const sim=S.sim;
  const g=document.getElementById("pgols"),m=document.getElementById("pmin"),b=document.getElementById("pbar"),f=document.getElementById("pfeed");
  if(!g)return;
  g.textContent=sim.gf+" × "+sim.gs;
  m.textContent=(sim.fim?t("fim_lbl"):sim.min+"'")+(sim.penaltis?" · "+t("pen_lbl")+" "+sim.penaltis.pf+"×"+sim.penaltis.pc:"");
  b.style.width=Math.min(100,sim.min/(sim.prorroga?120:90)*100)+"%";
  f.innerHTML=feedHtml();
}
/* ---------- PÓS-JOGO ---------- */
/* evento cru do motor -> vars localizados para o template */
function eventoVars(ev){
  switch(ev.k){
    case"pat":return{c:ev.clube,v:fmtM(ev.valor)};
    case"ass":return{v:fmtM(ev.oferta),n:ev.nome,f:ev.forca};
    case"emp":return{n:ev.nome,pos:pl(ev.pos),f:ev.forca,cl:ev.clube,ano:ev.ano,v:fmtM(ev.valor)};
    case"les":return{n:ev.nome};
    case"rifa":return{v:fmtM(ev.valor)};
    default:return{};
  }
}
function renderPosjogo(){
  const c=S.camp,ult=c.resultados[c.resultados.length-1];
  const gols=S.sim.gols.filter(g=>g.nosso).map(g=>esc(g.p)+" "+g.m+"'").join(", ");
  const ev=c.evento;
  const evHtml=ev?`<div class="evento"><h3>${t("ev_"+ev.k+"_t")}</h3><p>${esc(t("ev_"+ev.k+"_d",eventoVars(ev)))}</p>
    ${ev.escolha?`<div class="grid2" style="margin-top:10px"><button class="btn gold" style="margin:0" onclick="eventoEscolha(true)">${t("b_aceitar")}</button><button class="btn ghost" style="margin:0" onclick="eventoEscolha(false)">${t("b_recusar")}</button></div>`:
    `<button class="btn ghost" onclick="eventoEscolha(false)" style="margin-top:10px">${t("b_seguir")}</button>`}</div>`:"";
  el().innerHTML=header()+hud()+`
  <div class="pane center">
    <div class="eyebrow">${t("fase_"+ult.fase)}</div>
    <h3 style="font-size:1.4rem">${ult.res[0]==="V"?t("res_v"):ult.res==="E"?t("res_e"):t("res_d")} ${ult.gf}×${ult.gs}${ult.pen?" ("+t("pen_lbl").toLowerCase()+" "+ult.pen.pf+"×"+ult.pen.pc+")":""}</h3>
    <p class="muted">vs ${esc(ult.opp)}</p>${gols?`<p class="muted">${t("gols_lbl")}: ${gols}</p>`:""}
    <div class="split"><b style="color:#1c6b38">${t("premio_lbl",{v:fmtM(ult.premio)})}</b>${ult.gs===0?' <span class="badge verde">'+t("cs_badge")+'</span>':""}</div>
  </div>
  ${evHtml}
  <button class="btn gold" onclick="go('janela')">${t("b_janela")}</button>`;
  window.scrollTo(0,0);
}
/* ---------- FIM ---------- */
function renderFim(){
  const c=S.camp,sc=c.score;
  const emojis=c.resultados.map(r=>r.res==="V0"?"🟩":r.res==="V"?"🟨":r.res==="E"?"⬜":"🟥").join(" ");
  const titulo=sc.perfeito?{e:"👑",t:t("perf_t"),s:t("perf_s")}:
    c.campeao?{e:"🏆",t:t("camp_t"),s:t("camp_s")}:
    {e:"📉",t:t("elim_t"),s:c.notaGrupo!=null?t("elim_grupo",{p:c.notaGrupo}):t("elim_s")};
  const linhas=c.resultados.map(r=>`<tr><td>${t("fase_"+r.fase)}</td><td>${esc(r.opp)}</td><td><b>${r.gf}×${r.gs}</b>${r.pen?" <span class='muted'>p"+r.pen.pf+"-"+r.pen.pc+"</span>":""}</td></tr>`).join("");
  const nc=c.novasConq||[];
  const conq=nc.length?`<div class="evento"><h3>${t("cq_novas",{s:nc.length>1?"s":""})}</h3><p>${nc.map(id=>t("cq_"+id)).join(" · ")}</p></div>`:"";
  const rk=c.mode==="diario"?`<button class="btn green" onclick="go('rankdia')">${t("b_rankdia2")}</button>`:
    c.mode==="duelo"?`<button class="btn green" onclick="verSalaAtual()">${t("b_sala2",{c:c.roomCode})}</button>`:"";
  el().innerHTML=header()+`
  <div class="pane center">
    <div class="tro">${titulo.e}</div>
    <h2>${titulo.t}</h2>
    <p class="muted" style="margin:4px 0 8px">${titulo.s}</p>
    <div class="resline" style="justify-content:center">${emojis}</div>
    <div class="score-big">${sc.total} pts</div>
    <p class="muted">${t("pts_base",{b:sc.base,z:sc.zebra})}${sc.perfeito?t("mult_imortal"):c.campeao?t("mult_camp"):""}</p>
    <div class="split" style="text-align:left">
      <table><tr><th>${t("tb_fase")}</th><th>${t("tb_adv")}</th><th>${t("tb_placar")}</th></tr>${linhas}</table>
      <p class="muted" style="margin-top:8px">${t("resumo",{gf:c.gf,gs:c.gs,cs:c.cs,g:fmtM(c.gasto),m:sc.media})}</p>
    </div>
  </div>
  ${conq}
  <button class="btn gold" onclick="copiarShare()">${t("b_copiar")}</button>
  ${rk}
  <div class="grid2">
    <button class="btn ghost" onclick="jogarDeNovo()">${t("b_denovo")}</button>
    <button class="btn ghost" onclick="S.camp=null;go('home')">${t("b_inicio")}</button>
  </div>`;
  window.scrollTo(0,0);
}
function verSalaAtual(){S.salaCode=S.camp.roomCode;S.screen="sala";render();carregarSala(S.salaCode)}
/* ---------- RANKINGS ---------- */
function rankTable(entries){
  if(!entries||!entries.length)return `<p class="muted">${t("rank_vazio")}</p>`;
  return `<table><tr><th>#</th><th>${t("tb_tec")}</th><th>Pts</th><th></th></tr>${entries.map((e,i)=>
    `<tr class="${e.nick===S.profile.nick?'eu':''}"><td>${i+1}</td><td>${esc(e.nick)}</td><td><b>${e.pts}</b></td><td>${e.perf?"👑":e.campeao?"🏆":""}</td></tr>`).join("")}</table>`;
}
function renderRankDia(){
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="panel"><div class="eyebrow">${t("rank_eb",{d:hojeStr()})}</div>
  <p class="muted" style="margin-bottom:10px">${t("rank_p")}</p>
  <div id="rk"><p class="muted pulse">${t("carregando")}</p></div>
  <button class="btn gold" onclick="startDaily()">${t("b_jogar_hoje")}</button></div>`;
}
async function carregarRankDia(){
  const d=await stGet("choque:dia:"+hojeStr(),true);
  const box=document.getElementById("rk");if(box)box.innerHTML=rankTable(d?d.entries:null);
}
function renderSala(){
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="panel"><div class="eyebrow">${t("sala_eb")} <span style="color:var(--ouro)">${esc(S.salaCode||"")}</span></div>
  <p class="muted" style="margin-bottom:10px">${t("sala_p",{c:esc(S.salaCode||"")})}</p>
  <div id="rk"><p class="muted pulse">${t("buscando")}</p></div>
  <button class="btn gold" onclick="startCampaign('duelo','sala-${esc(S.salaCode||"")}','${esc(S.salaCode||"")}')">${t("b_jogar_sala")}</button></div>`;
}
async function carregarSala(code){
  const d=await stGet("choque:sala:"+code,true);
  const box=document.getElementById("rk");
  if(box)box.innerHTML=d?rankTable(d.entries):`<p class="muted">${t("sala_nao")}</p>`;
}
/* ---------- PERFIL ---------- */
function renderPerfil(){
  const p=S.profile;
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="pane">
    <div class="eyebrow">${t("perfil_eb")}</div>
    <h2 style="font-size:1.5rem">${esc(p.nick||t("sem_nome"))}</h2>
    <div class="split"></div>
    <table>
      <tr><td>${t("p_camp")}</td><td><b>${p.jogos}</b></td></tr>
      <tr><td>${t("p_tit")}</td><td><b>${p.titulos} 🏆</b></td></tr>
      <tr><td>${t("p_imort")}</td><td><b>${p.perfeitos} 👑</b></td></tr>
      <tr><td>${t("p_rec")}</td><td><b>${p.recorde}</b></td></tr>
      <tr><td>${t("p_leg")}</td><td><b style="color:var(--ouro2)">${p.legado}</b></td></tr>
    </table>
  </div>
  <div class="panel"><div class="eyebrow">${t("trofeus")}</div>
    ${CONQ_IDS.map(id=>`<div class="spread" style="padding:8px 0;border-bottom:1px dashed rgba(237,245,238,.09)">
      <div><b style="${p.conq.includes(id)?'color:var(--ouro)':'color:var(--gelo2)'}">${p.conq.includes(id)?"🎖️":"🔒"} ${t("cq_"+id)}</b><div class="muted">${t("cqd_"+id)}</div></div></div>`).join("")}
  </div>`;
}
/* ---------- AJUDA ---------- */
function renderAjuda(){
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="pane">
    <h3>${t("aj_t")}</h3>
    <p style="margin:8px 0;line-height:1.55">${t("aj_1")}</p>
    <p style="margin:8px 0;line-height:1.55">${t("aj_2")}</p>
    <p style="margin:8px 0;line-height:1.55">${t("aj_3")}</p>
    <p style="margin:8px 0;line-height:1.55">${t("aj_4")}</p>
    <p style="margin:8px 0;line-height:1.55">${t("aj_5")}</p>
  </div>`;
}

/* ================= IDOLATRIA · MODO MEU CLUBE ================= */
Object.assign(I18N.pt,{
 tag:"ESCALE SEUS DEUSES",footer:"IDOLATRIA · protótipo",
 hero_eb:"7 jogos · eras douradas e sofrência",
 hero_h:'Convoque seus deuses.<br>Carregue sua cruz.<br><span style="color:var(--ouro)">IDOLATRIA.</span>',
 hero_p:"Escolha o clube da sua vida e o dado sorteia <b>eras inteiras</b> da história dele — das douradas que você decora escalação até a sofrência que você quer esquecer. Monte o time eterno com o SEU nome, enfrente os gigantes da América e persiga a <b>Campanha Imortal</b>: 7 vitórias, nenhum gol sofrido. Ou jogue no modo Continental, com lendas de todo o continente.",
 setup_eb:"Nova campanha",setup_modo:"Escolha seu caminho",
 modo_cont:"🌎 Continental",modo_cont_d:"lendas de toda a América no dado",
 modo_cora:"Meu Clube",modo_cora_d:"só as eras do time da sua vida",
 setup_nome:"Nome do seu time",setup_nome_ph:"deixe vazio para sortear um",
 b_comecar:"🎺 Começar campanha",escolha_clube:"Escolha um clube",
 tier_D:"ERA DOURADA",tier_S:"ERA SÓLIDA",tier_R:"SOFRÊNCIA",
 cq_redencao:"Redenção",cqd_redencao:"Seja campeão com gol de um jogador vindo da Sofrência",
 aj_2:"<b>🎰 Mercado:</b> no modo Meu Clube, o dado sorteia uma ERA do seu clube — ✨ douradas na maioria das vezes, ⚡ sólidas com frequência e, de vez em quando, a 🌧️ Sofrência (às vezes com uma joia escondida). Cada contratação embaralha a era. No Continental, sorteia esquadrões históricos de toda a América. Rolar na mão: 1x grátis por janela, depois $8M. Venda por 70%."
});
Object.assign(I18N.es,{
 tag:"PONÉ A TUS DIOSES EN CANCHA",footer:"IDOLATRÍA · prototipo",
 hero_eb:"7 partidos · eras doradas y años de mufa",
 hero_h:'Convocá a tus dioses.<br>Cargá tu cruz.<br><span style="color:var(--ouro)">IDOLATRÍA.</span>',
 hero_p:"Elegí el club de tu vida y el dado sortea <b>eras enteras</b> de su historia — de las doradas que sabés de memoria hasta la mufa que querés olvidar. Armá el equipo eterno con TU nombre, enfrentá a los gigantes de América y perseguí la <b>Campaña Inmortal</b>: 7 victorias, ningún gol en contra. O jugá el modo Continental, con leyendas de todo el continente.",
 setup_eb:"Nueva campaña",setup_modo:"Elegí tu camino",
 modo_cont:"🌎 Continental",modo_cont_d:"leyendas de toda América en el dado",
 modo_cora:"Mi Club",modo_cora_d:"solo las eras del club de tu vida",
 setup_nome:"Nombre de tu equipo",setup_nome_ph:"vacío = sorteamos uno",
 b_comecar:"🎺 Arrancar campaña",escolha_clube:"Elegí un club",
 tier_D:"ERA DORADA",tier_S:"ERA SÓLIDA",tier_R:"AÑOS DE MUFA",
 cq_redencao:"Redención",cqd_redencao:"Salí campeón con gol de un jugador de los Años de Mufa",
 aj_2:"<b>🎰 Mercado:</b> en Mi Club, el dado sortea una ERA de tu club — ✨ doradas casi siempre, ⚡ sólidas seguido y, cada tanto, los 🌧️ Años de Mufa (a veces con una joya escondida). Cada fichaje baraja la era. En Continental, sortea escuadrones históricos de toda América. Tirar a mano: 1x gratis por ventana, después $8M. Vendé al 70%."
});
/* ---- eras curadas: 5 clubes, 3 tiers ---- */
/* @DATA: CORA_CLUBES injetado no build */
/* @DATA: ERAS injetado no build */
const TIER_PESOS=[["D",.55],["S",.35],["R",.10]];
/* ---- setup: modo, clube do coração e nome do time ---- */
function abrirSetup(ctx){S.setupCtx=ctx;
  S.setupSel=S.setupSel||{modo:S.profile.timeCoracao?"cora":"cont",cora:S.profile.timeCoracao||null};
  S.screen="setup";render()}
function setSetupModo(m,cora){S.setupSel.modo=m;if(m==="cora")S.setupSel.cora=cora;render()}
function renderSetup(){
  const sel=S.setupSel;
  el().innerHTML=header(`<button class="pill" onclick="irHome()">${t("voltar")}</button>`)+`
  <div class="panel"><div class="eyebrow">${t("setup_eb")} · ${S.setupCtx==="duelo"?t("duelo_eb"):t("modo_livre")}</div>
    <h2 style="margin:2px 0 10px">${t("setup_modo")}</h2>
    <button class="clubchip ${sel.modo==="cont"?"on":""}" onclick="setSetupModo('cont')"><span class="cor" style="background:linear-gradient(180deg,var(--ouro),#7a5c15)"></span><span>${t("modo_cont")}<small>${t("modo_cont_d")}</small></span></button>
    <div class="eyebrow" style="margin-top:14px">❤️ ${t("modo_cora")} — ${t("escolha_clube")}</div>
    ${CORA_CLUBES.map(([c,cor])=>`<button class="clubchip ${sel.modo==="cora"&&sel.cora===c?"on":""}" onclick="setSetupModo('cora','${c}')"><span class="cor" style="background:${cor}"></span><span>${flagClube(c)} ${c}<small>${t("modo_cora_d")}</small></span></button>`).join("")}
    <div class="eyebrow" style="margin-top:16px">${t("setup_nome")}</div>
    <input type="text" id="nomeTime" maxlength="26" placeholder="${t("setup_nome_ph")}" value="${esc(S.profile.clubeNome||"")}">
    <button class="btn gold" onclick="confirmarSetup()">${S.setupCtx==="duelo"?t("b_criarsala"):t("b_comecar")}</button>
  </div>`;
}
function confirmarSetup(){
  const sel=S.setupSel;
  const nome=(document.getElementById("nomeTime").value||"").trim();
  S.profile.clubeNome=nome;if(sel.modo==="cora")S.profile.timeCoracao=sel.cora;saveProfile();
  const opts={modo:sel.modo,cora:sel.modo==="cora"?sel.cora:null,nome};
  if(S.setupCtx==="duelo")criarSala(opts);
  else startCampaign("livre",null,null,opts);
}
/* ---- núcleo redefinido: modo coração ---- */
function startCampaign(mode,seedStr,roomCode,opts){
  opts=opts||{modo:"cont",nome:S.profile&&S.profile.clubeNome||""};
  const seed=seedStr||geraSeed();
  S.camp=Engine.criarCampanha(mode,seed,roomCode,opts,dadosAtuais());
  S.screen="janela";S.sel=null;S.pend=null;render();
}
/* diário é sempre Continental (seed justa pra todo mundo); nome do time é o seu */
function startDaily(){
  if(S.profile.dailyFeito===hojeStr()&&!confirm(t("daily_replay")))return;
  startCampaign("diario","dia-"+hojeStr(),null,{modo:"cont",nome:S.profile.clubeNome||""});
}
function criarSala(opts){
  const abc="ABCDEFGHJKMNPQRSTUVWXYZ";let code="";for(let i=0;i<5;i++)code+=abc[Math.floor(MR()*abc.length)];
  stSet("choque:sala:"+code,{criador:S.profile.nick,ts:Date.now(),entries:[],modo:opts&&opts.modo||"cont",cora:opts&&opts.cora||null},true);
  toast(t("toast_sala",{c:code}));
  startCampaign("duelo","sala-"+code,code,opts);
}
/* quem entra numa sala herda o modo e o clube dela */
async function entrarSala(jogar){
  const code=(document.getElementById("codigo").value||"").trim().toUpperCase();
  if(code.length!==5){toast(t("toast_cod5"));return}
  if(jogar){
    const rec=await stGet("choque:sala:"+code,true);
    const opts=rec?{modo:rec.modo||"cont",cora:rec.cora||null,nome:S.profile.clubeNome||""}:{modo:"cont",nome:S.profile.clubeNome||""};
    startCampaign("duelo","sala-"+code,code,opts);
  }else{S.salaCode=code;S.screen="sala";render();carregarSala(code)}
}
function jogarDeNovo(){const c=S.camp,opts={modo:c.modo,cora:c.cora,nome:c.clube};
  if(c.mode==="duelo"&&c.roomCode)startCampaign("duelo","sala-"+c.roomCode,c.roomCode,opts);
  else if(c.mode==="diario")startDaily();
  else startCampaign("livre",null,null,opts);}
function shareText(){
  const c=S.camp,sc=c.score;
  const em=c.resultados.map(r=>r.res==="V0"?"🟩":r.res==="V"?"🟨":r.res==="E"?"⬜":"🟥").join("");
  const st=sc.perfeito?t("sh_perf"):c.campeao?t("sh_camp"):c.eliminado?t("sh_elim",{f:t("fase_"+c.resultados[c.resultados.length-1].fase)}):"";
  let modo=c.mode==="diario"?t("modo_dia",{d:hojeStr()}):c.mode==="duelo"?t("modo_duelo",{c:c.roomCode}):t("modo_livre");
  if(c.modo==="cora")modo=t("modo_cora")+" "+c.cora+" · "+modo;
  const nome="CHOQUE DE ERAS";
  return nome+" ⚽ "+modo+"\n"+t("share",{modo:"",clube:c.clube,st,em,pts:sc.total,m:sc.media,z:sc.zebra}).split("\n").slice(1).join("\n");
}

Object.assign(I18N.pt,{tag:"QUEM ESCALA A HISTÓRIA, ALCANÇA A GLÓRIA.",footer:"CHOQUE DE ERAS · protótipo",
 hero_eb:"seu clube · todas as eras · 7 jogos",
 hero_h:'Rasgue as páginas do tempo.<br><span style="color:var(--ouro)">Escreva sua dinastia.</span>',
 hero_p:"Já imaginou o craque de 98 cruzando a bola pro artilheiro de 2012? Escolha o clube da sua vida, deixe o dado sortear eras inteiras da história dele — mais de 20 por clube — e monte o esquadrão imbatível através das décadas. Gerencie legados, administre o ego das lendas e persiga a <b>Campanha Imortal</b> contra os gigantes da América: 7 vitórias, nenhum gol sofrido.",
 loading:["Calculando o impacto tático de gerações…","Reunindo os deuses do gramado…","Ajustando o relógio para a era dourada…","Convocando lendas de todas as décadas…","Preparando a prancheta…"]});
Object.assign(I18N.es,{tag:"QUIEN ALINEA LA HISTORIA, ALCANZA LA GLORIA.",footer:"CHOQUE DE ERAS · prototipo",
 hero_eb:"tu club · todas las eras · 7 partidos",
 hero_h:'Rasgá las páginas del tiempo.<br><span style="color:var(--ouro)">Escribí tu dinastía.</span>',
 hero_p:"¿Te imaginás al crack del 98 tirando el centro para el goleador de 2012? Elegí el club de tu vida, dejá que el dado sortee eras enteras de su historia — más de 20 por club — y armá el equipo imbatible a través de las décadas. Gestioná legados, administrá el ego de las leyendas y perseguí la <b>Campaña Inmortal</b> contra los gigantes de América: 7 victorias, ningún gol en contra.",
 loading:["Calculando el impacto táctico de generaciones…","Reuniendo a los dioses de la cancha…","Ajustando el reloj a la era dorada…","Convocando leyendas de todas las décadas…","Preparando la pizarra…"]});
/* ---------- TELA DE CARREGAMENTO ---------- */
function renderLoading(){
  const frases=I18N[S.lang].loading;
  const frase=frases[Math.floor(Math.random()*frases.length)];
  el().innerHTML=`<div class="loadscreen">${LOGO_MARK}<div class="loadwm">CHOQUE DE <b>ERAS</b></div>
    <div class="loadtag">${t("tag")}</div><div class="loadbar"><i></i></div><div class="loadfrase">${esc(frase)}</div></div>`;
}
/* ---------- INIT ---------- */
(async function init(){
  renderLoading();
  const t0=Date.now();
  await loadProfile();
  const rest=900-(Date.now()-t0);
  if(rest>0)await new Promise(r=>setTimeout(r,rest));
  render();
})();
