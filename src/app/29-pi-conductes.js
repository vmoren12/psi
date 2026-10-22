/* ---------- Banc de frases per a la conducta observable (pas 6) ----------
   La casella «Conducta observable» d'un objectiu és la part que costa més
   d'escriure de tot el pla: ha de dir què farà l'alumne/a de manera que es
   pugui veure i comptar. Aquesta finestra hi ofereix dues entrades:

   · Per àmbits — frases curtes, ja redactades en la forma que demana la
     frase de l'objectiu («serà capaç de …»), agrupades per àmbit de
     l'educació bàsica i, dins de cada àmbit, per subàmbit. El personal i
     social és el més extens perquè és on més costa trobar la paraula justa:
     autonomia, atenció, organització, regulació emocional, conducta,
     relacions, comunicació, autodeterminació, flexibilitat, vida diària i
     assistència. Un selector deixa veure només un àmbit; si l'objectiu és de
     l'àmbit personal i social, la finestra s'hi obre directament.

   · Des del currículum — el mateix currículum del pas 5, matèria per matèria,
     amb les competències específiques i els criteris d'avaluació. S'hi pot
     entrar encara que al pas 5 no s'hagi triat res; el que sí que s'hi hagi
     triat surt destacat, perquè és el referent natural de l'objectiu.

   En tots dos casos el text no s'insereix i prou: la casella de dalt de la
   finestra el deixa adaptar abans de tancar-la, que és el que sol caldre amb
   un criteri del decret, escrit per al grup i no per a un alumne/a concret. */

/* Frases d'ús freqüent, en infinitiu, per encaixar rere «serà capaç de».
   No és una llista tancada: la casella continua essent de text lliure. */
