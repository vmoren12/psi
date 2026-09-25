/* ---------- Edició del document a la previsualització ----------
   El document es genera a partir del pla, però abans d'imprimir-lo sovint cal
   retocar-ne un text, treure'n un apartat o afegir-hi un matís que no té lloc
   a cap pas. En mode d'edició, el cos del document és editable directament i
   cada apartat porta un botó per eliminar-lo.

   Les edicions es desen per apartats (p.docEdit):
     seccions  {clau: html}  apartats retocats a mà, tal com han quedat
     trets     [clau]        apartats eliminats del document
   Cada apartat del document porta la seva clau a data-sec. Un apartat que no
   s'ha tocat continua viu i reflecteix sempre el pla; un de retocat queda fix
   fins que es restaura. L'única excepció és la columna «Avaluació» dels
   objectius, que ve del seguiment i es refà sempre, també en un apartat
   retocat.

   Els números dels apartats no es desen enlloc: es posen en muntar el
   document, per ordre, de manera que són consecutius encara que se n'eliminin
   o se n'hi afegeixin. L'annex no es numera.

   Tot el que és eina (botons, avisos) porta la classe doc-eina i no s'imprimeix
   ni es desa. */
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
  const ed = p.docEdit;
  if(ed){
    [...t.content.querySelectorAll("[data-sec]")].forEach(el => {
      const k = el.dataset.sec;
      if((ed.trets || []).includes(k)) el.remove();
      else if((ed.seccions || {})[k] != null){
        el.innerHTML = netejaHtmlDoc(ed.seccions[k]);
        el.dataset.editat = "1";
      }
    });
    const so = t.content.querySelector('[data-sec="objectius"][data-editat]');
    if(so) refrescaAvaluacio(so, p);
  }
  numeraDoc(t.content);
  decoraOcults(t.content, p);
  return t.innerHTML;
}

/* Numera els apartats per ordre: 1, 2, 3… L'annex queda sense número. */
function numeraDoc(arrel){
  let n = 0;
  arrel.querySelectorAll("section[data-sec]").forEach(sec => {
    const h = sec.querySelector("h2");
    if(!h) return;
    const text = h.textContent.replace(NUM_APARTAT, "");
    h.textContent = sec.dataset.annex ? text : `${++n}. ${text}`;
  });
}

