/* ----- Pas 5: currículum (secció 5, quadres de matèria i transversals) -----
   Els codis 1.1, 1.2, 2.1… són els criteris d'avaluació de l'annex 3 del
   Decret 175/2022. Adaptar-ne el text (o el d'una competència específica)
   converteix el pla en curricular.                                        */

/* Un pla és curricular quan s'ha adaptat el text d'algun criteri o
   competència, o quan s'ha aplicat una acció que no és mantenir-lo igual. */
function teAdaptacioCurricular(p){
  if(usaNivellInferior(p)) return true;
  return p.materies.some(nom => {
    const st = p.curr[nom]; if(!st) return false;
    if((st.propis||"").trim()) return true;
    if(Object.values(st.adapt||{}).some(v => (v||"").trim())) return true;
    if(Object.values(st.adaptCE||{}).some(v => (v||"").trim())) return true;
    return Object.values(st.accions||{}).some(v => v && v !== "Mantenir sense canvis");
  });
}
/* Prendre criteris, competències o sabers d'un nivell inferior és per si sol
   una adaptació curricular: el pla hi passa automàticament. El nivell inferior
   és el currículum de primària dins d'un pla d'ESO i, a totes dues etapes, un
   curs anterior al que cursa l'alumne/a. */
function usaNivellInferior(p){
  return p.materies.some(nom => elementsInferiors(p, nom).total > 0);
}
/* Elements de nivell inferior de tot el pla, comptin de l'etapa que comptin. */
function comptaInferiors(p){
  return p.materies.reduce((n, nom) => n + elementsInferiors(p, nom).total, 0);
}
function comptaAdaptacions(p){
  let n = 0;
  p.materies.forEach(nom => {
    const st = p.curr[nom]; if(!st) return;
    n += Object.values(st.adapt||{}).filter(v => (v||"").trim()).length;
    n += Object.values(st.adaptCE||{}).filter(v => (v||"").trim()).length;
    n += Object.values(st.accions||{}).filter(v => v && v !== "Mantenir sense canvis").length;
  });
  return n;
}
/* Es promou el pla a curricular, mai a l'inrevés de manera automàtica:
   revertir-lo sempre és una decisió explícita del docent. */
function revisaTipusPI(){
  const p = P(); if(!p) return;
  if(p.tipus === "metodologic" && teAdaptacioCurricular(p)){
    p.tipus = "continguts"; desa();
    toast(usaNivellInferior(p)
      ? "El pla passa a ser curricular: s'hi han pres elements curriculars d'un nivell inferior."
      : "El pla passa a ser curricular: s'han adaptat elements del currículum.");
  }
}
function forcaTipus(t){ upR(p => p.tipus = t); }

/* ----- Requadres d'ajuda plegables del pas 5 -----
   Les tres explicacions de capçalera (els codis del decret, com funcionen els
   sabers i com prendre criteris d'un nivell anterior) es poden tancar amb la
   creu. En tancar-se no es perden: baixen a la barra d'etiquetes de dalt del
   pas, amb una sola paraula que les identifica, i des d'allà es tornen a
   obrir. La barra es queda on és —no s'enganxa a la pantalla en desplaçar-se,
   perquè la franja del pla ja hi és i dues barres fixes es fan feixugues.
   L'estat és una preferència del navegador (KEY_UI), no una dada del centre:
   no va a la còpia de seguretat.
   El requadre del tipus de pla no és plegable: no és una explicació, és
   l'estat del pla que s'està editant. */
const NOTES_PAS5 = [
  {k:"codis",  paraula:"Codis"},
  {k:"sabers", paraula:"Sabers"},
  {k:"nivell", paraula:"Nivell"}
];
const notaTancada = k => !!ui.notesPas5[k];
function plegaNota(k, tancada){
  ui.notesPas5[k] = !!tancada;
  desaUI();
  renderPi();
}
function mostraNotesPas5(){
  NOTES_PAS5.forEach(n => { ui.notesPas5[n.k] = false; });
  desaUI();
  renderPi();
}
function notaPlegable(k, html){
  if(notaTancada(k)) return "";
  return `<div class="note info plegable" style="margin-bottom:14px">
    <button class="note-x" type="button" title="Amaga aquesta explicació" aria-label="Amaga aquesta explicació"
      onclick="plegaNota(${jq(k)},true)">&times;</button>
    ${html}</div>`;
}
function ancoraNotes(){
  const t = NOTES_PAS5.filter(n => notaTancada(n.k));
  if(!t.length) return "";
  return `<div class="notes-ancora"><span class="eyebrow">Ajuda</span>
    ${t.map(n=>`<button class="nota-chip" type="button" title="Torna a mostrar aquesta explicació"
      onclick="plegaNota(${jq(n.k)},false)">${esc(n.paraula)}</button>`).join("")}
    ${t.length>1?`<button class="btn sm ghost" style="margin-left:auto" onclick="mostraNotesPas5()">Mostra-les totes</button>`:""}</div>`;
}