const CONDUCTES_SUGG = [
  {a:"Personal i social", g:"Autonomia i hàbits de treball", items:[
    "planificar la tasca abans de començar-la i dir en quin ordre la farà",
    "començar la tasca de manera autònoma en els primers cinc minuts de la sessió",
    "treballar de manera autònoma durant el temps acordat sense requerir la intervenció del docent",
    "fer servir el llistat de passos per completar una tasca sense ajuda de l'adult",
    "acabar la tasca començada dins del temps previst",
    "revisar la feina amb la pauta de revisió abans de lliurar-la",
    "corregir els errors assenyalats abans de passar a la tasca següent",
    "consultar els recursos de l'aula (murals, glossari, exemples resolts) abans de demanar ajuda",
    "demanar ajuda amb la fórmula acordada quan es queda encallat",
    "reconèixer quan no ha entès una consigna i dir-ho",
    "lliurar les tasques i els deures en la data acordada",
    "valorar la pròpia feina amb la rúbrica i justificar la valoració",
    "fixar-se una fita setmanal i dir al final de la setmana si l'ha assolida",
    "explicar amb una frase què ha après al final de la sessió"]},
  {a:"Personal i social", g:"Atenció i funcions executives", items:[
    "mantenir l'atenció en la tasca durant el temps acordat",
    "tornar a la tasca després d'una distracció amb el senyal acordat",
    "seguir una instrucció de diversos passos amb el suport visual",
    "llegir l'enunciat sencer abans de començar a respondre",
    "dividir una tasca llarga en parts i marcar-les a mesura que les acaba",
    "fer servir el temporitzador per gestionar el temps de cada part de la tasca",
    "fer la pausa activa pactada i reprendre la feina després",
    "esperar a tenir tota la informació abans de respondre o actuar",
    "passar d'una activitat a la següent quan se li indica",
    "recordar i aplicar les rutines de l'aula sense recordatori de l'adult"]},
  {a:"Personal i social", g:"Organització, agenda i materials", items:[
    "portar l'agenda al dia amb les tasques i les dates de lliurament",
    "anotar a l'agenda els exàmens i els lliuraments el mateix dia que s'anuncien",
    "consultar l'agenda o l'horari visual per anticipar què toca",
    "portar a classe el material necessari per a cada matèria",
    "preparar el material de la sessió següent abans de sortir de l'aula",
    "mantenir la taula de treball endreçada amb només el material de la tasca",
    "organitzar els fulls i els apunts a la carpeta o la llibreta de cada matèria",
    "fer servir un calendari per repartir l'estudi abans d'una prova",
    "revisar la motxilla amb la llista de comprovació abans de marxar a casa"]},
  {a:"Personal i social", g:"Regulació emocional", items:[
    "anomenar l'emoció que sent abans d'actuar",
    "identificar al termòmetre emocional el seu nivell d'activació",
    "fer servir una estratègia de calma acordada quan nota que es desborda",
    "demanar una pausa amb el senyal acordat abans que la situació s'agreugi",
    "sortir a l'espai acordat i tornar a l'aula dins del temps pactat",
    "tolerar l'error sense abandonar la tasca",
    "acceptar perdre en un joc sense conductes disruptives",
    "expressar el desacord amb un to i unes paraules adequats",
    "reconèixer, després d'un conflicte, què ha passat i què podria fer diferent",
    "fer servir una estratègia d'afrontament davant d'una prova o d'una exposició oral",
    "registrar al full de seguiment com li ha anat la sessió"]},
  {a:"Personal i social", g:"Conducta i convivència a l'aula", items:[
    "esperar el torn de paraula i intervenir quan se li dona",
    "romandre al seu lloc durant les explicacions",
    "entrar a l'aula i començar l'activitat seguint la rutina d'inici",
    "complir les normes acordades de l'aula al llarg de la sessió",
    "acceptar una correcció sense interrompre l'activitat",
    "acceptar els límits i les conseqüències acordades sense enfrontament",
    "reduir les interrupcions de la sessió fins al nombre acordat",
    "fer servir un vocabulari respectuós amb els companys i amb els adults",
    "respectar el material propi, el dels companys i el de l'aula",
    "fer els desplaçaments entre espais (pati, aula, gimnàs) seguint les normes",
    "complir el contracte conductual pactat i revisar-lo amb el tutor/a"]},
  {a:"Personal i social", g:"Relació amb els iguals i treball en equip", items:[
    "assumir el rol assignat dins del grup i fer-ne la part",
    "exposar la seva idea al grup i escoltar la dels altres",
    "acceptar les idees dels companys encara que no coincideixin amb les seves",
    "aportar una proposta al treball cooperatiu i argumentar-la",
    "participar en una activitat de grup sense sortir-ne",
    "compartir el material i esperar el torn en les activitats de grup",
    "demanar ajuda a un company/a abans de demanar-la al docent",
    "oferir ajuda a un company/a quan la necessita",
    "resoldre una discrepància amb un company/a parlant-ne",
    "iniciar una interacció amb un company/a de manera adequada",
    "participar en un joc estructurat al pati amb altres companys",
    "valorar la feina de l'equip i la pròpia aportació amb la pauta de coavaluació"]},
  {a:"Personal i social", g:"Comunicació i habilitats socials", items:[
    "saludar i acomiadar-se de manera adequada al context",
    "mantenir el contacte comunicatiu (mirada, orientació del cos) durant una conversa",
    "respectar els torns en una conversa de grup",
    "demanar les coses de manera adequada, amb les fórmules de cortesia",
    "expressar una necessitat o un malestar a l'adult de referència",
    "fer servir el sistema de comunicació augmentativa per expressar una necessitat",
    "adaptar el to de veu a l'espai i a la situació",
    "dir que no o posar un límit de manera assertiva",
    "interpretar la intenció dels altres en una situació social amb el suport d'una història social",
    "comprendre i fer servir les expressions no literals treballades a l'aula"]},
  {a:"Personal i social", g:"Autoconeixement, autoestima i autodeterminació", items:[
    "identificar dos punts forts propis i un aspecte que vol millorar",
    "explicar quins suports l'ajuden a aprendre i demanar-los quan els necessita",
    "prendre una decisió entre opcions donades i justificar-la",
    "proposar-se un objectiu personal i fer-ne el seguiment amb el tutor/a",
    "valorar els propis progressos a partir del registre d'evidències",
    "participar en la revisió del seu pla i dir com li està anant",
    "afrontar una tasca nova sense rebutjar-la d'entrada"]},
  {a:"Personal i social", g:"Flexibilitat, transicions i canvis", items:[
    "acceptar un canvi de la rutina anticipat amb l'agenda visual",
    "fer la transició entre activitats amb l'avís previ acordat",
    "tolerar un canvi imprevist amb el suport de l'adult de referència",
    "provar una manera diferent de fer una tasca quan se li proposa",
    "acceptar que l'activitat s'acabi abans d'haver-la completat del tot",
    "participar en una activitat fora de l'aula habitual amb la preparació prèvia"]},
  {a:"Personal i social", g:"Autonomia personal i vida diària", items:[
    "desplaçar-se de manera autònoma pels espais habituals del centre",
    "consultar l'horari i saber on ha d'anar a cada franja",
    "gestionar els objectes personals (roba, motxilla, esmorzar) sense ajuda",
    "fer servir el lavabo i tenir cura de la higiene personal de manera autònoma",
    "fer servir de manera autònoma els productes de suport previstos",
    "identificar quan necessita descansar, menjar o beure i demanar-ho",
    "fer el recorregut habitual de casa a l'escola de manera segura",
    "gestionar els diners en una situació de compra simulada o real"]},
  {a:"Personal i social", g:"Assistència, puntualitat i implicació", items:[
    "assistir a classe de manera regular, sense superar el nombre de faltes no justificades acordat",
    "arribar puntual a l'inici de la jornada i després de l'esbarjo",
    "assistir a les sessions de suport previstes i aprofitar-les",
    "participar activament a les sessions amb almenys una intervenció pertinent",
    "fer a casa les tasques acordades amb la família i el tutor/a",
    "comunicar a un adult una situació de risc viscuda al pati o a la xarxa"]},
  {a:"Lingüístic", g:"Comprensió lectora", items:[
    "anticipar el contingut d'un text a partir del títol, les imatges i les paraules destacades",
    "identificar la idea principal d'un text expositiu i escriure-la en una frase",
    "respondre preguntes de comprensió literal sobre un text llegit",
    "fer inferències senzilles a partir de la informació del text",
    "subratllar les paraules clau de cada paràgraf",
    "ordenar en una seqüència les idees o els fets d'un text",
    "extreure la informació rellevant d'un text per completar un esquema",
    "relacionar el títol i les imatges amb el contingut del text",
    "distingir entre la informació i l'opinió dins d'un text",
    "seguir les instruccions escrites d'una activitat sense ajuda",
    "buscar al diccionari les paraules que no entén i explicar-ne el sentit",
    "llegir de manera autònoma un llibre de lectura fàcil i explicar-ne l'argument"]},
  {a:"Lingüístic", g:"Lectura i escriptura inicials", items:[
    "associar els sons treballats amb les lletres que els representen",
    "segmentar una paraula en síl·labes i en sons",
    "descodificar paraules amb les estructures sil·làbiques treballades",
    "llegir un text en veu alta amb la fluïdesa acordada",
    "llegir un text breu amb la velocitat lectora acordada (paraules per minut)",
    "escriure al dictat paraules i frases amb les grafies treballades",
    "copiar un text de la pissarra o del llibre sense ometre paraules",
    "escriure amb una lletra llegible, amb la mida i l'espaiat adequats"]},
  {a:"Lingüístic", g:"Expressió escrita", items:[
    "escriure frases completes, amb subjecte i verb",
    "escriure respostes completes a les preguntes, reprenent l'enunciat",
    "planificar l'escrit amb un esquema previ",
    "escriure un text amb l'estructura d'inici, desenvolupament i tancament",
    "escriure un text descriptiu a partir d'un guió donat",
    "escriure un resum d'un text llegit amb les seves paraules",
    "fer servir connectors per enllaçar les idees del text",
    "fer servir les majúscules i els signes de puntuació bàsics",
    "aplicar les normes ortogràfiques treballades a la unitat",
    "revisar l'escrit amb la base d'orientació i corregir-ne els errors marcats",
    "fer servir el corrector ortogràfic o el dictat per veu per escriure un text",
    "presentar els treballs escrits amb el format acordat (títol, marges, data)"]},
  {a:"Lingüístic", g:"Expressió i comprensió oral", items:[
    "seguir una consigna oral de dues instruccions seguides",
    "explicar amb les seves paraules el que acaba de sentir",
    "respondre de manera ajustada a una pregunta oral",
    "explicar una vivència personal seguint l'ordre temporal",
    "participar en una conversa mantenint el tema",
    "formular una pregunta pertinent sobre el que s'ha explicat",
    "exposar oralment un tema preparat amb el guió de suport",
    "fer servir el vocabulari específic de la matèria en la seva explicació"]},
  {a:"Lingüístic", g:"Llengua d'acollida", items:[
    "comprendre i fer servir el vocabulari bàsic de l'escola i de l'aula",
    "comprendre les instruccions orals habituals de l'aula",
    "presentar-se oralment amb les dades personals bàsiques",
    "fer servir frases funcionals per demanar ajuda, permís o material",
    "participar en converses breus amb els companys en català",
    "llegir i comprendre textos breus adaptats al seu nivell de català",
    "escriure frases senzilles sobre temes quotidians",
    "fer servir el diccionari visual o bilingüe per entendre paraules noves"]},
  {a:"Matemàtic", g:"Numeració i càlcul", items:[
    "llegir, escriure i ordenar nombres dins del rang treballat",
    "fer càlcul mental de sumes i restes senzilles amb les estratègies apreses",
    "recuperar de memòria les taules de multiplicar treballades",
    "fer les operacions treballades a la unitat amb el suport acordat",
    "aplicar els passos d'un algorisme amb el suport d'un exemple resolt",
    "estimar el resultat abans de calcular-lo i comparar-hi la resposta",
    "fer servir la calculadora per comprovar els resultats"]},
  {a:"Matemàtic", g:"Resolució de problemes", items:[
    "identificar les dades i la pregunta d'un problema abans de resoldre'l",
    "representar una situació amb un dibuix, una taula o un esquema",
    "fer servir material manipulatiu per representar el problema",
    "resoldre problemes d'una operació amb el guió de resolució",
    "resoldre problemes de dues operacions amb el guió de resolució",
    "explicar el procés que ha seguit per resoldre un problema",
    "comprovar si el resultat obtingut té sentit dins del problema"]},
  {a:"Matemàtic", g:"Mesura, geometria i dades", items:[
    "aplicar les unitats de mesura adequades i escriure-les al resultat",
    "llegir l'hora en rellotges analògics i digitals",
    "fer servir l'euro en situacions de compra i calcular el canvi",
    "identificar i descriure les figures geomètriques treballades",
    "recollir dades i organitzar-les en una taula o un gràfic",
    "llegir i interpretar la informació d'un gràfic senzill"]},
  {a:"Cientificotecnològic", g:"Ciències i tecnologia", items:[
    "formular una hipòtesi abans de fer una activitat experimental",
    "seguir el protocol d'una pràctica pas a pas",
    "registrar les dades d'una observació en una taula",
    "extreure una conclusió a partir de les dades recollides",
    "fer servir les eines de mesura del laboratori o del taller amb precisió",
    "seguir les fases d'un projecte tecnològic amb la plantilla de planificació",
    "fer servir el vocabulari científic treballat a la unitat",
    "aplicar les normes de seguretat del laboratori o del taller",
    "relacionar un fenomen quotidià amb el contingut treballat"]},
  {a:"Social i humanístic", g:"Ciències socials", items:[
    "situar un fet històric en el període que li correspon",
    "ordenar fets en una línia del temps",
    "localitzar en un mapa els elements treballats a la unitat",
    "interpretar una font històrica senzilla amb el guió donat",
    "extreure informació d'una font (text, imatge o mapa) per respondre una pregunta",
    "explicar una causa i una conseqüència d'un fet estudiat",
    "comparar dues realitats socials amb una taula de doble entrada",
    "argumentar la seva opinió sobre un fet d'actualitat amb una dada"]},
  {a:"Artístic", g:"Educació visual, plàstica i musical", items:[
    "fer una producció plàstica seguint la tècnica treballada",
    "explicar les decisions que ha pres en la seva producció",
    "identificar els elements del llenguatge visual en una obra",
    "mantenir el pols rítmic dins d'una interpretació de grup",
    "seguir una partitura o un musicograma senzill",
    "valorar amb respecte les produccions artístiques dels companys",
    "fer servir el material i les eines de manera autònoma i endreçada"]},
  {a:"Educació física", g:"Activitat física i esport", items:[
    "participar en l'activitat física proposada tota la sessió",
    "aplicar les normes del joc o de l'esport treballat",
    "executar l'habilitat motriu treballada amb la pauta donada",
    "cooperar amb els companys en un joc d'equip",
    "acceptar el resultat del joc i mantenir el respecte pels companys",
    "respectar les normes de seguretat i d'higiene de la sessió",
    "reconèixer els efectes de l'activitat física en el propi cos"]},
  {a:"Digital", g:"Competència digital", items:[
    "fer servir l'eina digital acordada per fer i lliurar la tasca",
    "organitzar els seus fitxers a la carpeta de la matèria",
    "buscar informació a la xarxa i dir d'on l'ha tret",
    "distingir una font fiable d'una que no ho és",
    "fer servir les credencials pròpies i mantenir-les en privat",
    "comunicar-se per l'entorn virtual del centre de manera respectuosa",
    "fer servir els productes de suport i les eines d'accessibilitat previstes"]}
];
/* Àmbits de la llista, en l'ordre en què hi surten. */
const AMBITS_CONDUCTA = [...new Set(CONDUCTES_SUGG.map(x => x.a))];

