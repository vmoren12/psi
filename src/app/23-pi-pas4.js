/* ----- Pas 4: mesures i suports per matèria (secció 5 del model oficial) -----
   Aquest pas concentra tota la proposta de mesures i suports del pla:
   la selecció de matèries, les mesures triades del banc (universals,
   addicionals i intensives) i la concreció escrita per a cada matèria.    */

const DEST_TOTES = "Totes les matèries del PI";

/* Converteix una mesura del catàleg en un element del pla. */
function itemMesura(b, materia){
  return {id:uid("A"), adId:b.id, titol:b.titol, text:(b.concrecio || b.desc),
          materia: materia || DEST_TOTES, tipus:b.tipus, bloc:b.bloc,
          intensitat:b.intensitat, concrecio:""};
}

function mesuresDe(p, materia){ return p.adaptacions.filter(x => x.materia===materia); }
function comptaIntensitats(p){
  const c = {Universal:0, Addicional:0, Intensiva:0};
  p.adaptacions.forEach(x => { if(c[x.intensitat]!==undefined) c[x.intensitat]++; });
  return c;
}
function tagIntensitat(i){
  const info = INTENSITAT_INFO[i] || {tag:""};
  return `<span class="tag ${info.tag}">${esc(i)}</span>`;
}

function pas4(p, a){
  const sel = p.materies;
  const prim = esPlaPrim(p);
  const c = comptaIntensitats(p);
  const total = p.adaptacions.length;
  return `
  <div class="card"><div class="card-h"><span class="num">5</span><h2>Proposta educativa · Mesures i suports</h2>
    ${(a.perfils||[]).some(x => plantillaPerfil(x))
      ? `<button class="btn sm" onclick="dialegProposta('${p.alumneId}')">Proposta segons el perfil</button>` : ""}
    <button class="btn primary sm" onclick="obreBanc('${esc(DEST_TOTES)}')">Banc de mesures</button>
    ${total ? `<button class="btn sm ghost danger" onclick="netejaMesures()">Neteja totes les mesures</button>` : ""}</div><div class="card-b">
    <div class="note info" style="margin-bottom:14px">Selecciona ${prim?"les àrees":"les matèries, àmbits o projectes"} ${prim?"afectades":"afectats"} pel pla. Per a cadascuna, descriu les mesures i els suports <b>universals, addicionals i/o intensius</b> que es preveuen utilitzar. Pots triar-los del banc de mesures del Departament o escriure'n de propis.</div>
    <div class="field" data-qc="materies"><span class="lbl">${prim?"Àrees d'educació primària (annex 2 del Decret 175/2022)":"Matèries del currículum (Decret 175/2022)"}</span>
      <div class="chips">${matsEtapa(p).map(m=>`<button type="button" class="chip" aria-pressed="${sel.includes(m)}" onclick="toggleMateria(${jq(m)})">${esc(m)}</button>`).join("")}</div>
    </div>
    <div class="field" style="margin-bottom:0"><span class="lbl">Altres files del model oficial</span>
      <div class="chips">${EXTRA_FILES.map(m=>`<button type="button" class="chip" aria-pressed="${sel.includes(m)}" onclick="toggleMateria(${jq(m)})">${esc(m)}</button>`).join("")}</div>
    </div>
  </div></div>

  <div class="card" data-qc="resum"><div class="card-h"><h2>Resum de la proposta</h2>
    <span class="tag">${total} mesur${total===1?"a":"es"}</span>
    ${c.Universal?`<span class="tag met">${c.Universal} universals</span>`:""}
    ${c.Addicional?`<span class="tag warn">${c.Addicional} addicionals</span>`:""}
    ${c.Intensiva?`<span class="tag alert">${c.Intensiva} intensives</span>`:""}</div>
   <div class="card-b" style="padding:12px 16px">
    ${c.Intensiva ? `<div class="note alert" style="margin:0 0 10px">Aquest pla inclou <b>mesures i suports intensius</b>. Requereixen l'informe de reconeixement de necessitats específiques de suport educatiu elaborat per l'EAP i han de constar a l'expedient acadèmic de l'alumne/a. Decret 150/2017, articles 10 i 11.</div>` : ""}
    <p class="small muted" style="margin:0">Les mesures assignades a «${esc(DEST_TOTES)}» s'apliquen a totes les matèries d'aquest pla. Pots reassignar qualsevol mesura a una matèria concreta amb el selector de cada fitxa.</p>
   </div></div>

  ${blocMesures(p, a, DEST_TOTES, "Mesures i suports transversals", "S'apliquen a totes les matèries d'aquest pla.")}

  ${sel.length===0
    ? `<div class="card"><div class="card-b"><div class="empty"><b>Cap ${prim?"àrea seleccionada":"matèria seleccionada"}</b>Tria almenys una ${prim?"àrea":"matèria"} per continuar.</div></div></div>`
    : sel.map(m => blocMesures(p, a, m, m, "")).join("")}`;
}

