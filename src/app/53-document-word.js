/* ---------- Exportació del document ----------
   El botó «Exporta» de la finestra del document ofereix dos formats:

     PDF   el diàleg d'impressió del navegador, amb «Desa com a PDF». És la
           còpia fidel, la que se signa i es lliura.
     Word  un .docx editable, per a qui l'ha de retocar amb Word, LibreOffice
           o Google Docs.

   El .docx es construeix aquí mateix, sense biblioteques ni connexió: és un
   ZIP (sense compressió) amb els XML d'Office Open XML. El contingut surt del
   document tal com s'imprimiria —apartats numerats, sense el que s'ha amagat
   amb l'ull i amb les edicions fetes a mà— i es tradueix element a element:
   títols, paràgrafs, llistes i taules amb les caselles fusionades. Els logos
   van a la primera pàgina o a la capçalera de totes, com a la impressió, i
   l'apartat d'objectius va en una secció horitzontal pròpia. */

async function exportaDoc(){
  const tria = await obreDlg("Exporta el document",
    `<button class="tria" type="button" onclick="tancaDlg('pdf')">
      <span class="tria-t">PDF</span>
      <span class="tria-d">S'obre el diàleg d'impressió del navegador: a <b>Destinació</b>, tria
      <b>Desa com a PDF</b>. És la còpia fidel del document, la que se signa i es lliura.</span>
    </button>
    <button class="tria" type="button" onclick="tancaDlg('word')">
      <span class="tria-t">Word (.docx)</span>
      <span class="tria-d">Un document editable que s'obre amb Word, LibreOffice o Google Docs. Porta
      el mateix que s'imprimiria —sense el que has amagat amb l'ull—, amb els logos i el color dels
      títols. La compaginació pot variar una mica respecte del PDF.</span>
    </button>`,
    [{text: "Cancel·la", classe: "ghost", valor: null}]);
  if(tria === "pdf") setTimeout(() => window.print(), 60);
  if(tria === "word") exportaWord();
}

