/* ---------- Parts del document ocultes a la impressió ----------
   Cada apartat, cada fila i cada columna de les taules, cada casella fusionada
   (que representa un grup de files) i el requadre del segell porten un ull que
   els amaga del document imprès. No és una edició: el text no canvia i
   l'apartat continua viu. A la pantalla es continuen veient, més apagats i amb
   l'avís «No s'imprimirà», perquè es puguin tornar a mostrar.

   Es desa a p.docOcult:
     seccions  [data-sec]  apartats sencers que no s'imprimeixen
     blocs     [clau]      blocs solts, com el segell (data-bloc)
     clau      {files, cols} per taula:
       clau   l'apartat (data-sec) i, si n'hi ha més d'una, el número de taula
       files  la clau de cada fila: l'id de l'objectiu, la marca data-fila que
              posa el document o, si no en té, una empremta del seu text
       cols   la clau de cada columna: data-col de la capçalera o la posició

   Per imprimir es fa servir una còpia de la taula sense el que s'ha amagat, amb
   les caselles fusionades (rowspan) recalculades: si s'amaga la primera fila
   d'un grup, la casella fusionada passa a la fila següent. */
const ULL_ON = "&#xe8f4;", ULL_OFF = "&#xe8f5;";

/* La primera versió només ho feia a la taula d'objectius i ho desava com a
   {files, cols}: passa a ser l'entrada d'aquella taula. */
function ocultsDoc(p){
  const o = p.docOcult;
  if(o && (Array.isArray(o.files) || Array.isArray(o.cols)))
    p.docOcult = {objectius: {files: o.files || [], cols: o.cols || []}};
  return p.docOcult || {};
}
const seccionsOcultes = p => ocultsDoc(p).seccions || [];
const blocsOcults = p => ocultsDoc(p).blocs || [];
function ocultsTaula(p, clau){
  const o = ocultsDoc(p)[clau] || {};
  return {files: o.files || [], cols: o.cols || []};
}

/* Taules del document amb la seva clau. */
function taulesDoc(arrel){
  const out = [];
  arrel.querySelectorAll("section[data-sec]").forEach(sec => {
    [...sec.querySelectorAll("table")].forEach((taula, i) =>
      out.push({sec, taula, clau: sec.dataset.sec + (i ? "#" + i : "")}));
  });
  return out;
}

function empremta(text){
  let h = 5381;
  for(const ch of text.replace(/\s+/g, " ").trim()) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return "t" + h.toString(36);
}
const clauFila = tr => tr.dataset.obj || tr.dataset.fila || empremta(tr.textContent);
/* Una fila que és només el guionet de «no n'hi ha» no porta ull. */
const filaBuida = tr => tr.cells.length === 1 && tr.cells[0].colSpan > 1;
const filesCos = taula => [...taula.tBodies].flatMap(b => [...b.rows]);
const capTaula = taula => (taula.tHead && taula.tHead.rows[0]) || null;
const clausCols = taula => { const c = capTaula(taula); return c ? [...c.cells].map((th, i) => th.dataset.col || "c" + i) : []; };

function ullDoc(amagat, accio, que){
  const t = amagat ? `Torna a imprimir ${que}` : `No imprimeixis ${que}`;
  return `<button type="button" class="doc-ull doc-eina no-print${amagat?" off":""}" contenteditable="false"
    onclick="${accio}" title="${t}" aria-label="${t}" aria-pressed="${amagat}"><span class="msym" aria-hidden="true">${amagat ? ULL_OFF : ULL_ON}</span></button>${
    amagat ? `<span class="doc-no-imp doc-eina no-print" contenteditable="false">No s'imprimirà</span>` : ""}`;
}

/* Posició de cada casella del cos d'una taula, tenint en compte les fusions
   de files (rowspan) i de columnes (colspan). */
function graellaTaula(files){
  const ocupat = files.map(() => []), cel = [];
  files.forEach((tr, r) => {
    let c = 0;
    [...tr.cells].forEach(td => {
      while(ocupat[r][c]) c++;
      const rs = Math.max(1, td.rowSpan || 1), cs = Math.max(1, td.colSpan || 1);
      for(let k = 0; k < rs && r + k < files.length; k++)
        for(let j = 0; j < cs; j++) ocupat[r + k][c + j] = true;
      cel.push({td, r, c, rs, cs});
      c += cs;
    });
  });
  return cel;
}