/* Obre la finestra per a un objectiu concret del pas 6. */
function obreBancConductes(objId){
  const p = P();
  const o = ob(objId);
  if(!o){ toast("L'objectiu ja no existeix."); return; }
  state.bc = {obj:objId, mode:"ambits", q:"", obert:true,
              ambit: o.materia === AMBIT_PERSONAL ? AMBIT_PERSONAL : "",
              materia: p.materies.includes(o.materia) ? o.materia : (p.materies[0] || ""), nomesTriat:false};
  openModal("Banc de frases · conducta observable", bcModalHTML(), true);
  pintaBancConductes();
  setTimeout(() => { const i = $("#bc-q"); if(i) i.focus(); }, 30);
}
/* Tancar la finestra torna al pas 6 amb el que s'hi hagi posat. Si es tanca
   amb la creu de la capçalera, ho fa closeModal(). */
function tancaBancConductes(){
  closeModal();
}

function bcModalHTML(){
  const p = P(), bc = state.bc;
  const o = ob(bc.obj) || {};
  /* Les matèries triables: les del pla al davant i, darrere, la resta de
     l'etapa, perquè es pugui mirar el currículum d'una matèria que encara no
     s'ha afegit al pla. */
  const delPla = p ? p.materies.filter(m => unitat(fontBase(p, m))) : [];
  const altres = p ? matsEtapa(p).filter(m => !delPla.includes(m)) : [];
  return `<div class="bm">
   <div class="bm-bar">
     <div class="bm-tabs" role="tablist">
       <button role="tab" data-bc="ambits" aria-selected="${bc.mode==="ambits"}" class="bm-tab"
         onclick="modeBancConductes('ambits')">Per àmbits</button>
       <button role="tab" data-bc="curr" aria-selected="${bc.mode==="curr"}" class="bm-tab"
         onclick="modeBancConductes('curr')">Des del currículum</button>
       <span class="bm-count" id="bc-count"></span>
     </div>
     <div class="bm-filters" id="bc-filtres">
       <input type="search" id="bc-q" placeholder="Cerca dins les frases…" value="${esc(bc.q)}"
         oninput="state.bc.q=this.value;pintaBancConductes()">
       ${bc.mode==="ambits" ? `
       <select aria-label="Àmbit" onchange="state.bc.ambit=this.value;pintaBancConductes()">
         <option value="">Tots els àmbits</option>
         ${AMBITS_CONDUCTA.map(x=>`<option value="${esc(x)}" ${bc.ambit===x?"selected":""}>${esc(x)}</option>`).join("")}
       </select>` : ""}
       ${bc.mode==="curr" ? `
       <select onchange="state.bc.materia=this.value;pintaBancConductes()">
         ${delPla.length ? `<optgroup label="Matèries del pla">${delPla.map(m=>`<option value="${esc(m)}" ${bc.materia===m?"selected":""}>${esc(m)}</option>`).join("")}</optgroup>` : ""}
         ${altres.length ? `<optgroup label="Resta del currículum">${altres.map(m=>`<option value="${esc(m)}" ${bc.materia===m?"selected":""}>${esc(m)}</option>`).join("")}</optgroup>` : ""}
       </select>
       <label class="mes-f"><span>Mostra</span>
         <select onchange="state.bc.nomesTriat=(this.value==='1');pintaBancConductes()">
           <option value="0" ${bc.nomesTriat?"":"selected"}>Tot el currículum</option>
           <option value="1" ${bc.nomesTriat?"selected":""}>Només el triat al pas 5</option>
         </select></label>` : ""}
     </div>
     <div class="bm-dest bc-dest">
       <label class="mes-f" style="flex:1;min-width:240px"><span>Conducta observable de l'objectiu · la pots retocar aquí</span>
         <input type="text" id="bc-txt" value="${esc(o.conducta)}"
           placeholder="identificar la idea principal d'un text expositiu"
           oninput="escriuConducta(this.value)"
           onkeydown="if(event.key==='Enter'){event.preventDefault();tancaBancConductes()}"></label>
       <button class="btn primary bc-fet" onclick="tancaBancConductes()"><span class="msym" aria-hidden="true">&#xe5ca;</span>Fet · torna a l'objectiu</button>
     </div>
   </div>
   <div class="bm-body" id="bc-body"></div>
  </div>`;
}