/* Un bloc per destinació (transversal o matèria concreta). */
function blocMesures(p, a, dest, titol, subtitol){
  const items = mesuresDe(p, dest);
  const esMateria = dest !== DEST_TOTES;
  const concrecio = esMateria ? (p.mesures[dest] || "") : (p.mesures[DEST_TOTES] || "");
  return `
  <div class="card"><div class="card-h">
    <h2>${esc(titol)}</h2><span class="tag">${items.length}</span>
    <button class="btn sm primary" onclick="obreBanc(${jq(dest)})">+ Banc de mesures</button>
    <button class="btn sm ghost" onclick="mesuraLliure(${jq(dest)})">+ Mesura pròpia</button>
  </div><div class="card-b">
    ${subtitol?`<p class="small muted" style="margin:0 0 12px">${esc(subtitol)}</p>`:""}
    ${items.length===0
      ? `<div class="empty" style="padding:22px 14px"><b>Encara no hi ha cap mesura</b>Obre el banc de mesures per triar-ne, o escriu-ne una de pròpia.</div>`
      : items.map(x => fitxaMesuraPI(p, x)).join("")}
    <label class="field" style="margin:14px 0 0"><span class="lbl">Concreció, matisos i observacions${esMateria?" per a "+esc(dest):" generals"}</span>
      <textarea placeholder="Text lliure que s'afegirà a la fila d'aquesta matèria al document oficial." onchange="up(p=>p.mesures[${jq(esMateria?dest:DEST_TOTES)}]=this.value)">${esc(concrecio)}</textarea></label>
  </div></div>`;
}

/* Fitxa d'una mesura ja incorporada al pla. */
function fitxaMesuraPI(p, x){
  const dest = [DEST_TOTES, ...p.materies];
  const orig = x.adId ? mesura(x.adId) : null;
  return `<div class="mes-item">
    <div class="mes-head">
      <b>${esc(x.titol)}</b>
      <div class="mes-tags">
        ${tagIntensitat(x.intensitat)}
        ${x.bloc?`<span class="tag">${esc(x.bloc)}</span>`:""}
        ${x.adId?`<span class="tag mono small">${esc(x.adId)}</span>`:`<span class="tag">Pròpia del centre</span>`}
      </div>
      <button class="btn sm ghost danger" onclick="treuMesura('${x.id}')" aria-label="Treu la mesura">Treu</button>
    </div>
    <textarea class="mes-text" onchange="up(p=>itemMes('${x.id}').text=this.value)" placeholder="Redacció de la mesura tal com constarà al document.">${esc(x.text)}</textarea>
    ${orig && orig.concrecio && orig.desc !== x.text ? `<details class="mes-ref"><summary>Què és aquesta mesura</summary><p>${esc(orig.desc)}</p><p class="legal">${esc(orig.font)}</p></details>` : ""}
    <div class="mes-foot">
      <label class="mes-f"><span>Àmbit</span>
        <select onchange="upR(p=>itemMes('${x.id}').materia=this.value)">
          ${dest.map(d=>`<option ${x.materia===d?"selected":""}>${esc(d)}</option>`).join("")}</select></label>
      <label class="mes-f"><span>Intensitat</span>
        <select onchange="upR(p=>itemMes('${x.id}').intensitat=this.value)">
          ${INTENSITATS.map(i=>`<option ${x.intensitat===i?"selected":""}>${i}</option>`).join("")}</select></label>
      <label class="mes-f"><span>Eix</span>
        <select onchange="up(p=>itemMes('${x.id}').tipus=this.value)">
          ${TIPUS_MESURA.map(t=>`<option ${x.tipus===t?"selected":""}>${esc(t)}</option>`).join("")}</select></label>
    </div>
  </div>`;
}

function itemMes(id){ return P().adaptacions.find(x => x.id===id); }
function treuMesura(id){ upR(p => p.adaptacions = p.adaptacions.filter(x => x.id!==id)); toast("Mesura treta del pla."); }
/* Treu d'una tirada totes les mesures carregades al pla. Les concrecions
   escrites per matèria i la selecció de matèries es mantenen: són feina
   pròpia i no depenen de les mesures triades. */
async function netejaMesures(){
  const p = P(), n = p.adaptacions.length;
  if(!n) return;
  const c = comptaIntensitats(p);
  const ok = await confirmaEsborrat("Neteja totes les mesures",
    `Es trauran del pla <b>${esc(p.id)}</b> ${n===1 ? "la mesura carregada" : `les <b>${n}</b> mesures carregades`}:`,
    [c.Universal ? `${c.Universal} universal${c.Universal===1?"":"s"}` : "",
     c.Addicional ? `${c.Addicional} addicional${c.Addicional===1?"":"s"}` : "",
     c.Intensiva ? `${c.Intensiva} intensiv${c.Intensiva===1?"a":"es"}` : ""].filter(Boolean),
    {peu:"Les matèries seleccionades i els textos de concreció de cada matèria es mantenen. No es pot desfer.",
     confirma:"Neteja-les"});
  if(!ok) return;
  upR(p => p.adaptacions = []);
  toast(n===1 ? "S'ha tret la mesura del pla." : `S'han tret les ${n} mesures del pla.`);
}
function mesuraLliure(dest){
  upR(p => p.adaptacions.push({id:uid("A"), adId:"", titol:"Mesura pròpia", text:"",
      materia:dest||DEST_TOTES, tipus:TIPUS_MESURA[0], bloc:"", intensitat:"Universal", concrecio:""}));
  toast("Escriu el títol i la redacció de la mesura.");
}
function toggleMateria(m){
  up(p => {
    const i = p.materies.indexOf(m);
    if(i>=0){
      p.materies.splice(i,1);
      delete p.mesures[m]; delete p.curr[m];
      /* Les mesures assignades a la matèria retirada passen a ser transversals
         perquè no es perdi feina feta sense avisar. */
      p.adaptacions.forEach(x => { if(x.materia===m) x.materia = DEST_TOTES; });
    } else p.materies.push(m);
  });
  renderPi();
}