function pas5(p){
  const mats = p.materies;
  const prim = esPlaPrim(p);
  const altres = p.materies.filter(m => !unitat(fontBase(p, m)));
  const curric = p.tipus === "continguts";
  const nAd = comptaAdaptacions(p);
  const nPr = comptaInferiors(p);
  return `
  <div class="card" data-qc="criteris"><div class="card-h"><span class="num">5</span><h2>Competències, criteris d'avaluació i sabers</h2>
    ${tipusTag(p.tipus)}</div><div class="card-b">

    ${ancoraNotes()}

    ${notaPlegable("codis", `
      <b>Els codis 1.1, 1.2, 2.1…</b> Són els <b>criteris d'avaluació</b> de l'annex ${prim?"2":"3"} del Decret 175/2022: el primer número és la <b>competència específica</b> de ${prim?"l'àrea":"la matèria"} i el segon, el criteri que se'n deriva. Les competències transversals són a l'annex 4.`)}

    ${notaPlegable("sabers", `
      <b>Curs del criteri i sabers.</b> El desplegable <b>Curs del criteri</b> concreta de quin curs es pren cada criteri, i el botó <b>Tria sabers</b> obre els sabers de ${prim?"l'àrea":"la matèria"}; tots dos surten al document. Els sabers prenen el curs del criteri d'on pengen, tret que se'ls en canviï un expressament.`)}

    ${notaPlegable("nivell", prim ? `
      <b>Criteris d'un cicle anterior.</b> Tria <b>Tots els cursos</b> al selector de l'àrea per veure els criteris i els sabers dels tres cicles de l'annex 2. Prendre'n cap d'un curs anterior al de l'alumne/a converteix el pla en <b>curricular</b>.` : `
      <b>Criteris d'un nivell inferior.</b> L'etiqueta <b>+ Primària</b> de cada matèria hi porta el currículum de l'àrea anàloga (annex 2), que s'obre i es tanca a part. Tenir-lo obert no canvia res: el que converteix el pla en <b>curricular</b> és marcar-ne algun element, que queda identificat amb la seva etapa i curs.`)}

    <div class="note ${curric?"":"info"}" style="margin-bottom:14px">
      ${curric
        ? `<b>Pla curricular · amb adaptació de criteris.</b> Els criteris seleccionats parteixen dels establerts al Decret 175/2022 i s'han personalitzat, fins i tot prenent-los d'un curs anterior. L'alumne/a s'avalua d'acord amb aquests criteris, cosa que en cap cas pot suposar una limitació en les seves qualificacions.
           ${nAd===0 && nPr===0 ? `<br><span class="small">Ara mateix no hi consta cap adaptació. <button class="btn sm" onclick="forcaTipus('metodologic')">Torna'l a metodològic i d'accés</button></span>`
                     : `<br><span class="small">${nAd} element${nAd===1?"":"s"} del currículum adaptat${nAd===1?"":"s"}${nPr?` i ${nPr} element${nPr===1?"":"s"} pres${nPr===1?"":"os"} d'un nivell inferior`:""}.</span>`}`
        : `<b>Pla metodològic i d'accés.</b> Es mantenen els criteris d'avaluació del curs: aquí només es prioritzen els criteris i els sabers que vertebren el treball amb l'alumne/a.
           <br><span class="small">Si adaptes el text d'un criteri o d'una competència amb el botó <b>Adaptar</b>, si en prens cap d'un nivell inferior o si tries un saber d'un curs anterior al que fa l'alumne/a, el pla passarà automàticament a ser <b>curricular</b>.</span>`}
    </div>

    ${mats.length===0 ? `<div class="empty"><b>Cap matèria del currículum seleccionada</b>Torna al pas 4 i tria matèries.</div>` :
      mats.map(nom => blocMateria(p, nom)).join("")}
    ${altres.length ? `<p class="legal">${esc(altres.join(", "))}: no ${altres.length===1?"consta":"consten"} a l'annex ${prim?"2":"3"} del decret. Concreta'n els elements curriculars al camp de criteris personalitzats o al camp de concreció del pas 4${prim?"":", o carrega-hi el currículum d'una àrea de primària"}.</p>` : ""}
  </div></div>

  <div class="card"><div class="card-h"><h2>Competències transversals</h2><span class="tag">Annex 4</span></div><div class="card-b">
    <p class="small muted" style="margin-top:0">Concreta, per a cada competència transversal implicada, les competències específiques i els criteris d'avaluació prioritaris.</p>
    ${COMP_TRANSVERSALS.map(c=>{
      const v = p.transv.find(t=>t.id===c.id) || {};
      const on = !!p.transv.find(t=>t.id===c.id);
      return `<label class="chk"><input type="checkbox" ${on?"checked":""} onchange="upR(p=>{ if(this.checked) p.transv.push({id:'${c.id}',ce:'',criteris:'',etapa:''}); else p.transv=p.transv.filter(t=>t.id!=='${c.id}'); })">
        <span class="txt"><b>${esc(c.nom)}</b><div class="small muted" style="margin-top:3px;line-height:1.5">${esc(c.desc)}</div>
        ${on?`<div style="margin-top:9px">
          <input type="text" placeholder="Competències específiques associades" value="${esc(v.ce||"")}" onchange="up(p=>p.transv.find(t=>t.id==='${c.id}').ce=this.value)">
          <input type="text" style="margin-top:6px" placeholder="Criteris d'avaluació prioritaris" value="${esc(v.criteris||"")}" onchange="up(p=>p.transv.find(t=>t.id==='${c.id}').criteris=this.value)">
          <input type="text" style="margin-top:6px" placeholder="Etapa i curs del criteri d'avaluació" value="${esc(v.etapa||"")}" onchange="up(p=>p.transv.find(t=>t.id==='${c.id}').etapa=this.value)">
        </div>`:""}</span></label>`;
    }).join("")}
  </div></div>`;
}
/* Etiquetes de curs dins de cada etapa: sis a primària, quatre a l'ESO. */
const ETQ_CURS = {1:"1r", 2:"2n", 3:"3r", 4:"4t", 5:"5è", 6:"6è"};
const PARAULA_CURS = {primer:1, segon:2, tercer:3, quart:4, "cinquè":5, "sisè":6};
/* Número de curs d'una etiqueta solta: "2n", "5è", "3r ESO"… */
const numCurs = c => { const m = String(c==null?"":c).match(/[1-6]/); return m ? +m[0] : null; };
/* Cursos que abasta una etiqueta de grup del decret ("1r i 2n", "Tercer i
   quart curs", "5è i 6è", "1r a 3r"…). Serveix tant per filtrar els criteris
   pel curs de l'alumne/a com per oferir els cursos possibles d'un saber. */
function cursosDeLabel(label, prim){
  const s = String(label).toLowerCase();
  const max = prim ? 6 : 4;
  const tots = []; for(let i=1; i<=max; i++) tots.push(i);
  let nums = (s.match(/[1-6]\s*(?:r|n|t|è|é|e)/g)||[]).map(x => +x[0]).filter(n => n<=max);
  Object.keys(PARAULA_CURS).forEach(w => { if(s.includes(w) && PARAULA_CURS[w]<=max) nums.push(PARAULA_CURS[w]); });
  if(!nums.length) return tots;
  const u = [...new Set(nums)].sort();
  if(u.length >= 2 && /\ba\b|fins/.test(s)){
    const out = []; for(let i=u[0]; i<=u[u.length-1]; i++) out.push(i); return out;
  }
  return u;
}
/* Etiquetes de curs que es poden triar per a un saber d'aquest grup. */
function cursosOpcions(font, label){
  return cursosDeLabel(label, esPrim(font)).map(n => ETQ_CURS[n]);
}
function grupCoincideix(label, curs, prim){
  const d = numCurs(curs);
  if(!d) return true;
  return cursosDeLabel(label, prim).includes(d);
}
/* Curs efectiu d'una etiqueta de grup: el més alt que abasta. Un bloc sencer
   ("1r, 2n i 3r") no és d'un nivell inferior mentre l'alumne/a hi sigui a
   dins; un curs triat expressament dins del bloc, sí que ho pot ser. */
function nivellCurs(font, label){
  const o = cursosDeLabel(label, esPrim(font));
  return o.length ? o[o.length-1] : null;
}
/* Estat curricular d'una matèria. Es crea a demanda: cap mutador no pot
   dependre que el pas 5 s'hagi pintat abans. */
function currDe(p, nom){
  const st = p.curr[nom] = p.curr[nom] || {};
  st.criteris = st.criteris || [];
  st.accions = st.accions || {}; st.adapt = st.adapt || {}; st.adaptCE = st.adaptCE || {};
  /* cursCrit és {clau del criteri: curs}. La clau del criteri ja porta
     l'etiqueta del bloc del decret ("1r i 2n", "1r, 2n i 3r"), que és el que
     val mentre el docent no en concreti un curs. Quan el concreta, es desa
     aquí: és el curs que surt a la columna «Etapa i curs del criteri» del
     document i el que hereten els sabers que en pengen. */
  st.cursCrit = st.cursCrit || {};
  /* prim[] són les àrees de primària carregades en aquesta matèria. Els plans
     desats abans d'aquesta opció no en tenen: s'hi afegeix buida. */
  st.prim = st.prim || [];
  if(st.propis === undefined) st.propis = "";
  if(st.filtre === undefined) st.filtre = "auto";
  /* Els sabers pengen del criteri d'avaluació que els porta: sabersCrit és
     {clau del criteri: [{t, font, grup, curs}]}. Els plans desats amb la
     llista única de sabers per matèria s'hi converteixen en carregar-los. */
  if(!st.sabersCrit){
    st.sabersCrit = {};
    st.sabersSense = st.sabersSense || [];
    migraSabers(p, nom, st);
  }
  st.sabersSense = st.sabersSense || [];
  return st;
}
/* Identitat d'un saber triat. El text sol no basta: a primària els mateixos
   sabers es repeteixen literalment a més d'un cicle. */
const claSaber = s => s.font + "§" + (s.grup||"") + "§" + s.t;
const sabersDe = (st, key) => (st.sabersCrit||{})[key] || [];
/* Curs assignat a un criteri d'avaluació: el que hagi triat el docent i, si
   no n'ha triat cap, l'etiqueta del bloc de cursos del decret. */
const cursCriteri = (st, key) => ((st||{}).cursCrit||{})[key] || String(key).split("|")[2];
/* Tots els sabers triats d'una matèria, vinguin del criteri que vinguin. */
function totsSabers(st){
  const out = [];
  Object.keys(st.sabersCrit||{}).forEach(k => (st.sabersCrit[k]||[]).forEach(s => out.push(s)));
  return out;
}
/* Reparteix la llista antiga st.sabers (només texts, per matèria) entre els
   criteris ja triats de la mateixa font. Els que no tenen cap criteri on
   penjar queden a st.sabersSense: el pas 5 els mostra i el document els
   imprimeix al peu, de manera que cap pla desat no perd informació. */
function migraSabers(p, nom, st){
  const vells = Array.isArray(st.sabers) ? st.sabers.slice() : [];
  delete st.sabers;
  /* El format antic desava només el text: un mateix saber repetit a dos
     cicles del decret hi constava una sola vegada i aquí també. */
  const vistos = new Set();
  vells.forEach(t => {
    const loc = localitzaSaber(p, nom, t);
    if(!loc) return;
    const item = {t:t, font:loc.font, grup:loc.grup, curs:loc.curs};
    if(vistos.has(claSaber(item))) return;
    vistos.add(claSaber(item));
    const dest = st.criteris.find(k => fontDeClau(k) === loc.font);
    if(dest) (st.sabersCrit[dest] = st.sabersCrit[dest] || []).push(item);
    else st.sabersSense.push(item);
  });
}
/* ----- Fonts curriculars d'una matèria del pla -----
   A l'ESO, la matèria de l'annex 3 i, si el docent les ha carregades, les
   àrees de primària que hi ha activat. A primària, l'àrea de l'annex 2 i prou:
   no hi ha cap etapa inferior d'on prendre criteris i el currículum de
   secundària no s'hi carrega mai. */
function fontsDe(p, nom){
  const st = currDe(p, nom);
  if(esPlaPrim(p)) return [idPrim(nom)].filter(f => unitat(f));
  return [nom].concat(st.prim.map(idPrim)).filter(f => unitat(f));
}
/* ----- Quins currículums ensenya la franja d'una matèria al pas 5 -----
   Cada font té la seva etiqueta i s'obre i es tanca per separat: es poden
   tenir totes dues etapes obertes alhora o mirar-ne una de sola. Tenir el
   currículum de primària a mà no converteix el pla en curricular; això
   només passa quan se'n marca algun element, i és per això que cada
   etiqueta diu quants n'hi ha de triats.
   Sense res desat, es veuen totes les fonts carregades. */
function vistesDe(p, nom){
  const fonts = fontsDe(p, nom);
  /* Un pla de primària només té un currículum: sempre és a la vista. */
  if(esPlaPrim(p)) return fonts;
  const v = state.vistaCurr[nom];
  return Array.isArray(v) ? fonts.filter(f => v.includes(f)) : fonts.slice();
}
/* Obre o tanca una font. El panell entra pel costat que li toca: l'ESO és a
   l'esquerra i les àrees de primària, a la dreta. */
function commutaVista(nom, font){
  const p = P(), fonts = fontsDe(p, nom);
  const v = Array.isArray(state.vistaCurr[nom]) ? state.vistaCurr[nom].slice() : fonts.slice();
  if(v.includes(font)) state.vistaCurr[nom] = v.filter(f => f !== font);
  else { v.push(font); state.vistaCurr[nom] = v; marcaEntrada(nom, font); }
  state.openMat[nom] = true;
  renderPi();
}
/* Obre una font (si estava tancada) sense tancar-ne cap altra. */
function mostraVista(nom, font){
  const v = state.vistaCurr[nom];
  if(Array.isArray(v) && !v.includes(font)) v.push(font);
  marcaEntrada(nom, font);
  state.openMat[nom] = true;
}
const claVista = (nom, font) => nom + "§" + font;
function marcaEntrada(nom, font){ state.vistaAnim[claVista(nom, font)] = esPrim(font) ? "dreta" : "esq"; }
/* Clau d'una competència específica dins l'estat de la matèria: per a l'ESO
   es manté el número sol, tal com el desaven les versions anteriors. */
function claCE(nom, font, n){ return font === nom ? String(n) : font + "#" + n; }
/* Clau d'un criteri d'avaluació: font | codi | curs. */
function claCrit(font, codi, curs){ return font + "|" + codi + "|" + curs; }
const fontDeClau = k => String(k).split("|")[0];
/* Ordena claus de criteri pel codi (1.2 abans que 1.10) i, si empaten, pel curs. */
function ordenaCriteris(claus){
  return claus.slice().sort((a, b) => {
    const x = a.split("|")[1].split(".").map(Number), y = b.split("|")[1].split(".").map(Number);
    return (x[0]-y[0]) || (x[1]-y[1]) || String(a).localeCompare(String(b));
  });
}

/* On viu un saber dins de les fonts d'una matèria: de quina font surt, de
   quin grup del decret i quin curs se li assigna per defecte (el més alt del
   grup, per no convertir el pla en curricular sense que ningú ho decideixi). */
function localitzaSaber(p, nom, text){
  for(const f of fontsDe(p, nom)){
    const u = unitat(f);
    if(!u) continue;
    for(const g of (u.sabers||[]))
      for(const te of g.temes)
        for(const i of te.items)
          if(i.t === text){
            const opc = cursosOpcions(f, g.curs);
            return {font:f, grup:g.curs, curs:opc[opc.length-1] || ""};
          }
  }
  return null;
}
/* Un saber és d'un nivell inferior si ve d'una etapa anterior a la del pla o
   si el curs que se li ha assignat és anterior al que cursa l'alumne/a. */
function saberInferior(p, s){
  if(!s) return false;
  if(esInferior(p, s.font)) return true;
  const a = numCurs(s.curs), b = numCurs(p.de.curs);
  return !!(a && b && a < b);
}
/* El mateix per a un criteri d'avaluació, amb el curs que se li ha assignat. */
function criteriInferior(p, st, key){
  const font = fontDeClau(key);
  if(esInferior(p, font)) return true;
  const a = nivellCurs(font, cursCriteri(st, key)), b = numCurs(p.de.curs);
  return !!(a && b && a < b);
}
/* Criteris d'una matèria que són d'un nivell inferior al de l'alumne/a. */
function criterisInferiors(p, nom){
  const st = p.curr[nom];
  if(!st) return [];
  return (st.criteris||[]).filter(k => criteriInferior(p, st, k));
}
/* Sabers d'una matèria que són d'un curs anterior al de l'alumne/a. */
function sabersInferiors(p, nom){
  const st = currDe(p, nom);
  return totsSabers(st).concat(st.sabersSense||[]).filter(s => saberInferior(p, s));
}
/* Elements presos d'una etapa anterior a la del pla (a l'ESO, els de
   primària). En un pla de primària no n'hi ha cap: allà el nivell inferior és
   un cicle anterior de la mateixa àrea i el compta elementsInferiors(). */
function elementsPrim(p, nom){
  const st = currDe(p, nom);
  const crits = st.criteris.filter(k => esInferior(p, fontDeClau(k)));
  const sabs = totsSabers(st).concat(st.sabersSense||[]).filter(s => esInferior(p, s.font));
  const ces = Object.keys(st.adaptCE).filter(k => esInferior(p, ceDeClau(nom, k).font) && (st.adaptCE[k]||"").trim());
  return {criteris:crits, sabers:sabs, ce:ces, total: crits.length + sabs.length + ces.length};
}
/* Tot el que en una matèria és d'un nivell inferior al que cursa l'alumne/a:
   d'una etapa anterior o d'un curs anterior de la mateixa etapa. És el que fa
   que el pla passi a ser curricular. */
function elementsInferiors(p, nom){
  const st = p.curr[nom];
  if(!st) return {criteris:[], sabers:[], ce:[], total:0};
  const crits = criterisInferiors(p, nom);
  const sabs = sabersInferiors(p, nom);
  const ces = Object.keys(st.adaptCE||{}).filter(k => esInferior(p, ceDeClau(nom, k).font) && (st.adaptCE[k]||"").trim());
  return {criteris:crits, sabers:sabs, ce:ces, total: crits.length + sabs.length + ces.length};
}

function blocMateria(p, nom){
  /* Optativa, Projecte, Àmbit i Tutoria no són al currículum: la franja
     existeix igualment perquè s'hi pugui carregar currículum d'un nivell
     inferior i escriure-hi criteris propis. */
  const prim = esPlaPrim(p);
  const m = unitat(fontBase(p, nom)) || {nom:nom, cursos:`fora de l'annex ${prim?"2":"3"}`, ce:[], sabers:[]};
  const st = currDe(p, nom);
  const nsel = st.criteris.length;
  const nsab = totsSabers(st).length + (st.sabersSense||[]).length;
  const nadapt = Object.values(st.adapt).filter(v=>(v||"").trim()).length
               + Object.values(st.adaptCE).filter(v=>(v||"").trim()).length;
  const ep = elementsPrim(p, nom);
  /* A primària el nivell inferior és un cicle anterior de la mateixa àrea:
     no hi ha etiqueta «de primària» i es compta a part. */
  const ninf = prim ? elementsInferiors(p, nom).total : 0;
  const obert = !!state.openMat[nom];
  const fonts = fontsDe(p, nom);
  const vistes = vistesDe(p, nom);
  const veuBase = vistes.includes(fontBase(p, nom));
  return `<details class="ce" ${obert?"open":""}>
    <summary onclick="event.preventDefault();state.openMat[${jq(nom)}]=!state.openMat[${jq(nom)}];renderPi()">
    <span class="cen">${esc(nom.slice(0,3).toUpperCase())}</span>
    <span class="cetxt"><b>${esc(nom)}</b>
      <div class="small muted" style="margin-top:2px">${esc(m.cursos)} · <span class="sel-count">${nsel} criteris</span> · <span class="sel-count">${nsab} sabers</span>${nadapt?` · <span class="sel-count adapt">${nadapt} adaptats</span>`:""}${ep.total?` · <span class="sel-count prim">${ep.total} de primària</span>`:""}${ninf?` · <span class="sel-count prim">${ninf} de nivell inferior</span>`:""}</div></span>
    </summary>
   ${!obert ? "" : `<div class="ceb">
    ${tagsCurriculars(p, nom, fonts, vistes)}
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0 4px${m.ce.length && veuBase?"":";display:none"}">
      <span class="eyebrow">Cursos que es mostren</span>
      <select class="btn sm" style="min-height:32px;width:auto" onchange="up(p=>currDe(p,${jq(nom)}).filtre=this.value);renderPi()">
        <option value="auto" ${st.filtre!=="tots"?"selected":""}>Els del curs de l'alumne/a</option>
        <option value="tots" ${st.filtre==="tots"?"selected":""}>Tots els cursos ${prim?"de l'àrea":"de la matèria"}</option>
      </select>
      ${nsel?`<button class="btn sm ghost" onclick="buidaCriteris(${jq(nom)})">Buida la selecció</button>`:""}
    </div>
    ${vistes.map(f => panellFont(p, nom, f)).join("")}
    ${prim || vistes.length ? "" : `<p class="legal" style="margin:12px 0 0">Cap currículum obert. Activa l'etiqueta <b>ESO</b> o la de <b>primària</b> per triar-hi criteris d'avaluació.</p>`}
    ${prim || st.prim.length ? "" : `<p class="legal" style="margin:12px 0 0">Si cal ajustar els criteris a un nivell inferior, l'etiqueta <b>+ Primària</b> hi porta el currículum de l'àrea anàloga de l'annex 2. Les dues etapes poden estar obertes alhora i el que marquis a cadascuna es conserva.</p>`}
    ${notaFormatAnterior(p, nom)}
    <label class="field" style="margin:14px 0 6px"><span class="lbl">Criteris personalitzats o sabers afegits</span>
      <textarea onchange="desaPropis(${jq(nom)},this.value)" placeholder="Redacció personalitzada d'un criteri o saber, quan calgui apartar-se del text literal del decret.">${esc(st.propis)}</textarea></label>
    ${notaSabersInferiors(p, nom)}
   </div>`}</details>`;
}