function modeBancConductes(m){
  state.bc.mode = m;
  openModal("Banc de frases · conducta observable", bcModalHTML(), true);
  pintaBancConductes();
}
/* El que s'escriu a la casella de dalt va a l'objectiu tal com s'escriu: la
   finestra és, també, una manera d'adaptar el text que se n'hagi tret. */
function escriuConducta(v){
  const o = ob(state.bc.obj);
  if(!o) return;
  up(() => { o.conducta = v; });
}
/* Una frase triada substitueix la casella i s'hi queda per poder-la retocar
   sense sortir de la finestra. */
function triaConducta(text){
  const o = ob(state.bc.obj);
  if(!o){ toast("L'objectiu ja no existeix."); tancaBancConductes(); return; }
  up(() => { o.conducta = text; });
  const camp = $("#bc-txt");
  if(camp) camp.value = text;
  pintaBancConductes();
  toast("Frase posada a la conducta observable. Pots adaptar-la a la casella de dalt.");
}

function pintaBancConductes(){
  const cos = $("#bc-body");
  if(!cos) return;
  document.querySelectorAll(".bm-tab[data-bc]").forEach(t =>
    t.setAttribute("aria-selected", String(t.dataset.bc === state.bc.mode)));
  const r = state.bc.mode === "curr" ? cosConductesCurr() : cosConductesAmbits();
  const c = $("#bc-count");
  if(c) c.textContent = r.n + (state.bc.mode === "curr" ? " elements" : " frases");
  cos.innerHTML = r.html;
}