async function exportaWord(){
  const p = pi(state.docPi);
  if(!p) return;
  /* Com abans d'imprimir: el que s'acaba d'escriure es desa i les còpies per
     imprimir de les taules es refan. */
  const cos0 = $("#doc-cos");
  if(docEditant && cos0 && cos0.dataset.tocat){ buidaEdicioDoc(); refrescaDoc(); }
  const cos = $("#doc-cos");
  if(!cos) return;
  const a = alumne(p.alumneId);
  try{
    const fitxers = await paquetWord(cos);
    const nom = `PI ${a.alias || ""} ${p.curs || ""}`.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
    baixa(nom + ".docx", zipSenseCompressio(fitxers),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    toast("Document de Word baixat.");
  }catch(e){
    avisa("No s'ha pogut exportar", "No s'ha pogut generar el document de Word. Prova-ho de nou o exporta'l en PDF.");
  }
}

/* ----- Mides -----
   Word mesura en vintens de punt (twips) i les imatges en EMU. Els marges són
   els de la impressió sense capçalera del navegador. */
const MM_TW = 56.7, MM_EMU = 36000;
const FULL_W = 11906, FULL_H = 16838;          /* A4 */
const MARGE_W = {costat: 850, dalt: 1134, baix: 794, cap: 454};
const ampladaFull = horitzontal => (horitzontal ? FULL_H : FULL_W) - 2 * MARGE_W.costat;
const FONTS_W = {serif: "Georgia", sans: "Arial", mono: "Consolas"};

const xe = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hexW = c => c.replace("#", "").toUpperCase();

/* ----- Format de text i de paràgraf ----- */
function rPrW(f){
  let r = "";
  if(f.font) r += `<w:rFonts w:ascii="${FONTS_W[f.font]}" w:hAnsi="${FONTS_W[f.font]}" w:cs="${FONTS_W[f.font]}"/>`;
  if(f.b) r += "<w:b/>";
  if(f.i) r += "<w:i/>";
  if(f.caps) r += "<w:caps/>";
  if(f.color) r += `<w:color w:val="${f.color}"/>`;
  if(f.spacing) r += `<w:spacing w:val="${f.spacing}"/>`;
  if(f.sz) r += `<w:sz w:val="${f.sz}"/><w:szCs w:val="${f.sz}"/>`;
  return r ? `<w:rPr>${r}</w:rPr>` : "";
}
const voraW = (costat, v) => `<w:${costat} w:val="${v.val || "single"}" w:sz="${v.sz || 4}" w:space="${v.space || 0}" w:color="${v.color}"/>`;
function pPrW(q){
  let r = "";
  if(q.estil) r += `<w:pStyle w:val="${q.estil}"/>`;
  if(q.keepNext) r += "<w:keepNext/>";
  if(q.num) r += `<w:numPr><w:ilvl w:val="${q.num.lvl}"/><w:numId w:val="${q.num.id}"/></w:numPr>`;
  if(q.vores) r += `<w:pBdr>${["top", "left", "bottom", "right"].filter(k => q.vores[k]).map(k => voraW(k, q.vores[k])).join("")}</w:pBdr>`;
  if(q.shd) r += `<w:shd w:val="clear" w:color="auto" w:fill="${q.shd}"/>`;
  r += `<w:spacing w:before="${q.before || 0}" w:after="${q.after || 0}" w:line="${q.line || 264}" w:lineRule="${q.lineRule || "auto"}"/>`;
  if(q.ind) r += `<w:ind w:left="${q.ind.l || 0}" w:right="${q.ind.r || 0}"/>`;
  if(q.jc) r += `<w:jc w:val="${q.jc}"/>`;
  if(q.sect) r += q.sect;
  return `<w:pPr>${r}</w:pPr>`;
}
const paragrafW = (q, runs) => `<w:p>${pPrW(q || {})}${runs || ""}</w:p>`;
/* Paràgraf buit i baix que separa dues taules: seguides, Word les ajuntaria. */
const separadorW = (alt = 80) => paragrafW({line: alt, lineRule: "exact"});

const pxSz = px => Math.round(parseFloat(px) * 0.75 * 2);
const INLINE_W = new Set(["B", "STRONG", "I", "EM", "SPAN", "U", "SMALL", "A", "FONT", "SUB", "SUP", "CODE", "MARK", "LABEL", "ABBR", "TIME"]);

/* Format de text que aporta un element: etiqueta, classe i estil en línia. */
function formatEl(el, f){
  const g = Object.assign({}, f), cl = el.classList, st = el.style;
  if(el.tagName === "B" || el.tagName === "STRONG") g.b = true;
  if(el.tagName === "I" || el.tagName === "EM") g.i = true;
  if(el.tagName === "H1") Object.assign(g, {font: "serif", b: true, sz: 32});
  if(/^H[3-6]$/.test(el.tagName)) Object.assign(g, {font: "sans", b: true, sz: 19, color: "2C3940"});
  if(el.tagName === "TH") Object.assign(g, {font: "mono", caps: true, sz: 14, color: "5A666D", spacing: 16});
  if(el.tagName === "TD") Object.assign(g, cl.contains("k") ? {font: "sans", sz: 17, color: "5A666D"} : {sz: 19});
  if(cl.contains("orig")) Object.assign(g, {sz: 16, color: "7F8A90", i: true});
  if(cl.contains("legal")) Object.assign(g, {sz: 18, color: "7F8A90"});
  if(cl.contains("centre")) Object.assign(g, {font: "mono", caps: true, sz: 16, color: "6B767C", spacing: 20});
  if(cl.contains("mes-grup")) Object.assign(g, {font: "sans", b: true, caps: true, sz: 15, color: "3F8C9E", spacing: 12});
  if(cl.contains("foot")) Object.assign(g, {font: "mono", sz: 15, color: "8B959A", spacing: 12});
  if(cl.contains("lloc")) Object.assign(g, {sz: 17});
  if(/px$/.test(st.fontSize)) g.sz = pxSz(st.fontSize);
  if(st.fontWeight === "bold" || +st.fontWeight >= 600) g.b = true;
  if(st.fontStyle === "italic") g.i = true;
  return g;
}

/* ----- Contingut en línia ----- */
function recullInline(node, f, items){
  if(node.nodeType === 3){ items.push({t: node.nodeValue, f}); return; }
  if(node.nodeType !== 1) return;
  if(node.tagName === "BR"){ items.push({br: true}); return; }
  const bloc = !INLINE_W.has(node.tagName);
  if(bloc) items.push({br: "suau"});
  const g = formatEl(node, f);
  node.childNodes.forEach(n => recullInline(n, g, items));
  if(bloc) items.push({br: "suau"});
}
/* Espais com els del navegador: es col·lapsen i no n'hi ha a l'inici ni al
   final de cada línia. Els salts «suaus» (un bloc dins d'un element en línia)
   no deixen mai una línia buida. */
function runsW(items){
  const linies = [[]];
  const plena = l => l.some(x => x.t.trim());
  items.forEach(x => {
    if(!x.br) return linies[linies.length - 1].push(x);
    if(x.br === "suau" && !plena(linies[linies.length - 1])) return;
    linies.push([]);
  });
  const xml = linies.map(l => {
    const trossos = [];
    let tall = true;
    l.forEach(x => {
      let s = x.t.replace(/\s+/g, " ");
      if(tall) s = s.replace(/^ /, "");
      if(!s) return;
      tall = s.endsWith(" ");
      trossos.push({s, f: x.f});
    });
    if(trossos.length) trossos[trossos.length - 1].s = trossos[trossos.length - 1].s.replace(/ $/, "");
    return trossos.filter(x => x.s).map(x => `<w:r>${rPrW(x.f)}<w:t xml:space="preserve">${xe(x.s)}</w:t></w:r>`).join("");
  });
  while(xml.length && !xml[0]) xml.shift();
  while(xml.length && !xml[xml.length - 1]) xml.pop();
  return xml.join("<w:r><w:br/></w:r>");
}

/* ----- Blocs -----
   ctx: f format de text, q propietats de paràgraf, amplada disponible (twips),
   llista {id, lvl, primer} dins d'una llista i color dels títols. */
function blocsW(nodes, ctx){
  const out = [];
  let items = [];
  const tanca = () => {
    const r = runsW(items);
    items = [];
    if(!r) return;
    const q = Object.assign({}, ctx.q);
    if(ctx.llista){
      if(ctx.llista.primer){ q.num = {id: ctx.llista.id, lvl: ctx.llista.lvl}; ctx.llista.primer = false; }
      else q.ind = {l: 360 * (ctx.llista.lvl + 1)};
      q.after = 50;
    }
    out.push(paragrafW(q, r));
  };
  [...nodes].forEach(n => {
    if(n.nodeType === 3 || (n.nodeType === 1 && (INLINE_W.has(n.tagName) || n.tagName === "BR"))){
      recullInline(n, ctx.f, items);
      return;
    }
    if(n.nodeType !== 1) return;
    tanca();
    out.push(...blocW(n, ctx));
  });
  tanca();
  return out;
}

function blocW(el, ctx){
  const cl = el.classList, t = el.tagName, f = formatEl(el, ctx.f);
  const fill = (q, ...m) => Object.assign({}, ctx.q, ...m, q);
  const amb = (f2, q2) => Object.assign({}, ctx, {f: f2, q: q2});
  if(["IMG", "SCRIPT", "STYLE", "BUTTON", "INPUT", "SVG"].includes(t)) return [];
  if(t === "TABLE") return taulaW(el, ctx);
  if(t === "UL" || t === "OL"){
    const lvl = ctx.llista ? Math.min(ctx.llista.lvl + 1, 2) : 0;
    return [...el.children].flatMap(li => blocsW(li.childNodes,
      Object.assign({}, ctx, {f: formatEl(li, f), llista: {id: t === "OL" ? 2 : 1, lvl, primer: true}})));
  }
  if(t === "H2"){
    const c = hexW(ctx.color), v = {color: c, sz: 4, space: 3};
    return blocsW(el.childNodes, amb(
      Object.assign({}, f, {font: "mono", caps: true, sz: 17, color: hexW(colorTextTitols(ctx.color)), spacing: 22, b: false}),
      fill({estil: "Titol2", shd: c, vores: {top: v, left: v, bottom: v, right: v}, ind: {l: 80, r: 80},
            before: 360, after: 140, keepNext: true})));
  }
  if(t === "H1") return blocsW(el.childNodes, amb(f, fill({estil: "Titol1", after: 40})));
  if(/^H[3-6]$/.test(t)) return blocsW(el.childNodes, amb(f, fill({before: 220, after: 80, keepNext: true})));
  if(t === "P") return blocsW(el.childNodes, amb(f, fill({after: ctx.dins ? 60 : 120})));
  if(t === "HR") return [paragrafW({vores: {bottom: {color: "D9DEDB"}}, after: 120})];
  if(cl.contains("logos")) return [];
  if(cl.contains("head") && el.children.length === 2) return capW(el, ctx);
  if(cl.contains("sig")) return signaturesW(el, ctx);
  if(cl.contains("segell")) return segellW(el, ctx);
  if(cl.contains("cloenda")) return [paragrafW({before: 500})].concat(blocsW(el.childNodes, ctx));
  if(cl.contains("foot")) return blocsW(el.childNodes, amb(f,
    fill({before: 500, vores: {top: {color: "D9DEDB", space: 6}}})));
  const q = {};
  if(el.style.textAlign === "right") q.jc = "right";
  if(el.style.textAlign === "center") q.jc = "center";
  if(cl.contains("lloc")) q.after = 300;
  if(cl.contains("mes-grup")) Object.assign(q, {before: 100, after: 20, keepNext: true});
  return blocsW(el.childNodes, amb(f, fill(q)));
}

/* ----- Taules ----- */
const VORES_TAULA = ["top", "left", "bottom", "right", "insideH", "insideV"];
function taulaSimpleW(cols, files, o){
  o = o || {};
  const vores = o.vores || {};
  return `<w:tbl><w:tblPr><w:tblW w:w="${cols.reduce((a, b) => a + b, 0)}" w:type="dxa"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}
    <w:tblBorders>${VORES_TAULA.map(k => vores[k] ? voraW(k, vores[k]) : `<w:${k} w:val="nil"/>`).join("")}</w:tblBorders>
    <w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="${o.mv || 0}" w:type="dxa"/><w:left w:w="${o.mh || 0}" w:type="dxa"/>
    <w:bottom w:w="${o.mv || 0}" w:type="dxa"/><w:right w:w="${o.mh || 0}" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tblGrid>${cols.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${files.join("")}</w:tbl>`;
}
function cellaW(amplada, blocs, pr){
  return `<w:tc><w:tcPr><w:tcW w:w="${amplada}" w:type="dxa"/>${pr || ""}</w:tcPr>${blocs.length ? blocs.join("") : "<w:p/>"}</w:tc>`;
}

/* Amplades de columna: les que declaren les capçaleres (o la casella clau,
   un 33 %), i la resta repartida a parts iguals. */
function ampladesCols(cel, n, total){
  const pct = new Array(n).fill(null);
  cel.filter(x => x.cs === 1).forEach(x => {
    if(pct[x.c] != null) return;
    const w = x.td.style.width;
    if(/%$/.test(w)) pct[x.c] = parseFloat(w);
    else if(x.td.classList.contains("k")) pct[x.c] = 33;
  });
  const fixes = pct.filter(v => v != null), s = fixes.reduce((a, b) => a + b, 0), u = n - fixes.length;
  const resta = u ? Math.max(8 * u, 100 - s) / u : 0;
  const w = pct.map(v => v != null ? v : resta), tot = w.reduce((a, b) => a + b, 0) || 1;
  return w.map(v => Math.round(total * v / tot));
}

function taulaW(t, ctx){
  const files = [...t.rows];
  if(!files.length) return [];
  const cel = graellaTaula(files);
  const n = Math.max(1, ...cel.map(x => x.c + x.cs));
  const cols = ampladesCols(cel, n, ctx.amplada);
  const occ = files.map(() => new Array(n).fill(null));
  cel.forEach(x => {
    for(let k = 0; k < x.rs && x.r + k < files.length; k++)
      for(let j = 0; j < x.cs && x.c + j < n; j++) occ[x.r + k][x.c + j] = x;
  });
  const centra = !!t.closest('[data-sec="objectius"]');
  const xmlFiles = files.map((tr, r) => {
    let cells = "";
    for(let c = 0; c < n;){
      const x = occ[r][c];
      if(!x){ cells += cellaW(cols[c], []); c++; continue; }
      const w = cols.slice(x.c, x.c + x.cs).reduce((a, b) => a + b, 0);
      const span = x.cs > 1 ? `<w:gridSpan w:val="${x.cs}"/>` : "";
      const gris = x.td.tagName === "TH" || x.td.classList.contains("k") ? `<w:shd w:val="clear" w:color="auto" w:fill="F6F8F6"/>` : "";
      if(x.r === r){
        const va = x.rs > 1 && centra ? `<w:vAlign w:val="center"/>` : "";
        const blocs = blocsW(x.td.childNodes, Object.assign({}, ctx,
          {f: formatEl(x.td, ctx.f), q: {}, dins: true, llista: null, amplada: Math.max(600, w - 260)}));
        cells += cellaW(w, blocs, span + (x.rs > 1 ? `<w:vMerge w:val="restart"/>` : "") + gris + va);
      }else cells += cellaW(w, [], span + `<w:vMerge/>` + gris);
      c = x.c + x.cs;
    }
    const cap = tr.parentElement && tr.parentElement.tagName === "THEAD";
    return `<w:tr>${cap ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${cells}</w:tr>`;
  });
  const v = {color: "D9DEDB"};
  return [taulaSimpleW(cols, xmlFiles, {mv: 70, mh: 130,
    vores: {top: v, left: v, bottom: v, right: v, insideH: v, insideV: v}}), separadorW()];
}

/* Capçalera del document: el títol a l'esquerra, l'identificador a la dreta
   i una ratlla a sota. */
function capW(el, ctx){
  const total = ctx.amplada, cols = [Math.round(total * .68), total - Math.round(total * .68)];
  const cel = [...el.children].map((d, i) => cellaW(cols[i],
    blocsW([d], Object.assign({}, ctx, {q: i ? {jc: "right"} : {}, dins: true, amplada: cols[i]})), `<w:vAlign w:val="bottom"/>`));
  return [taulaSimpleW(cols, [`<w:tr>${cel.join("")}</w:tr>`], {mv: 0, mh: 0,
    vores: {bottom: {color: "1B2429", sz: 12}}}), separadorW(160)];
}

/* Línies de signatura: caselles amb una ratlla a dalt i un buit entremig. */
function signaturesW(el, ctx){
  const divs = [...el.children];
  if(!divs.length) return [];
  const buit = 600, w = Math.floor((ctx.amplada - buit * (divs.length - 1)) / divs.length);
  const cols = divs.flatMap((d, i) => i ? [buit, w] : [w]);
  const f = {font: "mono", sz: 17, color: "6B767C"};
  const cel = divs.flatMap((d, i) => {
    const senseRatlla = /border\s*:\s*0/.test(d.getAttribute("style") || "");
    const c = cellaW(w, blocsW(d.childNodes, Object.assign({}, ctx, {f, q: {}, dins: true, amplada: w})),
      senseRatlla ? "" : `<w:tcBorders>${voraW("top", {color: "1B2429", sz: 6})}</w:tcBorders>`);
    return i ? [cellaW(buit, []), c] : [c];
  });
  return [paragrafW({before: 1150}), taulaSimpleW(cols, [`<w:tr>${cel.join("")}</w:tr>`], {mv: 100, mh: 0}), separadorW()];
}

/* El requadre del segell, centrat i amb el rètol a baix. */
function segellW(el, ctx){
  const w = Math.round(48 * MM_TW), h = Math.round(36 * MM_TW);
  const f = {font: "mono", caps: true, sz: 15, color: "939CA1", spacing: 16};
  const blocs = blocsW(el.childNodes, Object.assign({}, ctx, {f, q: {jc: "center"}, dins: true, amplada: w}));
  const v = {color: "A9B2B7", val: "dashed", sz: 6};
  return [taulaSimpleW([w], [`<w:tr><w:trPr><w:trHeight w:val="${h}" w:hRule="atLeast"/></w:trPr>${cellaW(w, blocs,
    `<w:vAlign w:val="bottom"/>`)}</w:tr>`], {jc: "center", mv: 110, mh: 110, vores: {top: v, left: v, bottom: v, right: v}}), separadorW()];
}

/* ----- Imatges ----- */
/* Els logos es passen a PNG, l'únic format que tots els processadors de text
   llegeixen igual (Word no accepta WEBP i tracta els SVG a part). */
function logoPng(src){
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onerror = () => reject(new Error("imatge"));
    im.onload = () => {
      const w0 = im.naturalWidth || 300, h0 = im.naturalHeight || 150;
      const s = /^data:image\/svg/.test(src) || h0 > 240 ? 240 / h0 : 1;
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w0 * s)); c.height = Math.max(1, Math.round(h0 * s));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(b => b ? b.arrayBuffer().then(ab => resolve({dades: new Uint8Array(ab), w: c.width, h: c.height}))
                      : reject(new Error("imatge")), "image/png");
    };
    im.src = src;
  });
}
function imatgeW(rid, id, cx, cy){
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>
    <wp:docPr id="${id}" name="Logo ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
    <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>
    <pic:nvPicPr><pic:cNvPr id="${id}" name="Logo ${id}"/><pic:cNvPicPr/></pic:nvPicPr>
    <pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
    <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
    </pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}
