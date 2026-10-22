/* ---------- Edició del document a la previsualització ----------
   El document es genera a partir del pla, però abans d'imprimir-lo sovint cal
   retocar-ne un text o afegir-hi un matís que no té lloc a cap pas. Cada
   apartat —i la capçalera i el peu— porta un llapis al costat de l'ull: en
   clicar-lo, aquell apartat es pot editar directament, i el llapis passa a
   ser un ✓ que l'acaba. Només n'hi ha un d'obert alhora: obrir-ne un altre
   desa el que s'estava editant. Un apartat retocat porta, a més, una fletxa
   per tornar-lo a generar a partir del pla. Els apartats no s'eliminen:
   s'amaguen de la impressió amb l'ull (52-document-ocults.js).

   Les edicions es desen per apartats (p.docEdit):
     seccions  {clau: html}  apartats retocats a mà, tal com han quedat
   Cada apartat del document porta la seva clau a data-sec. Un apartat que no
   s'ha tocat continua viu i reflecteix sempre el pla; un de retocat queda fix
   fins que es restaura. L'única excepció és la columna «Avaluació» dels
   objectius, que ve del seguiment i es refà sempre, també en un apartat
   retocat.

   Els números dels apartats no es desen enlloc: es posen en muntar el
   document, per ordre, de manera que són consecutius encara que se n'amaguin
   o se n'hi afegeixin. Els apartats amagats i l'annex no es numeren.

   Tot el que és eina (botons, avisos) porta la classe doc-eina i no s'imprimeix
   ni es desa. */
/* Clau (data-sec) de l'apartat que s'està editant, o false. */
let docEditant = false;
let desaDocTimer = null;

const NUM_APARTAT = /^\s*\d+\s*[.)]\s*/;
const NOM_SECCIO_FIX = {cap:"Capçalera del document", peu:"Peu del document"};

/* Cos del document: el generat a partir del pla, amb les edicions a sobre i
   els apartats numerats. */
function muntaDocCos(p, a){
  const t = document.createElement("template");
  t.innerHTML = docCos(p, a);
  migraDocEdit(p, t.content);
  migraTretsDoc(p);
  const ed = p.docEdit;
  if(ed){
    [...t.content.querySelectorAll("[data-sec]")].forEach(el => {
      const k = el.dataset.sec;
      if((ed.seccions || {})[k] != null){
        el.innerHTML = netejaHtmlDoc(ed.seccions[k]);
        el.dataset.editat = "1";
      }
    });
    const so = t.content.querySelector('[data-sec="objectius"][data-editat]');
    if(so) refrescaAvaluacio(so, p);
  }
  numeraDoc(t.content, seccionsOcultes(p));
  decoraOcults(t.content, p);
  decoraEdicio(t.content);
  return t.innerHTML;
}

/* Llapis de cada apartat i, als retocats, la fletxa per restaurar-los. Als
   apartats amb títol van dins del títol, al costat de l'ull; a la capçalera i
   al peu, que no en tenen, van al marge. */
function decoraEdicio(arrel){
  arrel.querySelectorAll("[data-sec]").forEach(el => {
    const k = el.dataset.sec, on = docEditant === k;
    const que = NOM_SECCIO_FIX[k] ? (k === "cap" ? "la capçalera" : "el peu") : "aquest apartat";
    const t = on ? `Acaba d'editar ${que}` : `Edita ${que}`;
    const eines = `<button type="button" class="doc-ull doc-llapis doc-eina no-print${on?" on":""}" contenteditable="false"
      onclick="editaSeccioDoc(${jq(k)})" title="${t}" aria-label="${t}" aria-pressed="${on}"><span class="msym" aria-hidden="true">${on ? "&#xe5ca;" : "&#xe3c9;"}</span></button>`
      + (el.dataset.editat ? `<button type="button" class="doc-ull doc-restaura doc-eina no-print" contenteditable="false"
      onclick="restauraSeccioDoc(${jq(k)})" title="Torna a generar ${que} a partir del pla" aria-label="Torna a generar ${que} a partir del pla"><span class="msym" aria-hidden="true">&#xe166;</span></button>` : "");
    const h = el.matches("section") ? el.querySelector("h2") : null;
    if(h) h.insertAdjacentHTML("beforeend", eines);
    else el.insertAdjacentHTML("afterbegin", `<span class="doc-eines-solt doc-eina no-print" contenteditable="false">${eines}</span>`);
  });
}

