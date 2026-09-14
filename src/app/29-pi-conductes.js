/* ---------- Banc de frases per a la conducta observable (pas 6) ----------
   La casella «Conducta observable» d'un objectiu és la part que costa més
   d'escriure de tot el pla: ha de dir què farà l'alumne/a de manera que es
   pugui veure i comptar. Aquesta finestra hi ofereix dues entrades:

   · Per àmbits — frases curtes, ja redactades en la forma que demana la
     frase de l'objectiu («serà capaç de …»), agrupades per àmbit de
     l'educació bàsica: personal i social, lingüístic, matemàtic, i la resta.

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
  {g:"Personal i social · aprendre a aprendre", items:[
    "planificar la tasca abans de començar-la i dir en quin ordre la farà",
    "revisar la feina amb la pauta de revisió abans de lliurar-la",
    "demanar ajuda amb la fórmula acordada quan es queda encallat",
    "reconèixer quan no ha entès una consigna i dir-ho",
    "portar l'agenda al dia amb les tasques i les dates de lliurament",
    "preparar el material de la sessió següent abans de sortir de l'aula",
    "acabar la tasca començada dins del temps previst",
    "valorar la pròpia feina amb la rúbrica i justificar la valoració",
    "fixar-se una fita setmanal i dir al final de la setmana si l'ha assolida"]},
  {g:"Regulació emocional i conducta", items:[
    "anomenar l'emoció que sent abans d'actuar",
    "fer servir una estratègia de calma acordada quan nota que es desborda",
    "sortir a l'espai acordat i tornar a l'aula dins del temps pactat",
    "esperar el torn de paraula i intervenir quan se li dona",
    "acceptar una correcció sense interrompre l'activitat",
    "resoldre una discrepància amb un company/a parlant-ne",
    "complir les normes acordades de l'aula al llarg de la sessió",
    "registrar al full de seguiment com li ha anat la sessió"]},
  {g:"Relació amb els iguals i treball en equip", items:[
    "assumir el rol assignat dins del grup i fer-ne la part",
    "exposar la seva idea al grup i escoltar la dels altres",
    "demanar ajuda a un company/a abans de demanar-la al docent",
    "participar en una activitat de grup sense sortir-ne",
    "aportar una proposta al treball cooperatiu i argumentar-la"]},
  {g:"Àmbit lingüístic · comprensió lectora", items:[
    "identificar la idea principal d'un text expositiu i escriure-la en una frase",
    "respondre preguntes de comprensió literal sobre un text llegit",
    "fer inferències senzilles a partir de la informació del text",
    "subratllar les paraules clau de cada paràgraf",
    "llegir un text en veu alta amb la fluïdesa acordada",
    "relacionar el títol i les imatges amb el contingut del text",
    "distingir entre la informació i l'opinió dins d'un text",
    "buscar al diccionari les paraules que no entén i explicar-ne el sentit"]},
  {g:"Àmbit lingüístic · expressió escrita", items:[
    "escriure un text amb l'estructura d'inici, desenvolupament i tancament",
    "planificar l'escrit amb un esquema previ",
    "escriure un resum d'un text llegit amb les seves paraules",
    "revisar l'escrit amb la base d'orientació i corregir-ne els errors marcats",
    "fer servir connectors per enllaçar les idees del text",
    "aplicar les normes ortogràfiques treballades a la unitat",
    "escriure un text descriptiu a partir d'un guió donat"]},
  {g:"Àmbit lingüístic · expressió i comprensió oral", items:[
    "exposar oralment un tema preparat amb el guió de suport",
    "seguir una consigna oral de dues instruccions seguides",
    "explicar amb les seves paraules el que acaba de sentir",
    "participar en una conversa mantenint el tema",
    "formular una pregunta pertinent sobre el que s'ha explicat",
    "fer servir el vocabulari específic de la matèria en la seva explicació"]},
  {g:"Àmbit matemàtic", items:[
    "identificar les dades i la pregunta d'un problema abans de resoldre'l",
    "resoldre problemes d'una operació amb el guió de resolució",
    "explicar el procés que ha seguit per resoldre un problema",
    "fer les operacions treballades a la unitat amb el suport acordat",
    "estimar el resultat abans de calcular-lo i comparar-hi la resposta",
    "representar una situació amb un dibuix, una taula o un esquema",
    "llegir i interpretar la informació d'un gràfic senzill",
    "aplicar les unitats de mesura adequades i escriure-les al resultat",
    "comprovar si el resultat obtingut té sentit dins del problema"]},
  {g:"Àmbit cientificotecnològic", items:[
    "formular una hipòtesi abans de fer una activitat experimental",
    "seguir el protocol d'una pràctica pas a pas",
    "registrar les dades d'una observació en una taula",
    "extreure una conclusió a partir de les dades recollides",
    "fer servir el vocabulari científic treballat a la unitat",
    "aplicar les normes de seguretat del laboratori o del taller",
    "relacionar un fenomen quotidià amb el contingut treballat"]},
  {g:"Àmbit social i humanístic", items:[
    "situar un fet històric en el període que li correspon",
    "localitzar en un mapa els elements treballats a la unitat",
    "interpretar una font històrica senzilla amb el guió donat",
    "explicar una causa i una conseqüència d'un fet estudiat",
    "comparar dues realitats socials amb una taula de doble entrada",
    "argumentar la seva opinió sobre un fet d'actualitat amb una dada"]},
  {g:"Àmbit artístic", items:[
    "fer una producció plàstica seguint la tècnica treballada",
    "explicar les decisions que ha pres en la seva producció",
    "identificar els elements del llenguatge visual en una obra",
    "mantenir el pols rítmic dins d'una interpretació de grup",
    "fer servir el material i les eines de manera autònoma i endreçada"]},
  {g:"Àmbit d'educació física", items:[
    "participar en l'activitat física proposada tota la sessió",
    "aplicar les normes del joc o de l'esport treballat",
    "executar l'habilitat motriu treballada amb la pauta donada",
    "acceptar el resultat del joc i mantenir el respecte pels companys",
    "reconèixer els efectes de l'activitat física en el propi cos"]},
  {g:"Àmbit digital", items:[
    "fer servir l'eina digital acordada per fer i lliurar la tasca",
    "buscar informació a la xarxa i dir d'on l'ha tret",
    "distingir una font fiable d'una que no ho és",
    "fer servir els productes de suport i les eines d'accessibilitat previstes",
    "organitzar els seus fitxers a la carpeta de la matèria"]}
];

/* Obre la finestra per a un objectiu concret del pas 6. */
function obreBancConductes(objId){
  const p = P();
  const o = ob(objId);
  if(!o){ toast("L'objectiu ja no existeix."); return; }
  state.bc = {obj:objId, mode:"ambits", q:"",
              materia: o.materia || (p.materies[0] || ""), nomesTriat:false};
  openModal("Banc de frases · conducta observable", bcModalHTML(), true);
  pintaBancConductes();
  setTimeout(() => { const i = $("#bc-q"); if(i) i.focus(); }, 30);
}
/* Tancar la finestra torna al pas 6 amb el que s'hi hagi posat. */
function tancaBancConductes(){
  closeModal();
  renderPi();
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
     </div>
     <div class="bm-filters" id="bc-filtres">
       <input type="search" id="bc-q" placeholder="Cerca dins les frases…" value="${esc(bc.q)}"
         oninput="state.bc.q=this.value;pintaBancConductes()">
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
     <div class="bm-dest">
       <label class="mes-f" style="flex:1;min-width:260px"><span>Conducta observable</span>
         <input type="text" id="bc-txt" value="${esc(o.conducta)}"
           placeholder="identificar la idea principal d'un text expositiu"
           oninput="escriuConducta(this.value)"></label>
       <span class="bm-count" id="bc-count"></span>
       <button class="btn sm" onclick="tancaBancConductes()">Fet</button>
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
  let n = 0;
  const html = CONDUCTES_SUGG.map(g => {
    const items = g.items.filter(x => !q || (g.g+" "+x).toLowerCase().includes(q));
    n += items.length;
    if(!items.length) return "";
    return `<div class="grp-title"><span class="eyebrow">${esc(g.g)}</span><span class="muted small">${items.length}</span></div>
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