/* ----- Frases per àmbit ----- */
function cosConductesAmbits(){
  const q = (state.bc.q||"").trim().toLowerCase();
  const o = ob(state.bc.obj) || {};
  const ara = (o.conducta||"").trim();
  const ambit = state.bc.ambit || "";
  let n = 0;
  const html = CONDUCTES_SUGG.map(g => {
    if(ambit && g.a !== ambit) return "";
    const items = g.items.filter(x => !q || (g.a+" "+g.g+" "+x).toLowerCase().includes(q));
    n += items.length;
    if(!items.length) return "";
    return `<div class="grp-title"><span class="eyebrow">${esc(g.a)} · ${esc(g.g)}</span><span class="muted small">${items.length}</span></div>
      <div class="sg-list">${items.map(x=>`<button type="button" class="sg-item ${ara===x?"ja":""}" onclick="triaConducta(${jq(x)})">${esc(x)}</button>`).join("")}</div>`;
  }).join("");
  return {n, html: html || `<div class="empty"><b>Cap frase</b>Prova amb altres paraules, mira el currículum o escriu el text que vulguis a la casella de dalt.</div>`};
}

/* ----- El currículum de la matèria, com al pas 5 però per llegir-lo -----
   Hi surt tot el currículum de la matèria, s'hagi triat o no res al pas 5.
   El que sí que s'hi ha triat porta l'etiqueta «Triat al pas 5» i, si se n'ha
   adaptat el text, és el text adaptat el que s'ofereix: si el docent ja va
   reescriure el criteri per a aquest alumne/a, l'objectiu ha de partir d'allà
   i no del text del decret. */