/* Còpia de la taula per imprimir, sense les files ni les columnes amagades.
   Les files de la còpia s'identifiquen per la posició, que és la mateixa. */
function taulaImpressio(taula, filaAmagada, colAmagada){
  const t = taula.cloneNode(true);
  const cap = capTaula(t);
  if(cap) [...cap.cells].forEach((th, c) => { if(colAmagada(c)) th.remove(); });
  const files = filesCos(t);
  const queda = files.map((tr, i) => !filaAmagada(i));
  const cel = graellaTaula(files);
  files.forEach(tr => [...tr.cells].forEach(td => td.remove()));
  cel.sort((x, y) => x.c - y.c).forEach(x => {
    let cs = 0;
    for(let j = 0; j < x.cs; j++) if(!colAmagada(x.c + j)) cs++;
    const vis = [];
    for(let k = 0; k < x.rs && x.r + k < files.length; k++) if(queda[x.r + k]) vis.push(x.r + k);
    if(!cs || !vis.length) return;
    x.td.rowSpan = vis.length;
    if(x.cs > 1) x.td.colSpan = cs;
    files[vis[0]].appendChild(x.td);
  });
  files.forEach((tr, i) => { if(!queda[i]) tr.remove(); });
  t.classList.add("doc-imprimir", "doc-eina");
  return t;
}

function decoraOcults(arrel, p){
  const secs = seccionsOcultes(p), blocs = blocsOcults(p);
  arrel.querySelectorAll("section[data-sec]").forEach(sec => {
    const h = sec.querySelector("h2");
    if(!h) return;
    const off = secs.includes(sec.dataset.sec);
    if(off) sec.classList.add("doc-sec-oculta");
    h.insertAdjacentHTML("beforeend", ullDoc(off, `commutaSeccioDoc(${jq(sec.dataset.sec)})`, "aquest apartat"));
  });
  /* Els documents retocats abans que el segell portés la marca el tenen igual. */
  arrel.querySelectorAll("[data-bloc], .segell").forEach(el => {
    const k = el.dataset.bloc || "segell", off = blocs.includes(k);
    el.classList.add("doc-ull-cel");
    if(off) el.classList.add("doc-ocult", "doc-bloc-ocult");
    el.insertAdjacentHTML("beforeend", ullDoc(off, `commutaBlocDoc(${jq(k)})`, "el segell"));
  });
  taulesDoc(arrel).forEach(x => decoraTaula(x.taula, x.clau, p));
}