/* Fila de logos com a la impressió: 14 mm d'alt i com a molt un 31 % de l'amplada. */
function filaLogosW(logos, media, rels, amplada){
  return paragrafW({after: 280}, logos.map((l, i) => {
    let hmm = 14, wmm = hmm * l.png.w / l.png.h;
    const max = amplada / MM_TW * .31;
    if(wmm > max){ hmm *= max / wmm; wmm = max; }
    const nom = `logo${media.length + 1}.png`, rid = `rIdImg${media.length + 1}`;
    media.push({nom, dades: l.png.dades});
    rels.push(`<Relationship Id="${rid}" Type="${REL_W}/image" Target="media/${nom}"/>`);
    return (i ? `<w:r><w:t xml:space="preserve">      </w:t></w:r>` : "")
      + imatgeW(rid, media.length, Math.round(wmm * MM_EMU), Math.round(hmm * MM_EMU));
  }).join(""));
}

/* ----- Paquet ----- */
const NS_W = `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"`;
const REL_W = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const XML_W = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;

/* Còpia del cos del document tal com s'imprimiria. */
function cosImpres(cos){
  const c = cos.cloneNode(true);
  c.querySelectorAll(".doc-pantalla, .doc-sec-oculta, .doc-bloc-ocult, .no-print:not(.doc-imprimir), .doc-eina:not(.doc-imprimir)")
    .forEach(x => x.remove());
  return c;
}