/* Etiquetes de les fonts curriculars d'una matèria. Cada una obre i tanca el
   seu currículum per separat, i totes hi són sempre: se'n poden tenir dues
   d'obertes o cap. El nombre que porten diu quants elements s'hi han triat,
   que és el que fa curricular el pla —no pas tenir-hi el currículum a mà. */
function tagsCurriculars(p, nom, fonts, vistes){
  /* Un pla de primària té un sol currículum i cap etapa inferior d'on prendre
     res: la barra d'etiquetes no hi tindria on portar. */
  if(esPlaPrim(p)) return "";
  const etiqueta = f => {
    const prim = esPrim(f), on = vistes.includes(f), n = comptaFont(p, nom, f);
    /* La franja ja porta el nom de la matèria al capdamunt: l'etiqueta només
       ha de dir l'etapa, i l'àrea quan no es diu igual. */
    const txt = prim ? (areaPrim(f)===nom ? "Primària" : "Primària · "+esc(areaPrim(f))) : "ESO";
    return `<button class="curr-tab${prim?" prim":""}" aria-pressed="${on?"true":"false"}"
      title="${on?"Tanca":"Obre"} el currículum ${prim?`de primària de ${esc(areaPrim(f))}`:`d'ESO de ${esc(nom)}`}"
      onclick="commutaVista(${jq(nom)},${jq(f)})"><span class="tk">${on?"✓":"+"}</span>${txt}${n?`<span class="n">${n}</span>`:""}</button>`;
  };
  const st = currDe(p, nom);
  return `<div class="curr-tabs" role="group" aria-label="Currículums de ${esc(nom)}">
    ${fonts.map(etiqueta).join("")}
    ${st.prim.length
      ? `<button class="btn sm ghost" style="min-height:36px" onclick="dialegPrimaria(${jq(nom)})">Àrees de primària…</button>`
      : `<button class="btn sm ghost" style="min-height:36px" onclick="triaPrimaria(${jq(nom)})" title="Porta a aquesta matèria el currículum d'una àrea d'educació primària">+ Primària</button>`}
  </div>`;
}

/* Panell d'una font oberta. L'animació d'entrada es consumeix en pintar-se:
   si no, es repetiria a cada clic dins de la franja, que repinta tot el pas. */
function panellFont(p, nom, font){
  const k = claVista(nom, font);
  const anim = state.vistaAnim[k] || ""; delete state.vistaAnim[k];
  return `<div class="curr-pan${anim?" ent-"+anim:""}">${
    esInferior(p, font) ? blocPrimaria(p, nom, areaPrim(font)) : fontCurricular(p, nom, font)}</div>`;
}

/* Avís al peu de la franja: hi ha criteris o sabers d'un curs anterior al que
   fa l'alumne/a i, per tant, el pla consta com a curricular. */
function notaSabersInferiors(p, nom){
  const st = currDe(p, nom);
  const cr = criterisInferiors(p, nom), sb = sabersInferiors(p, nom);
  if(!cr.length && !sb.length) return "";
  const nivells = [...new Set(
    cr.map(k => etapaDe(fontDeClau(k)) + " · " + cursCriteri(st, k))
      .concat(sb.map(s => etapaDe(s.font) + " · " + (s.curs||"—"))))];
  const parts = [];
  if(cr.length) parts.push(`${cr.length} criteri${cr.length===1?"":"s"} d'avaluació`);
  if(sb.length) parts.push(`${sb.length} saber${sb.length===1?"":"s"}`);
  const un = cr.length + sb.length === 1;
  return `<p class="legal" style="margin:10px 0 0;color:var(--warn)">
    ${esc(parts.join(" i "))} d'aquesta ${esPlaPrim(p)?"àrea":"matèria"} ${un?"correspon":"corresponen"} a un nivell anterior al que fa l'alumne/a (${esc(p.de.curs||"—")}): ${esc(nivells.join("; "))}. Per això el pla consta com a <b>curricular</b>. L'alumne/a s'avalua d'acord amb els criteris i els sabers que hi consten, cosa que en cap cas pot suposar una limitació en les seves qualificacions.</p>`;
}

/* Restes dels plans desats amb el format anterior: la llista de sabers per
   matèria i el camp lliure d'etapa i curs. Ara els sabers i el nivell pengen
   de cada criteri, i això només hi és per no perdre res pel camí. */
function notaFormatAnterior(p, nom){
  const st = currDe(p, nom);
  const orfes = st.sabersSense || [], et = (st.etapa||"").trim();
  if(!orfes.length && !et) return "";
  return `<div class="note" style="margin-top:14px"><b>Del format anterior</b>
    ${et?`<div class="small" style="margin-top:5px">Etapa i curs del criteri d'avaluació: ${esc(et)}. Ara l'etapa i el curs surten de cada criteri triat i no cal escriure'ls.</div>`:""}
    ${orfes.length?`<div class="small" style="margin-top:5px">${orfes.length} saber${orfes.length===1?"":"s"} sense criteri d'avaluació assignat: ${esc(orfes.map(s=>s.t).join(" · "))}. Torna a triar-${orfes.length===1?"lo":"los"} amb el botó <b>Tria sabers</b> del criteri que li correspongui.</div>`:""}
    <div style="margin-top:8px"><button class="btn sm ghost" onclick="netejaFormatAnterior(${jq(nom)})">Treu-ho del pla</button></div></div>`;
}
function netejaFormatAnterior(nom){
  up(p => { const st = currDe(p, nom); st.sabersSense = []; delete st.etapa; });
  renderPi();
  toast("S'han tret del pla els elements del format anterior.");
}

/* Bloc d'una àrea de primària carregada dins d'una matèria. */
function blocPrimaria(p, nom, area){
  const font = idPrim(area), u = unitat(font);
  if(!u) return `<div class="note" style="margin-top:12px"><b>${esc(area)}</b>: aquesta àrea no consta al currículum de primària incorporat. <button class="btn sm" onclick="treuPrimaria(${jq(nom)},${jq(area)},true)">Treu-la del pla</button></div>`;
  const ep = elementsPrim(p, nom).criteris.filter(k => fontDeClau(k) === font).length;
  return `<div class="prim-box">
    <div class="prim-h">
      <span class="tag warn">Primària · annex 2</span>
      <b style="flex:1;min-width:120px">${esc(area)}</b>
      <span class="small muted">${esc(u.cursos)}${u.ref?" · mateix currículum que "+esc(u.ref):""}</span>
      ${ep?`<span class="sel-count prim">${ep} criteris</span>`:""}
      <button class="btn sm ghost" onclick="treuPrimaria(${jq(nom)},${jq(area)})">Treu-la</button>
    </div>
    ${fontCurricular(p, nom, font)}
  </div>`;
}

/* Competències, criteris i sabers d'una font (matèria de l'ESO o àrea de
   primària) dins de la franja d'una matèria del pla. Els sabers no es
   llisten aquí: pengen de cada criteri triat i es trien a la seva finestra. */
function fontCurricular(p, nom, font){
  const u = unitat(font);
  if(!u) return "";
  const st = currDe(p, nom);
  /* prim diu de quin annex surt el currículum; baix, si és d'una etapa
     anterior a la del pla. En un pla de primària l'annex 2 és el currículum
     propi de l'alumne/a i no s'ha de marcar com a nivell inferior. */
  const prim = esPrim(font);
  const baix = esInferior(p, font);
  /* El currículum d'una etapa inferior es veu sencer: si s'hi ha anat és
     precisament per triar el nivell que convé a l'alumne/a. El de la seva
     etapa es filtra pel curs que cursa mentre no es demani el contrari. */
  const visible = g => baix || st.filtre==="tots" || grupCoincideix(g.curs, p.de.curs, prim);
  return `${u.ce.map(c=>{
      const grups = c.grups.filter(visible);
      if(!grups.length) return "";
      const kce = claCE(nom, font, c.n);
      const adCE = st.adaptCE[kce] || "";
      const obCE = !!state.openAdapt[nom+"#CE#"+kce];
      return `<div style="margin-top:14px">
        <div style="display:flex;gap:8px;align-items:flex-start">
          <span class="cen" style="background:${baix?"var(--warn)":"var(--met)"}">CE${c.n}</span>
          <span class="ct" style="font-size:13.5px;line-height:1.5;flex:1">${esc(c.desc)}</span>
          <button class="btn sm ${adCE?"ok":"ghost"}" style="flex:0 0 auto" onclick="obreAdaptCE(${jq(nom)},${jq(kce)})">${adCE?"✓ Adaptada":"Adaptar"}</button></div>
        ${(obCE || adCE) ? `<div class="adapt-box">
          <label class="lbl">Redacció adaptada de la competència específica CE${c.n}${baix?" de primària":""}</label>
          <textarea placeholder="Escriu aquí com queda formulada aquesta competència específica per a l'alumne/a. Si hi escrius text, el pla passa a ser curricular." onchange="desaAdaptCE(${jq(nom)},${jq(kce)},this.value)">${esc(adCE)}</textarea>
        </div>` : ""}
        ${grups.map(g=>`
          <div class="curs-lbl">Criteris d'avaluació · ${baix?"Primària · ":""}${esc(g.curs)}</div>
          ${g.items.map(i=>{
            const key = claCrit(font, i.c, g.curs);
            const on = st.criteris.includes(key);
            const ad = st.adapt[key] || "";
            const ac = st.accions[key] || "";
            const ob = !!state.openAdapt[key];
            const sb = sabersDe(st, key);
            /* Cursos que abasta el bloc del decret: si n'hi ha més d'un, el
               docent tria de quin pren el criteri. */
            const opcC = cursosOpcions(font, g.curs);
            const cc = cursCriteri(st, key);
            return `<div class="crit ${on?"on":""} ${baix?"prim":""}"><input type="checkbox" ${on?"checked":""} onchange="toggleCriteri(${jq(nom)},${jq(key)})" aria-label="Criteri d'avaluació ${esc(i.c)}${baix?" de primària":""}">
              <span class="code" title="Criteri d'avaluació ${esc(i.c)} · ${prim?"annex 2 (primària)":"annex 3"} del Decret 175/2022">${i.c}</span><span class="ct">${esc(i.t)}
              ${on ? `<div class="crit-tools">
                ${opcC.length > 1 ? `<span class="eyebrow">Curs</span>
                <select class="btn sm" style="min-height:32px;width:auto" title="De quin curs es pren aquest criteri d'avaluació (${esc(etapaDe(font))}). És el que surt a la columna «Etapa i curs del criteri» del document." onchange="canviaCursCrit(${jq(nom)},${jq(key)},this.value)">
                  <option value="${esc(g.curs)}" ${cc===g.curs?"selected":""}>${esc(g.curs)}</option>
                  ${opcC.map(o=>`<option value="${esc(o)}" ${cc===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`
                : `<span class="tag ${baix?"warn":"met"}" title="Etapa i curs d'aquest criteri d'avaluació">${esc(etapaDe(font))} · ${esc(cc)}</span>`}
                ${criteriInferior(p, st, key) ? `<span class="tag warn" title="És d'un curs anterior al que fa l'alumne/a: el pla passa a ser curricular">Curs anterior</span>` : ""}
                <select class="btn sm" style="min-height:32px;width:auto" onchange="desaAccio(${jq(nom)},${jq(key)},this.value)">
                  <option value="">Acció sobre el criteri…</option>
                  ${ACCIONS_CURR.map(x=>`<option ${ac===x?"selected":""}>${x}</option>`).join("")}</select>
                <button class="btn sm ${ad?"ok":"ghost"}" onclick="obreAdapt(${jq(key)})">${ad?"✓ Adaptat":"Adaptar"}</button>
                <button class="btn sm ${sb.length?"tria":"ghost"}" onclick="obreSabers(${jq(nom)},${jq(key)})">${sb.length?`✓ ${sb.length} saber${sb.length===1?"":"s"}`:"Tria sabers"}</button>
                ${ac && ac!=="Mantenir sense canvis" ? `<span class="tag con">${esc(ac)}</span>` : ""}
              </div>
              ${sb.length ? `<div class="sab-tria">${sb.map(s=>`<span class="sab-chip${saberInferior(p,s)?" baix":""}">${esc(s.t)}<b>${esc(etapaDe(s.font))} · ${esc(s.curs||"—")}</b></span>`).join("")}</div>` : ""}
              ${(ob || ad) ? `<div class="adapt-box">
                <label class="lbl">Redacció adaptada del criteri ${esc(i.c)}</label>
                <textarea placeholder="Escriu com queda formulat aquest criteri d'avaluació per a l'alumne/a. Si hi escrius text, el pla passa a ser curricular." onchange="desaAdapt(${jq(nom)},${jq(key)},this.value)">${esc(ad)}</textarea>
                <p class="legal" style="margin:6px 0 0">Text original (${baix?"primària · ":""}${esc(g.curs)}): ${esc(i.t)}</p>
              </div>` : ""}` : ""}
              </span></div>`;
          }).join("")}`).join("")}
      </div>`;
    }).join("")}`;
}

/* Buidar la selecció d'una matèria se'n emporta els sabers i les redaccions
   adaptades dels criteris: sempre es demana confirmació amb el detall. */
async function buidaCriteris(nom){
  const st = currDe(P(), nom);
  const nc = st.criteris.length;
  if(!nc) return;
  const ns = totsSabers(st).length;
  const na = Object.values(st.adapt).filter(v => (v||"").trim()).length;
  const nx = Object.values(st.accions).filter(v => v && v !== "Mantenir sense canvis").length;
  const punts = [`<b>${nc}</b> criteri${nc===1?"":"s"} d'avaluació ${nc===1?"triat":"triats"}`];
  if(ns) punts.push(`<b>${ns}</b> saber${ns===1?"":"s"} que en ${ns===1?"penja":"pengen"}`);
  if(na) punts.push(`<b>${na}</b> redacció${na===1?"":"ns"} adaptada${na===1?"":"es"} de criteris`);
  if(nx) punts.push(`<b>${nx}</b> acci${nx===1?"ó":"ons"} sobre els criteris`);
  if(!await confirmaEsborrat(`Buida la selecció de ${nom}`,
        `Es traurà del pla tot el que hi ha triat a <b>${esc(nom)}</b>, de totes dues etapes:`,
        punts,
        {confirma:"Buida la selecció",
         peu:"Les competències específiques adaptades, els criteris personalitzats i les àrees de primària carregades no es toquen."})) return;
  up(p => { const s = currDe(p, nom); s.criteris = []; s.accions = {}; s.adapt = {}; s.sabersCrit = {}; s.cursCrit = {}; });
  renderPi();
  toast(`S'ha buidat la selecció de ${nom}.`);
}
function obreAdapt(key){ state.openAdapt[key] = !state.openAdapt[key]; renderPi(); }
function obreAdaptCE(nom, kce){ const k = nom+"#CE#"+kce; state.openAdapt[k] = !state.openAdapt[k]; renderPi(); }
function desaAdapt(nom, key, v){ up(p => currDe(p, nom).adapt[key] = v); revisaTipusPI(); renderPi(); }
function desaAdaptCE(nom, kce, v){ up(p => currDe(p, nom).adaptCE[kce] = v); revisaTipusPI(); renderPi(); }
function desaAccio(nom, key, v){ up(p => currDe(p, nom).accions[key] = v); revisaTipusPI(); renderPi(); }
function desaPropis(nom, v){ up(p => currDe(p, nom).propis = v); revisaTipusPI(); renderPi(); }
function toggleCriteri(nom, key){
  up(p => { const st = currDe(p, nom), s = st.criteris, i = s.indexOf(key);
    if(i>=0){ s.splice(i,1); delete st.adapt[key]; delete st.accions[key]; delete st.sabersCrit[key]; delete st.cursCrit[key]; }
    else s.push(key); });
  revisaTipusPI();      /* triar un criteri d'un nivell inferior ja fa curricular el pla */
  renderPi();
}

