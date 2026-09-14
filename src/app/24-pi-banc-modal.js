/* ---------------------------------------------------------------------------
   Banc de mesures en finestra emergent
   --------------------------------------------------------------------------- */

function obreBanc(dest){
  state.bm = Object.assign(state.bm || {}, {obert:true, desti:dest||DEST_TOTES, afegides:0,
                                            suggClau:null, suggIds:null});
  openModal("Banc de mesures i suports", bancModalHTML(), true);
  /* El cos dels resultats es repinta sol; així la cerca no perd el focus. */
  pintaResultatsBanc();
  setTimeout(() => { const i = $("#bm-q"); if(i) i.focus(); }, 30);
}

function bancModalHTML(){
  const p = P(), a = p ? alumne(p.alumneId) : null;
  const f = state.bm;
  const dest = p ? [DEST_TOTES, ...p.materies] : [];
  return `<div class="bm">
   <div class="bm-bar">
     <div class="bm-tabs" role="tablist">
       ${["", ...INTENSITATS].map(i=>`
         <button role="tab" data-i="${esc(i)}" aria-selected="${f.intensitat===i}" class="bm-tab ${i?("i-"+i.toLowerCase()):""}"
           onclick="state.bm.intensitat=${jq(i)};pintaResultatsBanc()">${i||"Totes"}</button>`).join("")}
     </div>
     <div class="bm-filters">
       <input type="search" id="bm-q" placeholder="Cerca per títol, contingut o codi…" value="${esc(f.q)}"
         oninput="state.bm.q=this.value;pintaResultatsBanc()">
       <select onchange="state.bm.bloc=this.value;pintaResultatsBanc()">
         <option value="">Tots els blocs</option>
         ${BLOCS_MESURA.map(b=>`<option value="${esc(b)}" ${f.bloc===b?"selected":""}>${esc(b)}</option>`).join("")}</select>
       <select onchange="state.bm.perfil=this.value;pintaResultatsBanc()">
         <option value="">Tots els perfils</option>
         ${a && a.perfils.length ? `<option value="__alumne" ${f.perfil==="__alumne"?"selected":""}>▸ Perfils de l'alumne/a</option>` : ""}
         ${PERFILS.map(x=>`<option value="${esc(x)}" ${f.perfil===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
       <select onchange="state.bm.materia=this.value;pintaResultatsBanc()">
         <option value="">Totes les matèries</option>
         ${MATERIES_BANC().map(x=>`<option value="${esc(x)}" ${f.materia===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
     </div>
     ${p ? `<div class="bm-dest">
       <label class="mes-f" style="flex:1"><span>Afegeix a</span>
         <select onchange="state.bm.desti=this.value">
           ${dest.map(d=>`<option value="${esc(d)}" ${f.desti===d?"selected":""}>${esc(d)}</option>`).join("")}</select></label>
       <span class="bm-count" id="bm-count"></span>
       <button class="btn sm" onclick="closeModal()">Fet</button>
     </div>` : `<div class="bm-dest"><span class="muted small">Obre un PI per poder-hi afegir mesures.</span>
       <span class="bm-count" id="bm-count"></span><button class="btn sm x" title="Tanca" aria-label="Tanca" onclick="closeModal()">&times;</button></div>`}
   </div>
   <div class="bm-body" id="bm-results"></div>
  </div>`;
}

/* Filtratge del catàleg segons l'estat de la finestra. */
function filtraBanc(){
  const f = state.bm, p = P(), a = p ? alumne(p.alumneId) : null;
  const q = (f.q||"").trim().toLowerCase();
  const perfilsAl = a ? a.perfils : [];
  return MESURES().filter(b => {
    if(f.intensitat && b.intensitat !== f.intensitat) return false;
    if(f.bloc && b.bloc !== f.bloc) return false;
    if(f.materia && !(b.materies.includes("*") || b.materies.includes(f.materia))) return false;
    if(f.perfil === "__alumne"){ if(!b.perfils.some(x => perfilsAl.includes(x))) return false; }
    else if(f.perfil && !b.perfils.includes(f.perfil) && b.perfils.length) return false;
    if(q && !(b.titol+" "+b.desc+" "+b.concrecio+" "+b.id+" "+b.bloc+" "+b.tipus).toLowerCase().includes(q)) return false;
    return true;
  });
}

function pintaResultatsBanc(){
  const cos = $("#bm-results"); if(!cos) return;
  /* Les pestanyes viuen fora del contenidor de resultats: cal repintar-ne
     l'estat a mà perquè el botó actiu es vegi seleccionat. */
  document.querySelectorAll(".bm-tab").forEach(t =>
    t.setAttribute("aria-selected", String((t.dataset.i||"") === (state.bm.intensitat||""))));
  const p = P(), a = p ? alumne(p.alumneId) : null;
  const llista = filtraBanc();
  const jaAl = id => p && p.adaptacions.some(x => x.adId===id);

  /* Suggeriments pels perfils de l'alumne/a, només sense cerca ni filtre de perfil.
     La llista es congela mentre no canviï la pestanya d'intensitat: si es
     recalculés a cada repintada, la mesura que s'acaba d'afegir en
     desapareixeria en comptes de quedar-s'hi marcada en verd com a «Al pla». */
  const f = state.bm;
  const capFiltre = !f.q && !f.perfil && !f.bloc && !f.materia;
  const teSugg = !!(a && a.perfils.length && capFiltre);
  const clauSugg = f.intensitat || "";
  if(teSugg && f.suggClau !== clauSugg){
    f.suggClau = clauSugg;
    f.suggIds = llista.filter(b => b.perfils.some(x => a.perfils.includes(x)) && !jaAl(b.id))
                      .slice(0, 6).map(b => b.id);
  }
  const sugg = teSugg ? (f.suggIds || []).map(mesura).filter(Boolean) : [];

  const perBloc = {};
  llista.forEach(b => (perBloc[b.bloc] = perBloc[b.bloc] || []).push(b));

  const c = $("#bm-count");
  if(c) c.textContent = `${llista.length} de ${MESURES().length}` + (state.bm.afegides ? ` · ${state.bm.afegides} afegides` : "");

  cos.innerHTML = `
   ${seccioEstrategies(p, f.q, f.perfil, a ? a.perfils : [])}
   ${sugg.length ? `<div class="bm-sugg">
     <div class="grp-title"><span class="eyebrow">Suggerides pels perfils de ${esc(a.alias)}</span>
       <span class="muted small">${a.perfils.map(esc).join(" · ")}</span></div>
     <div class="bank">${sugg.map(b => fitxaBanc(b, jaAl(b.id))).join("")}</div>
     <hr class="rule"></div>` : ""}
   ${llista.length===0 ? `<div class="empty"><b>Cap resultat</b>Prova amb altres paraules o treu algun filtre.</div>` :
     BLOCS_MESURA.concat(["Mesures pròpies del centre"]).filter(b => perBloc[b]).map(b => `
       <div class="grp-title"><span class="eyebrow">${esc(b)}</span><span class="muted small">${perBloc[b].length}</span></div>
       ${notaBloc(b)}
       <div class="bank">${perBloc[b].map(x => fitxaBanc(x, jaAl(x.id))).join("")}</div>`).join("")}`;
}

/* Recordatori normatiu als blocs que en necessiten. */
function notaBloc(b){
  const k = b==="Suports intensius" ? "Intensiva" : b==="Suports addicionals del centre" ? "Addicional" : "";
  return k ? `<p class="legal" style="margin:2px 0 9px">${esc(INTENSITAT_INFO[k].nota)}</p>` : "";
}

/* Fitxa d'una mesura dins del banc. */
function fitxaBanc(b, ja){
  const p = P();
  return `<article class="ad ${ja?"ja":""}">
    <h3>${esc(b.titol)}</h3>
    <p>${esc(b.desc)}</p>
    ${b.concrecio ? `<p class="ad-conc"><span class="eyebrow">Com es concreta al PI</span>${esc(b.concrecio)}</p>` : ""}
    ${b.perfils.length ? `<p class="ad-perf">${b.perfils.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</p>` : ""}
    <div class="foot">
      ${tagIntensitat(b.intensitat)}
      <span class="tag">${esc(b.tipus)}</span>
      ${b.editada ? `<span class="tag edit" title="Mesura del catàleg amb el text o les etiquetes modificats pel centre">Modificada pel centre</span>` : ""}
      <button class="btn sm ghost" style="margin-left:auto" title="Edita el text i les etiquetes d'aquesta mesura" onclick="editaMesura(${jq(b.id)})">Edita</button>
      ${p ? (ja
        ? `<span class="btn sm ok" aria-disabled="true">✓ Al pla</span>`
        : `<button class="btn sm primary" onclick="afegeixMesura(${jq(b.id)})">Afegeix</button>`) : ""}
    </div>
    <p class="legal ad-font">${esc(b.font)}</p>
  </article>`;
}

function afegeixMesura(id){
  const b = mesura(id); if(!b) return;
  const dest = (state.bm && state.bm.desti) || DEST_TOTES;
  let dup = false;
  up(p => {
    if(p.adaptacions.some(x => x.adId===id)){ dup = true; return; }
    p.adaptacions.push(itemMesura(b, dest));
  });
  if(dup){ toast("Aquesta mesura ja consta al pla."); return; }
  state.bm.afegides++;
  pintaResultatsBanc();
  if(state.view==="banc") renderBanc();
  toast(`«${b.titol}» afegida a ${dest}.`);
}