/* Numera els apartats per ordre: 1, 2, 3… L'annex i els apartats que no
   s'imprimeixen queden sense número. */
function numeraDoc(arrel, ocultes){
  let n = 0;
  arrel.querySelectorAll("section[data-sec]").forEach(sec => {
    const h = sec.querySelector("h2");
    if(!h) return;
    const text = h.textContent.replace(NUM_APARTAT, "");
    h.textContent = sec.dataset.annex || ocultes.includes(sec.dataset.sec) ? text : `${++n}. ${text}`;
  });
}

/* Els apartats eliminats amb la versió anterior d'aquesta eina (docEdit.trets)
   passen a ser apartats amagats a la impressió, que es poden tornar a mostrar. */
function migraTretsDoc(p){
  const ed = p.docEdit;
  if(!ed || ed.html != null || !(ed.trets || []).length) return;
  const oc = ocultsDoc(p);
  oc.seccions = [...new Set((oc.seccions || []).concat(ed.trets))];
  p.docOcult = oc;
  delete ed.trets;
  if(!Object.keys(ed.seccions || {}).length) p.docEdit = null;
  desa();
}

/* Contingut d'un apartat tal com es desa: sense eines ni número. */
function htmlSeccio(el){
  const c = el.cloneNode(true);
  c.querySelectorAll(".doc-eina").forEach(x => x.remove());
  [c, ...c.querySelectorAll("*")].forEach(x => {
    x.removeAttribute("contenteditable"); x.removeAttribute("spellcheck");
    x.classList.remove("doc-ocult", "doc-pantalla", "doc-ulls", "doc-ull-cel", "doc-sec-oculta", "doc-bloc-ocult");
    if(x.getAttribute("class") === "") x.removeAttribute("class");
  });
  const h = c.querySelector("h2");
  if(h) h.textContent = h.textContent.replace(NUM_APARTAT, "");
  return c.innerHTML;
}

/* Apartats del document generat ara mateix, per clau. */
function seccionsFresques(p){
  const t = document.createElement("template");
  t.innerHTML = docCos(p, alumne(p.alumneId));
  const out = {};
  t.content.querySelectorAll("[data-sec]").forEach(el => {
    const h = el.querySelector("h2");
    out[el.dataset.sec] = {html: htmlSeccio(el),
      nom: NOM_SECCIO_FIX[el.dataset.sec] || (h ? h.textContent.replace(NUM_APARTAT, "") : el.dataset.sec)};
  });
  return out;
}

/* Els documents editats amb la primera versió d'aquesta eina es desaven
   sencers, en un sol bloc (docEdit.html). Es reparteixen per apartats
   reconeixent-los pel títol; els que no hi són es donen per eliminats. Els
   objectius i l'annex es tornen a generar perquè hi arribi el seguiment. */
function migraDocEdit(p, fresc){
  const ed = p.docEdit;
  if(!ed || ed.html == null) return;
  const vell = document.createElement("template");
  vell.innerHTML = netejaHtmlDoc(ed.html);
  const perTitol = {};
  vell.content.querySelectorAll("section").forEach(sec => {
    const h = sec.querySelector("h2");
    if(h) perTitol[h.textContent.replace(NUM_APARTAT, "").trim()] = sec;
  });
  const nou = {seccions:{}, trets:[], data: ed.data || avui()};
  fresc.querySelectorAll("[data-sec]").forEach(el => {
    const k = el.dataset.sec, h = el.querySelector("h2");
    if(k === "objectius" || k === "annex") return;
    const v = k === "cap" ? vell.content.querySelector(".head")
            : k === "peu" ? vell.content.querySelector(".foot")
            : perTitol[h ? h.textContent.replace(NUM_APARTAT, "").trim() : ""];
    if(!v){ if(k !== "cap" && k !== "peu") nou.trets.push(k); return; }
    const hv = htmlSeccio(v);
    if(hv !== htmlSeccio(el)) nou.seccions[k] = hv;
  });
  p.docEdit = (Object.keys(nou.seccions).length || nou.trets.length) ? nou : null;
  migraTretsDoc(p);
  desa();
}

/* La columna «Avaluació» d'un apartat d'objectius retocat a mà: es refà
   amb el seguiment d'ara, fila per fila. */