function cosConductesCurr(){
  const p = P();
  const nom = state.bc.materia;
  if(!p || !nom) return {n:0, html:`<div class="empty"><b>Cap matèria</b>Tria una matèria al pas 4 per poder-ne consultar el currículum.</div>`};

  const st = p.curr[nom] || {};
  const q = (state.bc.q||"").trim().toLowerCase();
  const nomes = !!state.bc.nomesTriat;
  const o = ob(state.bc.obj) || {};
  const ara = (o.conducta||"").trim();
  const triats = new Set(st.criteris || []);
  /* Sense res al pas 5, la matèria encara té la seva font pròpia: el
     currículum es pot llegir igualment. */
  const fonts = fontsDe(p, nom);
  const llista = fonts.length ? fonts : [fontBase(p, nom)].filter(f => unitat(f));

  let n = 0;
  const html = llista.map(font => {
    const u = unitat(font);
    if(!u) return "";
    const prim = esInferior(p, font);
    const blocs = u.ce.map(c => {
      const kce = claCE(nom, font, c.n);
      const adCE = (st.adaptCE||{})[kce] || "";
      const ceTxt = adCE || c.desc;
      const files = [];
      c.grups.forEach(g => g.items.forEach(i => {
        const k = claCrit(font, i.c, g.curs);
        const triat = triats.has(k);
        if(nomes && !triat) return;
        const txt = (st.adapt||{})[k] || i.t;
        if(q && !(i.c+" "+txt+" "+c.desc).toLowerCase().includes(q)) return;
        files.push({k, codi:i.c, curs:g.curs, txt, triat, adaptat:!!(st.adapt||{})[k]});
      }));
      if(!files.length) return "";
      n += files.length;
      return `<div class="tc-box ${files.some(f=>f.triat)||adCE?"tria":""}">
        <div style="display:flex;gap:9px;align-items:flex-start;flex-wrap:wrap">
          <span class="tc-cen ${prim?"prim":""}">CE${c.n}</span>
          <span style="flex:1;min-width:180px;font-size:13.5px;line-height:1.5">${esc(ceTxt)}</span>
          ${adCE?`<span class="tag con">Text adaptat</span>`:""}
          ${prim?`<span class="tag warn">${esc(u.nom)}</span>`:""}
          <button class="btn sm ghost" title="Parteix d'aquesta competència" onclick="triaConducta(${jq(frasePartint(ceTxt))})">Usa</button>
        </div>
        ${files.map(f=>`<div class="tc-crit ${prim?"prim":""} ${f.triat?"tria":""}">
          <span class="code">${esc(f.codi)}</span>
          <span style="flex:1">${esc(f.txt)}
            <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap;align-items:center">
              <span class="tag ${prim?"warn":"met"}">${esc(etapaDe(font))} · ${esc(f.curs)}</span>
              ${f.triat?`<span class="tag con">Triat al pas 5</span>`:""}
              ${f.adaptat?`<span class="tag con">Text adaptat</span>`:""}
              <button class="btn sm ${ara===frasePartint(f.txt)?"ok":"primary"}" onclick="triaConducta(${jq(frasePartint(f.txt))})">${ara===frasePartint(f.txt)?"✓ Posada":"Usa"}</button>
            </div></span></div>`).join("")}
      </div>`;
    }).join("");
    if(!blocs.trim()) return "";
    return `<div class="grp-title"><span class="eyebrow">${esc(u.nom)}</span>
      <span class="muted small">${prim?"Currículum de primària · nivell anterior":esc(u.cursos||"")}</span></div>${blocs}`;
  }).join("");

  return {n, html: html.trim() || `<div class="empty"><b>Cap element amb aquests filtres</b>${nomes?"Al pas 5 encara no s'ha triat res d'aquesta matèria: canvia a «Tot el currículum».":"Prova amb altres paraules o canvia de matèria."}</div>`};
}

/* Passa un text del currículum a la forma que demana la frase de l'objectiu.
   Els criteris del decret comencen amb un verb en infinitiu i en majúscula
   («Identificar la idea principal…») i la frase els necessita en minúscula i
   sense el punt final, perquè hi encaixin rere «serà capaç de». */
function frasePartint(text){
  const t = String(text||"").trim().replace(/\s+/g, " ").replace(/\.$/, "");
  if(!t) return "";
  return t.charAt(0).toLowerCase() + t.slice(1);
}
