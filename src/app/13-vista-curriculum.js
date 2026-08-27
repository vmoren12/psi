/* ---------- 8. Explorador del currículum ---------- */
function renderCurriculum(){
  const f = state.currFilters;
  /* L'explorador s'obre per l'etapa del pla que s'estigui editant; a partir
     d'aquí mana el selector. */
  if(!f.tocat){
    const p = state.currentPi ? pi(state.currentPi) : null;
    if(p) f.etapa = esPlaPrim(p) ? "primaria" : "eso";
  }
  const prim = f.etapa === "primaria";
  const llista = prim ? AREES_PRIM : MATERIES;
  /* En canviar d'etapa, la matèria triada abans ja no hi és. */
  const nom = llista.includes(f.materia) ? f.materia : llista[0];
  const m = prim ? unitat(idPrim(nom)) : mat(nom);
  const q = f.q.toLowerCase();
  const match = t => !q || t.toLowerCase().includes(q);
  $("#view-curriculum").innerHTML = `
  <div class="toolbar">
    <select onchange="state.currFilters.etapa=this.value;state.currFilters.tocat=true;renderCurriculum()">
      <option value="eso" ${prim?"":"selected"}>ESO · annex 3</option>
      <option value="primaria" ${prim?"selected":""}>Primària · annex 2</option>
    </select>
    <select onchange="state.currFilters.materia=this.value;renderCurriculum()">${llista.map(x=>`<option ${nom===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <input type="search" data-cerca="curriculum" placeholder="${prim?"Cerca dins l'àrea":"Cerca dins la matèria"}" value="${esc(f.q)}" oninput="state.currFilters.q=this.value;cercaViva(this,renderCurriculum)">
  </div>
  <div class="card"><div class="card-h"><h2>${esc(m.nom)}</h2>${prim?`<span class="tag warn">Primària</span>`:""}<span class="tag">${esc(m.cursos)}</span><span class="tag">${m.ce.length} competències</span></div>
   <div class="card-b">
    <div class="eyebrow" style="margin-bottom:8px">Competències específiques i criteris d'avaluació</div>
    ${m.ce.map(c => {
      const hi = match(c.desc) || c.grups.some(g => g.items.some(i => match(i.t)));
      if(!hi) return "";
      return `<details class="ce"><summary><span class="cen">CE${c.n}</span><span class="cetxt">${esc(c.desc)}</span></summary>
        <div class="ceb">${c.grups.map(g => `
          <div class="curs-lbl">${esc(g.curs)}</div>
          ${g.items.map(i => `<div class="crit"><span class="code">${i.c}</span><span class="ct">${esc(i.t)}</span></div>`).join("")}`).join("")}
        </div></details>`;
    }).join("")}
    <hr class="rule">
    <div class="eyebrow" style="margin-bottom:8px">Sabers</div>
    ${m.sabers.map(g => `
      <details class="ce"><summary><span class="cen">${esc(g.curs.length>16?g.curs.slice(0,14)+"…":g.curs)}</span><span class="cetxt">${g.temes.length} blocs · ${g.temes.reduce((n,t)=>n+t.items.length,0)} sabers</span></summary>
       <div class="ceb">${g.temes.map(t => `
         <div class="curs-lbl">${esc(t.tema||"Sabers")}</div>
         ${t.items.filter(i=>match(i.t)).map(i => `<div class="crit"><span class="code">·</span><span class="ct">${esc(i.t)}</span></div>`).join("")}`).join("")}
       </div></details>`).join("") || '<p class="muted small">No consten sabers per a aquesta matèria.</p>'}
   </div></div>
  <div class="card"><div class="card-h"><h2>Competències transversals</h2><span class="tag">Annex 4</span></div><div class="card-b">
    ${COMP_TRANSVERSALS.map(c=>`<details class="ce"><summary><span class="cen">${c.id}</span><span class="cetxt">${esc(c.nom)}</span></summary><div class="ceb"><p class="small" style="margin:8px 0;line-height:1.6">${esc(c.desc)}</p></div></details>`).join("")}
  </div></div>
  <p class="legal">Font: <a href="https://dogc.gencat.cat/ca/document-del-dogc/?documentId=938401" target="_blank" rel="noopener">Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació bàsica</a> (DOGC núm. 8762, 29.9.2022): annex 2 (àrees d'educació primària), annex 3 (matèries d'educació secundària obligatòria) i annex 4 (competències transversals). Text incorporat a efectes de consulta docent.</p>`;
}