async function paquetWord(cos){
  const logos = [];
  for(const l of state.logos || []){
    try{ logos.push(Object.assign({}, l, {png: await logoPng(l.src)})); }catch(e){ /* un logo il·legible no atura l'exportació */ }
  }
  const corrents = logos.filter(l => l.totes), pag1 = logos.filter(l => !l.totes);
  const media = [], relsDoc = [], relsCap = [];
  const dalt = corrents.length ? Math.round(29 * MM_TW) : MARGE_W.dalt;
  const sectPr = horitzontal => `<w:sectPr>${corrents.length ? `<w:headerReference w:type="default" r:id="rIdCap"/>` : ""}
    <w:type w:val="nextPage"/><w:pgSz w:w="${horitzontal ? FULL_H : FULL_W}" w:h="${horitzontal ? FULL_W : FULL_H}"${horitzontal ? ` w:orient="landscape"` : ""}/>
    <w:pgMar w:top="${dalt}" w:right="${MARGE_W.costat}" w:bottom="${MARGE_W.baix}" w:left="${MARGE_W.costat}" w:header="${MARGE_W.cap}" w:footer="${MARGE_W.cap}" w:gutter="0"/></w:sectPr>`;
  const ctx = h => ({f: {}, q: {}, amplada: ampladaFull(h), color: colorTitols(), llista: null, dins: false});

  const cos2 = cosImpres(cos), cosXml = [];
  if(pag1.length) cosXml.push(filaLogosW(pag1, media, relsDoc, ampladaFull(false)));
  [...cos2.childNodes].forEach(n => {
    const horitz = n.nodeType === 1 && n.matches('section[data-sec="objectius"]');
    if(!horitz){ cosXml.push(...blocsW([n], ctx(false))); return; }
    if(cosXml.length) cosXml.push(paragrafW({sect: sectPr(false)}));
    cosXml.push(...blocsW([n], ctx(true)), paragrafW({sect: sectPr(true)}));
  });

  const docXml = `${XML_W}<w:document ${NS_W}><w:body>${cosXml.join("")}${sectPr(false)}</w:body></w:document>`;
  const fitxers = [
    {nom: "[Content_Types].xml", dades: `${XML_W}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
      <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
      <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
      ${corrents.length ? `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` : ""}
      </Types>`},
    {nom: "_rels/.rels", dades: `${XML_W}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="${REL_W}/officeDocument" Target="word/document.xml"/></Relationships>`},
    {nom: "word/document.xml", dades: docXml},
    {nom: "word/styles.xml", dades: estilsW()},
    {nom: "word/numbering.xml", dades: numeracioW()},
    {nom: "word/settings.xml", dades: `${XML_W}<w:settings ${NS_W}><w:defaultTabStop w:val="709"/>
      <w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`}
  ];
  if(corrents.length){
    const cap = filaLogosW(corrents, media, relsCap, ampladaFull(false));
    fitxers.push({nom: "word/header1.xml", dades: `${XML_W}<w:hdr ${NS_W}>${cap}</w:hdr>`});
    fitxers.push({nom: "word/_rels/header1.xml.rels", dades: `${XML_W}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relsCap.join("")}</Relationships>`});
    relsDoc.push(`<Relationship Id="rIdCap" Type="${REL_W}/header" Target="header1.xml"/>`);
  }
  fitxers.push({nom: "word/_rels/document.xml.rels", dades: `${XML_W}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdEstils" Type="${REL_W}/styles" Target="styles.xml"/>
    <Relationship Id="rIdNum" Type="${REL_W}/numbering" Target="numbering.xml"/>
    <Relationship Id="rIdConf" Type="${REL_W}/settings" Target="settings.xml"/>${relsDoc.join("")}</Relationships>`});
  media.forEach(m => fitxers.push({nom: "word/media/" + m.nom, dades: m.dades}));
  return fitxers;
}