function decoraTaula(taula, clau, p){
  const oc = ocultsTaula(p, clau);
  const files = filesCos(taula);
  /* Les claus es treuen abans de posar-hi ulls i avisos, que en canviarien el text. */
  const claus = files.map(clauFila);
  const cols = clausCols(taula);
  const amagada = i => !filaBuida(files[i]) && oc.files.includes(claus[i]);
  const colOff = c => oc.cols.includes(cols[c]);
  const nFiles = files.filter((tr, i) => amagada(i)).length;
  const nCols = cols.filter((k, c) => colOff(c)).length;
  /* Primer la còpia per imprimir, encara sense ulls ni avisos. */
  if(nFiles || nCols){
    taula.after(taulaImpressio(taula, amagada, colOff));
    taula.classList.add("doc-pantalla");
    const que = [nFiles ? `${nFiles} fila${nFiles===1?"":"s"}` : "",
                 nCols ? `${nCols} columna${nCols===1?"":"s"}` : ""].filter(Boolean).join(" i ");
    taula.insertAdjacentHTML("beforebegin", `<div class="doc-ocults doc-eina no-print" contenteditable="false">${que} d'aquesta taula no ${
      nFiles + nCols === 1 ? "s'imprimirà" : "s'imprimiran"}. Es mostren apagades; amb l'ull les tornes a mostrar.</div>`);
  }
  taula.classList.add("doc-ulls");
  /* Casella a casella: les fusionades només s'apaguen si totes les seves
     files, o totes les seves columnes, són amagades. */
  graellaTaula(files).forEach(x => {
    let filesOff = true, colsOff = true;
    for(let k = 0; k < x.rs && x.r + k < files.length; k++) if(!amagada(x.r + k)) filesOff = false;
    for(let j = 0; j < x.cs; j++) if(!colOff(x.c + j)) colsOff = false;
    if(filesOff || colsOff) x.td.classList.add("doc-ocult");
  });
  const cap = capTaula(taula);
  if(cap) [...cap.cells].forEach((th, c) => {
    if(colOff(c)) th.classList.add("doc-ocult");
    th.insertAdjacentHTML("beforeend", ullDoc(colOff(c), `commutaColDoc(${jq(clau)},${jq(cols[c])})`, "aquesta columna"));
  });
  /* L'ull de la fila va a la casella de l'objectiu o a la darrera que no és
     fusionada. */
  files.forEach((tr, i) => {
    if(filaBuida(tr)) return;
    const td = tr.querySelector('td[data-col="obj"]') || [...tr.cells].reverse().find(c => c.rowSpan <= 1);
    if(!td) return;
    td.classList.add("doc-ull-cel");
    td.insertAdjacentHTML("beforeend", ullDoc(amagada(i), `commutaFilaDoc(${jq(clau)},${jq(claus[i])})`, "aquesta fila"));
  });
  /* Una casella fusionada (la matèria, el trimestre, la competència
     específica…) amaga o mostra totes les files que abraça. */
  graellaTaula(files).forEach(x => {
    const idx = [];
    for(let k = 0; k < x.rs && x.r + k < files.length; k++) if(!filaBuida(files[x.r + k])) idx.push(x.r + k);
    if(idx.length < 2) return;
    x.td.classList.add("doc-ull-cel");
    x.td.insertAdjacentHTML("beforeend", ullDoc(idx.every(amagada),
      `commutaGrupDoc(${jq(clau)},${jq(idx.map(i => claus[i]))})`, `les ${idx.length} files d'aquest grup`));
  });
}

function commutaFilaDoc(taula, k){ commutaOcultDoc(taula, "files", [k], "La fila"); }
function commutaColDoc(taula, k){ commutaOcultDoc(taula, "cols", [k], "La columna"); }
function commutaGrupDoc(taula, ks){ commutaOcultDoc(taula, "files", ks, "El grup de files"); }
function commutaSeccioDoc(k){ commutaOcultDoc(null, "seccions", [k], "L'apartat"); }
function commutaBlocDoc(k){ commutaOcultDoc(null, "blocs", [k], "El segell"); }

/* Si tots els valors ja eren amagats, es tornen a mostrar; si no, s'amaguen
   tots. Així una casella fusionada fa de commutador per a tot el grup. */
function commutaOcultDoc(taula, camp, vals, que){
  const p = pi(state.docPi);
  if(!p) return;
  if(docEditant) buidaEdicioDoc();
  const tot = ocultsDoc(p);
  const o = taula ? (tot[taula] = ocultsTaula(p, taula)) : tot;
  const l = o[camp] = (o[camp] || []).slice();
  const mostra = vals.every(v => l.includes(v));
  vals.forEach(v => {
    const i = l.indexOf(v);
    if(mostra && i >= 0) l.splice(i, 1);
    if(!mostra && i < 0) l.push(v);
  });
  if(taula && !o.files.length && !o.cols.length) delete tot[taula];
  if(!taula && !l.length) delete tot[camp];
  p.docOcult = Object.keys(tot).length ? tot : null;
  desa();
  refrescaDoc();
  toast(mostra ? `${que} es tornarà a imprimir.` : `${que} no s'imprimirà.`);
}

function mostraTotDoc(){
  const p = pi(state.docPi);
  if(!p) return;
  if(docEditant) buidaEdicioDoc();
  p.docOcult = null;
  desa();
  refrescaDoc();
  toast("Tot el document es tornarà a imprimir.");
}

/* Si s'imprimeix enmig d'una edició, les còpies per imprimir encara són les
   d'abans dels últims canvis: es desa i es repinta el document abans. */
window.addEventListener("beforeprint", () => {
  const cos = $("#doc-cos");
  if(docEditant && cos && cos.dataset.tocat){ buidaEdicioDoc(); refrescaDoc(); }
});