/* Contingut d'un apartat tal com es desa: sense eines ni número. */
function htmlSeccio(el){
  const c = el.cloneNode(true);
  c.querySelectorAll(".doc-eina").forEach(x => x.remove());
  [c, ...c.querySelectorAll("*")].forEach(x => {
    x.removeAttribute("contenteditable"); x.removeAttribute("spellcheck");
    x.classList.remove("doc-ocult", "doc-pantalla");
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
  const ed = p.docEdit && p.docEdit.html == null ? p.docEdit : null;
  const noms = ed ? seccionsFresques(p) : {};
  const nom = k => esc((noms[k] && noms[k].nom) || k);
  const editats = ed ? Object.keys(ed.seccions || {}).filter(k => noms[k]) : [];
  const trets = ed ? (ed.trets || []).filter(k => noms[k]) : [];
  return `<div class="doc-tools no-print">
    <span class="eyebrow">Edició del document</span>
    ${docEditant
      ? `<button class="btn sm primary" onclick="commutaEdicioDoc(false)">Acaba l'edició</button>`
      : `<button class="btn sm" onclick="commutaEdicioDoc(true)">Edita el document</button>`}
    ${editats.length || trets.length ? `<button class="btn sm ghost danger" onclick="descartaEdicioDoc()">Descarta totes les edicions</button>` : ""}
    <span class="legal" style="flex-basis:100%;margin:0">${docEditant
      ? "Clica qualsevol text per canviar-lo. Amb el botó <b>×</b> de cada apartat l'elimines sencer. Els canvis es desen sols, i els números dels apartats es refan sols."
      : "Pots retocar qualsevol text del document, o eliminar-ne apartats, abans d'imprimir-lo. Les edicions es desen amb el pla."}</span>
    ${editats.length ? `<div class="doc-edits"><span class="small"><b>Retocats a mà</b> (no reflecteixen els canvis posteriors del pla, tret de la columna «Avaluació»):</span>
      ${editats.map(k => `<span class="logo-chip"><span class="small">${nom(k)}</span>
        <button class="btn sm ghost pag" title="Torna a generar aquest apartat a partir del pla" onclick="restauraSeccio(${jq(k)})">Restaura</button></span>`).join("")}</div>` : ""}
    ${trets.length ? `<div class="doc-edits"><span class="small"><b>Eliminats:</b></span>
      ${trets.map(k => `<span class="logo-chip"><span class="small">${nom(k)}</span>
        <button class="btn sm ghost pag" title="Torna a posar aquest apartat al document" onclick="restauraSeccio(${jq(k)})">Recupera</button></span>`).join("")}</div>` : ""}
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
  d.innerHTML = `<button type="button" class="btn sm ghost" aria-pressed="${!!p.docMesuresSimples}" onclick="commutaMesuresSimples()">${
    p.docMesuresSimples ? "Mostra la redacció de cada mesura" : "Mostra només els títols de les mesures"}</button>`;
  const h = sec.querySelector("h2");
  if(h) h.after(d); else sec.insertBefore(d, sec.firstChild);
}

/* Activa o desactiva l'edició sobre el document que hi ha pintat ara. */
function aplicaEdicioDoc(){
  const cos = $("#doc-cos");
  if(!cos) return;
  if(!docEditant){ cos.removeAttribute("contenteditable"); return; }
  cos.setAttribute("contenteditable", "true");
  cos.setAttribute("spellcheck", "true");
  cos.querySelectorAll(":scope > section").forEach(s => {
    if(s.querySelector(":scope > .doc-treu")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "doc-treu doc-eina no-print";
    b.contentEditable = "false";
    b.title = "Elimina aquest apartat del document";
    b.setAttribute("aria-label", b.title);
    b.textContent = "×";
    b.onclick = () => treuApartatDoc(s);
    s.insertBefore(b, s.firstChild);
  });
  cos.oninput = () => { cos.dataset.tocat = "1"; clearTimeout(desaDocTimer); desaDocTimer = setTimeout(desaEdicioDoc, 400); };
}

function commutaEdicioDoc(on){
  if(!on) buidaEdicioDoc();
  docEditant = !!on;
  refrescaDoc();
  if(on) toast("Mode d'edició: clica qualsevol text del document per canviar-lo.");
  else toast("Edició acabada.");
}

/* Desa com a retocats els apartats que ara no coincideixen amb el que es
   generaria a partir del pla. Un apartat que es torna a deixar igual deixa de
   comptar com a retocat. */
function desaEdicioDoc(){
  const p = pi(state.docPi), cos = $("#doc-cos");
  if(!p || !cos || !cos.dataset.tocat) return;
  const fresc = seccionsFresques(p);
  const ed = (p.docEdit && p.docEdit.html == null) ? p.docEdit : {seccions:{}, trets:[]};
  ed.seccions = ed.seccions || {}; ed.trets = ed.trets || [];
  cos.querySelectorAll("[data-sec]").forEach(el => {
    const k = el.dataset.sec, h = htmlSeccio(el);
    if(fresc[k] && h === fresc[k].html) delete ed.seccions[k];
    else ed.seccions[k] = h;
  });
  ed.data = avui();
  p.docEdit = (Object.keys(ed.seccions).length || ed.trets.length) ? ed : null;
  desa();
}
/* Desa el que hi hagi pendent de l'edició en curs. */
function buidaEdicioDoc(){ clearTimeout(desaDocTimer); desaEdicioDoc(); }

async function treuApartatDoc(s){
  const h = s.querySelector("h2");
  const ok = await confirma("Elimina l'apartat",
    `Es traurà del document l'apartat <b>${esc(h ? h.textContent : "")}</b>. El pla no canvia, i el pots recuperar des de la franja d'edició.`,
    {confirma:"Elimina'l", perillos:true});
  if(!ok) return;
  buidaEdicioDoc();
  const p = pi(state.docPi);
  const ed = p.docEdit = (p.docEdit && p.docEdit.html == null) ? p.docEdit : {seccions:{}, trets:[]};
  ed.trets = ed.trets || [];
  if(!ed.trets.includes(s.dataset.sec)) ed.trets.push(s.dataset.sec);
  ed.data = avui();
  desa();
  refrescaDoc();
}

/* Torna un apartat al que es genera a partir del pla, tant si s'havia
   retocat com si s'havia eliminat. */
function restauraSeccio(k){
  const p = pi(state.docPi);
  if(!p || !p.docEdit) return;
  buidaEdicioDoc();
  const ed = p.docEdit;
  if(ed.seccions) delete ed.seccions[k];
  ed.trets = (ed.trets || []).filter(x => x !== k);
  if(!Object.keys(ed.seccions || {}).length && !ed.trets.length) p.docEdit = null;
  desa();
  refrescaDoc();
  toast("Apartat restaurat a partir del pla.");
}

async function descartaEdicioDoc(){
  const p = pi(state.docPi);
  if(!p || !p.docEdit) return;
  const ok = await confirma("Descarta totes les edicions",
    "El document tornarà a generar-se sencer a partir del pla i es perdran tots els canvis fets a mà a la previsualització, inclosos els apartats eliminats.",
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
  const ed = p.docEdit;
  if(ed && ed.seccions && ed.seccions.mesures != null){
    const t = document.createElement("template");
    t.innerHTML = ed.seccions.mesures;
    const taula = graellaMesuresDe(t.content);
    if(taula){
      let tb = taula.querySelector("tbody");
      if(!tb){ tb = document.createElement("tbody"); taula.appendChild(tb); }
      tb.innerHTML = filesMesuresDoc(p);
      ed.seccions.mesures = t.innerHTML;
    }
  }
  desa();
  refrescaDoc();
  toast(p.docMesuresSimples ? "Graella de mesures amb només els títols." : "Graella de mesures amb la redacció completa.");
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

/* ---------- Files i columnes ocultes a la impressió ----------
   A la taula d'objectius, cada fila i cada columna porta un ull que l'amaga
   del document imprès. No és una edició: el text no canvia i l'apartat
   continua viu. A la pantalla la fila o la columna es continua veient, més
   apagada i amb l'avís «No s'imprimirà», perquè es pugui tornar a mostrar.

   Per imprimir es fa servir una còpia de la taula sense el que s'ha amagat, amb
   les caselles fusionades (rowspan) recalculades: si s'amaga la primera fila
   d'una matèria, la casella de la matèria passa a la fila següent. */
const ULL_ON = "&#xe8f4;", ULL_OFF = "&#xe8f5;";

function ocultsDoc(p){
  const o = p.docOcult || {};
  return {files: o.files || [], cols: o.cols || []};
}

function ullDoc(amagat, accio, que){
  const t = amagat ? `Torna a imprimir ${que}` : `No imprimeixis ${que}`;
  return `<button type="button" class="doc-ull doc-eina no-print${amagat?" off":""}" contenteditable="false"
    onclick="${accio}" title="${t}" aria-label="${t}" aria-pressed="${amagat}"><span class="msym" aria-hidden="true">${amagat ? ULL_OFF : ULL_ON}</span></button>${
    amagat ? `<span class="doc-no-imp doc-eina no-print" contenteditable="false">No s'imprimirà</span>` : ""}`;
}

/* Posició de cada casella del cos d'una taula, tenint en compte les fusions. */
function graellaTaula(files){
  const ocupat = files.map(() => []), cel = [];
  files.forEach((tr, r) => {
    let c = 0;
    [...tr.cells].forEach(td => {
      while(ocupat[r][c]) c++;
      const rs = Math.max(1, td.rowSpan || 1);
      for(let k = 0; k < rs && r + k < files.length; k++) ocupat[r + k][c] = true;
      cel.push({td, r, c, rs});
      c++;
    });
  });
  return cel;
}

/* Còpia de la taula per imprimir, sense les files ni les columnes amagades. */
function taulaImpressio(taula, filaAmagada, cols){
  const t = taula.cloneNode(true);
  t.querySelectorAll("[data-col]").forEach(c => { if(cols.includes(c.dataset.col)) c.remove(); });
  const files = [...t.querySelectorAll("tbody tr")];
  const queda = files.map(tr => !filaAmagada(tr));
  const cel = graellaTaula(files);
  files.forEach(tr => [...tr.cells].forEach(td => td.remove()));
  cel.sort((x, y) => x.c - y.c).forEach(x => {
    const vis = [];
    for(let k = 0; k < x.rs && x.r + k < files.length; k++) if(queda[x.r + k]) vis.push(x.r + k);
    if(!vis.length) return;
    x.td.rowSpan = vis.length;
    files[vis[0]].appendChild(x.td);
  });
  files.forEach((tr, i) => { if(!queda[i]) tr.remove(); });
  t.classList.add("doc-imprimir", "doc-eina");
  return t;
}

function decoraOcults(arrel, p){
  const sec = arrel.querySelector('[data-sec="objectius"]');
  const taula = sec && sec.querySelector("table");
  if(!taula) return;
  const oc = ocultsDoc(p);
  const files = [...taula.querySelectorAll("tbody tr")];
  const amagada = tr => !!tr.dataset.obj && oc.files.includes(tr.dataset.obj);
  const nFiles = files.filter(amagada).length;
  const nCols = [...taula.querySelectorAll("th[data-col]")].filter(th => oc.cols.includes(th.dataset.col)).length;
  /* Primer la còpia per imprimir, encara sense ulls ni avisos. */
  if(nFiles || nCols){
    taula.after(taulaImpressio(taula, amagada, oc.cols));
    taula.classList.add("doc-pantalla");
    const h = sec.querySelector("h2");
    const que = [nFiles ? `${nFiles} fila${nFiles===1?"":"s"}` : "",
                 nCols ? `${nCols} columna${nCols===1?"":"s"}` : ""].filter(Boolean).join(" i ");
    const avis = `<div class="doc-ocults doc-eina no-print" contenteditable="false">${que} d'aquesta taula no ${
      nFiles + nCols === 1 ? "s'imprimirà" : "s'imprimiran"}. Es mostren apagades; amb l'ull les tornes a mostrar.</div>`;
    if(h) h.insertAdjacentHTML("afterend", avis);
  }
  /* Casella a casella: les fusionades només s'apaguen si totes les seves
     files són amagades. */
  graellaTaula(files).forEach(x => {
    const totes = files.slice(x.r, x.r + x.rs).every(amagada);
    if(totes || oc.cols.includes(x.td.dataset.col)) x.td.classList.add("doc-ocult");
  });
  taula.querySelectorAll("th[data-col]").forEach(th => {
    const k = th.dataset.col, off = oc.cols.includes(k);
    if(off) th.classList.add("doc-ocult");
    th.insertAdjacentHTML("beforeend", ullDoc(off, `commutaColDoc(${jq(k)})`, "aquesta columna"));
  });
  files.forEach(tr => {
    if(!tr.dataset.obj) return;
    const td = tr.querySelector('td[data-col="obj"]') || tr.cells[tr.cells.length - 1];
    if(td) td.insertAdjacentHTML("beforeend", ullDoc(amagada(tr), `commutaFilaDoc(${jq(tr.dataset.obj)})`, "aquesta fila"));
  });
}

function commutaFilaDoc(id){ commutaOcultDoc("files", id); }
function commutaColDoc(k){ commutaOcultDoc("cols", k); }
function commutaOcultDoc(camp, v){
  const p = pi(state.docPi);
  if(!p) return;
  if(docEditant) buidaEdicioDoc();
  const o = p.docOcult = Object.assign({files:[], cols:[]}, p.docOcult || {});
  const i = o[camp].indexOf(v);
  if(i >= 0) o[camp].splice(i, 1); else o[camp].push(v);
  desa();
  refrescaDoc();
  const que = camp === "files" ? "La fila" : "La columna";
  toast(i >= 0 ? `${que} es tornarà a imprimir.` : `${que} no s'imprimirà.`);
}