function refrescaAvaluacio(sec, p){
  const taula = sec.querySelector("table");
  if(!taula) return;
  const amb = p.objectius.some(o => valoracionsObj(p, o).length);
  const fc = taula.querySelector("thead tr");
  let th = fc && fc.querySelector("th[data-aval]");
  if(amb && fc && !th){
    th = document.createElement("th");
    th.dataset.aval = ""; th.dataset.col = "aval"; th.style.width = "17%"; th.textContent = "Avaluació";
    fc.appendChild(th);
  }
  if(!amb && th) th.remove();
  taula.querySelectorAll("tbody tr[data-obj]").forEach(tr => {
    const o = p.objectius.find(x => x.id === tr.dataset.obj);
    let td = tr.querySelector("td[data-aval]");
    if(!amb){ if(td) td.remove(); return; }
    if(!td){ td = document.createElement("td"); td.dataset.aval = ""; td.dataset.col = "aval"; tr.appendChild(td); }
    td.innerHTML = o ? cellaAssolimentDoc(p, o) : "—";
  });
}

/* Franja d'eines del document: no s'imprimeix. */
function einesDoc(p){
  if(p.docEdit && p.docEdit.html != null){
    const t = document.createElement("template");
    t.innerHTML = docCos(p, alumne(p.alumneId));
    migraDocEdit(p, t.content);
  }
  migraTretsDoc(p);
  const ed = p.docEdit && p.docEdit.html == null ? p.docEdit : null;
  const noms = ed ? seccionsFresques(p) : {};
  const nom = k => esc((noms[k] && noms[k].nom) || k);
  const editats = ed ? Object.keys(ed.seccions || {}).filter(k => noms[k]) : [];
  return `<div class="doc-tools no-print">
    <span class="eyebrow">Edició del document</span>
    ${docEditant ? `<button class="btn sm primary" onclick="acabaEdicioDoc()">Acaba l'edició</button>` : ""}
    ${editats.length ? `<button class="btn sm ghost danger" onclick="descartaEdicioDoc()">Descarta totes les edicions</button>` : ""}
    ${p.docOcult ? `<button class="btn sm ghost" onclick="mostraTotDoc()">Torna a imprimir-ho tot</button>` : ""}
    <span class="legal" style="flex-basis:100%;margin:0">${docEditant
      ? "Clica el text de l'apartat marcat per canviar-lo; els canvis es desen sols. Amb el ✓ del títol, o amb el llapis d'un altre apartat, acabes aquesta edició."
      : `Amb el llapis <span class="msym doc-llegenda" aria-hidden="true">&#xe3c9;</span> de cada apartat en pots retocar el text abans d'imprimir-lo; les edicions es desen amb el pla. Amb l'ull <span class="msym doc-llegenda" aria-hidden="true">&#xe8f4;</span> d'un apartat, una fila, una columna o el segell l'amagues de la impressió, i els números dels apartats es refan sols.`}</span>
    ${editats.length ? `<div class="doc-edits"><span class="small"><b>Retocats a mà</b> (no reflecteixen els canvis posteriors del pla, tret de la columna «Avaluació»):</span>
      ${editats.map(k => `<span class="logo-chip"><span class="small">${nom(k)}</span>
        <button class="btn sm ghost pag" title="Torna a generar aquest apartat a partir del pla" onclick="restauraSeccio(${jq(k)})">Restaura</button></span>`).join("")}</div>` : ""}
  </div>`;
}

/* Eines que es posen sobre el document ja pintat, generat o editat a mà:
   el botó de la graella de mesures i, si cal, el mode d'edició. */
function decoraDoc(){
  posaBotoMesures();
  aplicaEdicioDoc();
}

/* Botó de la graella de mesures, just a sota del títol de l'apartat 5. No
   forma part del document: es torna a posar a cada repintat, no es desa mai
   amb les edicions (és doc-eina) i no s'imprimeix (és no-print). */
function posaBotoMesures(){
  const cos = $("#doc-cos"), p = pi(state.docPi);
  if(!cos || !p) return;
  const taula = graellaMesuresDe(cos);
  const sec = taula && taula.closest("section");
  if(!sec || sec.querySelector(".doc-mesures-eina")) return;
  const d = document.createElement("div");
  d.className = "doc-mesures-eina doc-eina no-print";
  d.contentEditable = "false";
  const ambEstr = p.adaptacions.some(esEstrategiaPla);
  d.innerHTML = (ambEstr ? `<button type="button" class="btn sm ghost" aria-pressed="${estrategiesApart(p)}" onclick="commutaEstrategiesApart()"
      title="Les estratègies metodològiques triades del banc poden anar en una taula pròpia, agrupades per categoria, o dins de la graella de mesures">${
    estrategiesApart(p) ? "Posa les estratègies dins de la graella de mesures" : "Mostra les estratègies en una graella independent"}</button>` : "")
    + `<button type="button" class="btn sm ghost" aria-pressed="${!!p.docMesuresSimples}" onclick="commutaMesuresSimples()">${
    p.docMesuresSimples ? "Mostra la redacció de cada mesura" : "Mostra només els títols de les mesures"}</button>`;
  const h = sec.querySelector("h2");
  if(h) h.after(d); else sec.insertBefore(d, sec.firstChild);
}

/* Fa editable l'apartat que s'està editant, si n'hi ha cap. */
const seccioDoc = (cos, k) => [...cos.querySelectorAll("[data-sec]")].find(x => x.dataset.sec === k);
function aplicaEdicioDoc(){
  const cos = $("#doc-cos");
  if(!cos || !docEditant) return;
  const el = seccioDoc(cos, docEditant);
  if(!el){ docEditant = false; return; }
  el.setAttribute("contenteditable", "true");
  el.setAttribute("spellcheck", "true");
  el.oninput = () => { cos.dataset.tocat = "1"; clearTimeout(desaDocTimer); desaDocTimer = setTimeout(desaEdicioDoc, 400); };
}

/* El llapis d'un apartat: l'obre per editar o, si ja ho estava, l'acaba. */
function editaSeccioDoc(k){
  const acaba = docEditant === k;
  if(docEditant) buidaEdicioDoc();
  docEditant = acaba ? false : k;
  refrescaDoc();
  if(acaba){ toast("Edició acabada. Els canvis queden desats."); return; }
  const cos = $("#doc-cos"), el = cos && seccioDoc(cos, k);
  if(el){ el.focus({preventScroll:true}); el.scrollIntoView({block:"nearest", behavior:"smooth"}); }
  toast("Clica el text de l'apartat per canviar-lo. Els canvis es desen sols.");
}
function acabaEdicioDoc(){ if(docEditant) editaSeccioDoc(docEditant); }

/* La fletxa d'un apartat retocat: com «Restaura» de la franja, però amb
   confirmació, perquè és una icona petita al costat del llapis. */
async function restauraSeccioDoc(k){
  if(!await confirma("Torna a generar l'apartat",
       "Es perdran els canvis fets a mà en aquest apartat i tornarà a reflectir el que diu el pla.",
       {confirma:"Torna'l a generar", perillos:true})) return;
  restauraSeccio(k);
}

/* Desa com a retocats els apartats que ara no coincideixen amb el que es
   generaria a partir del pla. Un apartat que es torna a deixar igual deixa de
   comptar com a retocat. */
function desaEdicioDoc(){
  const p = pi(state.docPi), cos = $("#doc-cos");
  if(!p || !cos || !cos.dataset.tocat) return;
  const fresc = seccionsFresques(p);
  const ed = (p.docEdit && p.docEdit.html == null) ? p.docEdit : {seccions:{}};
  ed.seccions = ed.seccions || {};
  cos.querySelectorAll("[data-sec]").forEach(el => {
    const k = el.dataset.sec, h = htmlSeccio(el);
    if(fresc[k] && h === fresc[k].html) delete ed.seccions[k];
    else ed.seccions[k] = h;
  });
  ed.data = avui();
  p.docEdit = Object.keys(ed.seccions).length ? ed : null;
  desa();
}
/* Desa el que hi hagi pendent de l'edició en curs. */
function buidaEdicioDoc(){ clearTimeout(desaDocTimer); desaEdicioDoc(); }

/* Torna un apartat retocat al que es genera a partir del pla. */
function restauraSeccio(k){
  const p = pi(state.docPi);
  if(!p || !p.docEdit) return;
  buidaEdicioDoc();
  const ed = p.docEdit;
  if(ed.seccions) delete ed.seccions[k];
  if(!Object.keys(ed.seccions || {}).length) p.docEdit = null;
  desa();
  refrescaDoc();
  toast("Apartat restaurat a partir del pla.");
}

async function descartaEdicioDoc(){
  const p = pi(state.docPi);
  if(!p || !p.docEdit) return;
  const ok = await confirma("Descarta totes les edicions",
    "El document tornarà a generar-se sencer a partir del pla i es perdran tots els canvis fets a mà a la previsualització. El que s'ha amagat de la impressió continua amagat.",
    {confirma:"Descarta-les", perillos:true});
  if(!ok) return;
  clearTimeout(desaDocTimer);
  p.docEdit = null;
  docEditant = false;
  desa();
  refrescaDoc();
  toast("Edicions descartades. El document torna a reflectir el pla.");
}

/* Commuta la graella de mesures entre la completa i la que només en porta els
   títols. El botó el posa posaBotoMesures() a cada repintat, perquè hi sigui
   sempre, també mentre s'edita. Si l'apartat s'ha retocat a mà, només se'n
   refà la graella: la resta del text es respecta. */
function commutaMesuresSimples(){
  const p = pi(state.docPi);
  if(!p) return;
  if(docEditant) buidaEdicioDoc();
  p.docMesuresSimples = !p.docMesuresSimples;
  refaGraellesMesures(p);
  desa();
  refrescaDoc();
  toast(p.docMesuresSimples ? "Graella de mesures amb només els títols." : "Graella de mesures amb la redacció completa.");
}
/* Estratègies metodològiques en una taula pròpia o dins de la graella de
   mesures. Mateix criteri que la graella simplificada: en un apartat retocat
   a mà només es refan les dues graelles. */
function commutaEstrategiesApart(){
  const p = pi(state.docPi);
  if(!p) return;
  if(docEditant) buidaEdicioDoc();
  p.docEstrategiesApart = !estrategiesApart(p);
  refaGraellesMesures(p);
  desa();
  refrescaDoc();
  toast(estrategiesApart(p) ? "Estratègies en una graella independent, per categories." : "Estratègies dins de la graella de mesures.");
}
/* En un apartat 5 retocat a mà, refà la graella de mesures i la de les
   estratègies a partir del pla i respecta la resta del text. */
function refaGraellesMesures(p){
  const ed = p.docEdit;
  if(!ed || !ed.seccions || ed.seccions.mesures == null) return;
  const t = document.createElement("template");
  t.innerHTML = ed.seccions.mesures;
  const taula = graellaMesuresDe(t.content);
  if(!taula) return;
  let tb = taula.querySelector("tbody");
  if(!tb){ tb = document.createElement("tbody"); taula.appendChild(tb); }
  tb.innerHTML = filesMesuresDoc(p);
  t.content.querySelectorAll('div[data-doc="estrategies"]').forEach(x => x.remove());
  if(estrategiesApart(p)) taula.insertAdjacentHTML("afterend", blocEstrategiesDoc(p));
  ed.seccions.mesures = t.innerHTML;
}
/* La graella de mesures dins d'un document desat. Els documents editats abans
   que la taula portés la marca data-doc es reconeixen pel títol de l'apartat. */
function graellaMesuresDe(arrel){
  const t = arrel.querySelector('table[data-doc="mesures"]');
  if(t) return t;
  const s = [...arrel.querySelectorAll("section")].find(x => {
    const h = x.querySelector("h2");
    return h && /Mesures i suports/i.test(h.textContent);
  });
  return s ? s.querySelector("table") : null;
}

/* El text desat torna a entrar al document amb innerHTML. Pot venir d'una
   còpia de seguretat importada, així que abans se'n treu tot el que podria
   executar codi: elements actius, gestors d'esdeveniments i enllaços
   javascript:. */
function netejaHtmlDoc(html){
  const t = document.createElement("template");
  t.innerHTML = String(html || "");
  t.content.querySelectorAll("script,style,iframe,frame,object,embed,link,meta,base,form,input,button,textarea,select,svg,math")
    .forEach(x => x.remove());
  t.content.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(at => {
      const n = at.name.toLowerCase(), v = at.value.replace(/\s+/g, "").toLowerCase();
      if(n.startsWith("on") || n === "contenteditable" || n === "srcdoc") el.removeAttribute(at.name);
      else if((n === "href" || n === "src" || n === "action" || n === "formaction" || n.endsWith(":href"))
              && (v.startsWith("javascript:") || v.startsWith("vbscript:")
                  || (v.startsWith("data:") && !v.startsWith("data:image/")))) el.removeAttribute(at.name);
    });
  });
  return t.innerHTML;
}