/* Estils: el text de base i dos títols amb nivell d'esquema, perquè el
   panell de navegació de Word mostri els apartats. */
function estilsW(){
  return `${XML_W}<w:styles ${NS_W}><w:docDefaults><w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:eastAsia="Georgia" w:cs="Georgia"/><w:color w:val="1B2429"/>
    <w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ca-ES"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
    <w:style w:type="paragraph" w:styleId="Titol1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
      <w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style>
    <w:style w:type="paragraph" w:styleId="Titol2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
      <w:pPr><w:outlineLvl w:val="1"/></w:pPr></w:style>
    <w:style w:type="table" w:default="1" w:styleId="TaulaNormal"><w:name w:val="Normal Table"/>
      <w:tblPr><w:tblInd w:w="0" w:type="dxa"/></w:tblPr></w:style></w:styles>`;
}
/* Numeracions: 1, pics; 2, números. Tres nivells de sagnat. */
function numeracioW(){
  const nivells = (fmt, text) => [0, 1, 2].map(i => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/>
    <w:lvlText w:val="${text(i)}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${360 * (i + 1)}" w:hanging="260"/></w:pPr></w:lvl>`).join("");
  return `${XML_W}<w:numbering ${NS_W}>
    <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${nivells("bullet", i => ["•", "–", "·"][i])}</w:abstractNum>
    <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${nivells("decimal", i => `%${i + 1}.`)}</w:abstractNum>
    <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;
}

/* ----- ZIP sense compressió -----
   El format .docx és un ZIP. Sense compressió n'hi ha prou amb les capçaleres
   i el CRC-32 de cada fitxer; ocupa una mica més, però no cal cap biblioteca. */
const CRC_TAULA = (() => {
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b){
  let c = 0xFFFFFFFF;
  for(let i = 0; i < b.length; i++) c = CRC_TAULA[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipSenseCompressio(fitxers){
  const enc = new TextEncoder(), parts = [], central = [];
  const d = new Date();
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let pos = 0;
  fitxers.forEach(f => {
    const nom = enc.encode(f.nom), dades = typeof f.dades === "string" ? enc.encode(f.dades) : f.dades, crc = crc32(dades);
    const l = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, hora, 2], [12, dia, 2], [14, crc, 4],
     [18, dades.length, 4], [22, dades.length, 4], [26, nom.length, 2], [28, 0, 2]]
      .forEach(([o, v, n]) => n === 4 ? l.setUint32(o, v, true) : l.setUint16(o, v, true));
    parts.push(new Uint8Array(l.buffer), nom, dades);
    const c = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, hora, 2], [14, dia, 2], [16, crc, 4],
     [20, dades.length, 4], [24, dades.length, 4], [28, nom.length, 2], [42, pos, 4]]
      .forEach(([o, v, n]) => n === 4 ? c.setUint32(o, v, true) : c.setUint16(o, v, true));
    central.push(new Uint8Array(c.buffer), nom);
    pos += 30 + nom.length + dades.length;
  });
  const mida = central.reduce((n, x) => n + x.length, 0);
  const fi = new DataView(new ArrayBuffer(22));
  fi.setUint32(0, 0x06054b50, true);
  fi.setUint16(8, fitxers.length, true); fi.setUint16(10, fitxers.length, true);
  fi.setUint32(12, mida, true); fi.setUint32(16, pos, true);
  return new Blob([...parts, ...central, new Uint8Array(fi.buffer)]);
}
