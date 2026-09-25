/* ---------- 3. Utilitats ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const alumne = id => state.alumnes.find(a => a.id===id) || {alias:"—", perfils:[], grup:"", curs:""};
const pi = id => state.pis.find(p => p.id===id);
const jq = v => esc(JSON.stringify(v));
const dataCat = d => d ? d.split("-").reverse().join("/") : "—";

/* Els cercadors repinten tota la vista amb innerHTML i això destrueix el camp
   de text: es perdia el focus a cada tecla i només s'hi podia escriure un
   caràcter abans de tornar a clicar-hi. Repintem, retrobem el camp equivalent
   de la vista nova pel seu data-cerca i hi tornem el focus amb el cursor on era. */
function cercaViva(camp, repinta){
  const clau = camp.dataset.cerca, ini = camp.selectionStart, fi = camp.selectionEnd;
  repinta();
  const nou = document.querySelector(`[data-cerca="${clau}"]`);
  if(!nou || nou === camp) return;
  nou.focus();
  try { nou.setSelectionRange(ini, fi); } catch(e){}
}


function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2400);
}
function estatTag(e){
  const m = {esborrany:["warn","Esborrany"], vigent:["met","Vigent"], seguiment:["met","En seguiment"], tancat:["","Tancat"]};
  const [c,l] = m[e] || ["","—"];
  return `<span class="tag ${c}">${l}</span>`;
}
function tipusTag(t){
  return t==="continguts"
    ? '<span class="tag con"><span class="dot"></span>Curricular · amb adaptació de criteris</span>'
    : '<span class="tag met"><span class="dot"></span>Metodològic i d\'accés</span>';
}
function frase(o, alias){
  const b = (v,ph) => v ? `<span class="fill">${esc(v)}</span>` : `<span class="blank">${ph}</span>`;
  const crit = (o.valor && o.unitat) ? `<span class="fill">${esc(o.valor)} ${esc(o.unitat)}</span>` : '<span class="blank">criteri d\u2019assoliment</span>';
  return `Al final del ${b(o.trimestre,"trimestre")}, ${esc(alias||"l\u2019alumne/a")} serà capaç de ${b(o.conducta,"conducta observable")} ${b(o.suport,"suport o condició")} ${b(o.context,"context")}, assolint ${crit}.`;
}
/* Text lliure de l'objectiu: si s'ha escrit, substitueix la frase construïda
   amb els camps a tot arreu (document, seguiment i control de qualitat). */
const textLliure = o => (o.lliure || "").trim();
function fraseText(o, alias){
  if(textLliure(o)) return textLliure(o);
  const d = document.createElement("div"); d.innerHTML = frase(o, alias);
  return d.textContent.replace(/\s+/g," ").trim();
}
const objCompleta = o => !!textLliure(o) || !!(o.conducta && o.valor && o.unitat && o.trimestre);

/* Els camps «Instrument d'avaluació» i «Evidència» d'un objectiu admeten més
   d'una entrada i es desen com a llista (instruments[] i evidencies[]). Els
   plans fets amb versions anteriors en tenien una de sola, en un camp de text:
   la conversió es fa aquí mateix, la primera vegada que s'hi accedeix, de
   manera que cap pla desat es queda enrere. */
const CAMP_LLISTA = {instrument:"instruments", evidencia:"evidencies"};
function llistaObj(o, camp){
  const k = CAMP_LLISTA[camp];
  if(!Array.isArray(o[k])) o[k] = o[camp] ? [String(o[camp])] : [];
  if(!o[k].length) o[k].push("");
  return o[k];
}
/* Entrades escrites, sense les caselles que s'han deixat en blanc. */
const llistaPlena = (o, camp) => llistaObj(o, camp).map(x => (x||"").trim()).filter(Boolean);

function qualitat(p){
  const a = alumne(p.alumneId);
  const mats = p.materies;
  /* `pas` i `qc` diuen on cal anar per resoldre cada comprovació: en clicar-hi
     l'assistent salta al pas i fa parpellejar la secció corresponent. */
  const items = [
    {t:"Consten les dades escolars bàsiques (curs, grup i tutor/a)", ok: !!(p.de.curs && p.de.grup && p.de.tutor), pas:1, qc:"escolars"},
    {t:"Hi ha un motiu de justificació marcat", ok: p.just.motius.length > 0, pas:2, qc:"motius"},
    {t:"S'ha redactat la justificació de la necessitat del PI", ok: !!p.just.text, pas:2, qc:"justificacio"},
    {t:"Consten fortaleses, dificultats i interessos", ok: !!(p.just.fortaleses && p.just.dificultats && p.just.interessos), pas:2, qc:"fortaleses"},
    {t:"Hi ha professionals responsables assignats", ok: Object.values(p.prof).some(x => x && x.on), pas:3, qc:"professionals"},
    {t:"Hi ha almenys una matèria o àmbit al pla", ok: mats.length > 0, pas:4, qc:"materies"},
    {t:"Cada matèria té almenys una mesura o suport", ok: mats.length>0 && mats.every(m => p.adaptacions.some(x => x.materia===m || x.materia===DEST_TOTES)), pas:4, qc:"resum"},
    {t:"Totes les mesures estan redactades", ok: p.adaptacions.length>0 && p.adaptacions.every(x => (x.text||"").trim().length > 8), pas:4, qc:"resum"},
    {t:"El pla combina mesures de més d'una intensitat", ok: new Set(p.adaptacions.map(x=>x.intensitat)).size > 1, pas:4, qc:"resum"},
    {t:"Cada matèria té criteris d'avaluació prioritzats", ok: mats.length>0 && mats.every(m => ((p.curr[m]||{}).criteris||[]).length > 0), pas:5, qc:"criteris"},
    {t:"Cada matèria té almenys un objectiu", ok: mats.length>0 && p.objectius.length>0 && mats.every(m => p.objectius.some(o => o.materia===m)), pas:6, qc:"objectius"},
    {t:"Tots els objectius tenen criteri d'assoliment i termini", ok: p.objectius.length>0 && p.objectius.every(objCompleta), pas:6, qc:"objectius"},
    {t:"Tots els objectius indiquen instrument d'avaluació", ok: p.objectius.length>0 && p.objectius.every(o => llistaPlena(o, "instrument").length>0), pas:6, qc:"objectius"},
    {t:"Consta l'acord i la conformitat de la família", ok: !!p.conformitat.familia, pas:8, qc:"conformitat"},
    {t:"Hi ha data de la propera revisió", ok: !!p.proximaRevisio, pas:8, qc:"revisio"}
  ];
  if(a.perfils && a.perfils.length===0)
    items.unshift({t:"L'alumne/a té perfils de necessitats assignats", ok:false, pas:2, qc:"perfils"});
  return items;
}
function pctQualitat(p){
  const q = qualitat(p);
  return Math.round(q.filter(i => i.ok).length / q.length * 100);
}

