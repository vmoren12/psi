/* ---------- 5. Tauler ---------- */
/* ----- Cerca i filtres del tauler -----
   El tauler llista plans, no fitxes: els filtres surten dels plans que hi ha
   i, per tant, no ofereixen mai una opció que deixaria la llista buida. El
   d'etapa és el primer perquè és el que més redueix la llista en un centre
   que treballi les dues etapes. */
function filtresTaulerActius(){
  const f = state.filters;
  return !!(f.q.trim() || f.etapa || f.curs || f.grup || f.tipus || f.estat);
}
function netejaFiltresTauler(){
  state.filters = {q:"", etapa:"", curs:"", grup:"", tipus:"", estat:""};
  renderDashboard();
}
function filtraTauler(){
  const f = state.filters, q = f.q.trim().toLowerCase();
  return state.pis.filter(p => {
    const a = alumne(p.alumneId);
    if(f.etapa && etapaPla(p) !== f.etapa) return false;
    if(f.curs && a.curs !== f.curs) return false;
    if(f.grup && a.grup !== f.grup) return false;
    if(f.tipus && p.tipus !== f.tipus) return false;
    if(f.estat && p.estat !== f.estat) return false;
    if(q && ![a.alias, a.curs, a.grup, p.id, (p.de||{}).tutor||""]
              .join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
}
/* En canviar d'etapa, el curs triat pot ser de l'altra i deixaria la llista
   buida sense que se'n vegi el motiu: es treu. */
function filtreEtapaTauler(v){
  state.filters.etapa = v;
  const hi = state.pis.some(p => (!v || etapaPla(p) === v)
    && alumne(p.alumneId).curs === state.filters.curs);
  if(state.filters.curs && !hi) state.filters.curs = "";
  renderDashboard();
}

function renderDashboard(){
  const pis = state.pis;
  const vig = pis.filter(p => p.estat==="vigent" || p.estat==="seguiment").length;
  const esb = pis.filter(p => p.estat==="esborrany").length;
  const senseRev = pis.filter(p => !p.proximaRevisio && p.estat!=="tancat").length;
  const f = state.filters;
  const llista = filtraTauler();
  const actius = filtresTaulerActius();
  /* Els cursos i els grups que s'ofereixen són els dels plans que queden dins
     de l'etapa triada: així cap opció no deixa la llista buida. */
  const dinsEtapa = p => !f.etapa || etapaPla(p) === f.etapa;
  const valors = fn => [...new Set(pis.filter(dinsEtapa).map(p => fn(alumne(p.alumneId))).filter(Boolean))]
    .sort((x, y) => x.localeCompare(y, "ca"));
  const etapes = ETAPES.filter(e => pis.some(p => etapaPla(p) === e));
  const cursos = valors(a => a.curs);
  const grups = valors(a => a.grup);
  const opcions = (ll, v) => ll.map(x => `<option value="${esc(x)}" ${v===x?"selected":""}>${esc(x)}</option>`).join("");

  $("#view-dashboard").innerHTML = `
  <div class="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">
    ${statCard("Plans registrats", pis.length)}
    ${statCard("Vigents", vig)}
    ${statCard("Esborranys", esb)}
    ${statCard("Sense data de revisió", senseRev, senseRev>0)}
  </div>
  ${state.centre ? "" : `<div class="note" style="margin-bottom:16px">Encara no has indicat el nom del centre. Apareixerà a la capçalera de tots els documents. <button class="btn sm" style="margin-left:6px" onclick="demanaCentre()">Indica'l ara</button></div>`}
  <div class="toolbar">
    <input type="search" data-cerca="tauler" placeholder="Cerca per alumne/a, grup, tutor/a o codi de PI" value="${esc(f.q)}" oninput="state.filters.q=this.value;cercaViva(this,renderDashboard)">
    ${etapes.length > 1 ? `<select onchange="filtreEtapaTauler(this.value)">
      <option value="">Totes les etapes</option>${opcions(etapes, f.etapa)}</select>` : ""}
    <select onchange="state.filters.curs=this.value;renderDashboard()">
      <option value="">Tots els cursos</option>${opcions(cursos, f.curs)}</select>
    <select onchange="state.filters.grup=this.value;renderDashboard()">
      <option value="">Tots els grups</option>${opcions(grups, f.grup)}</select>
    <select onchange="state.filters.tipus=this.value;renderDashboard()">
      <option value="">Tots els tipus de pla</option>
      <option value="metodologic" ${f.tipus==="metodologic"?"selected":""}>Metodològic i d'accés</option>
      <option value="continguts" ${f.tipus==="continguts"?"selected":""}>Curricular</option></select>
    <select onchange="state.filters.estat=this.value;renderDashboard()">
      <option value="">Tots els estats</option>
      ${["esborrany","vigent","seguiment","tancat"].map(e=>`<option value="${e}" ${f.estat===e?"selected":""}>${e[0].toUpperCase()+e.slice(1)}</option>`).join("")}
    </select>
    <span style="flex:1"></span>
    <span class="muted small mono">${llista.length === pis.length ? `${pis.length} pla${pis.length===1?"":"ns"}` : `${llista.length} de ${pis.length}`}</span>
    ${actius ? `<button class="btn sm ghost" onclick="netejaFiltresTauler()">Neteja els filtres</button>` : ""}
  </div>
  <div class="card">
    ${llista.length===0 ? `<div class="empty"><b>Cap pla per mostrar</b>${pis.length===0?"Crea el primer PI o carrega les dades d'exemple per veure com funciona.":"Prova de treure'n algun filtre o de canviar el text de la cerca."}
      ${pis.length===0
        ? `<div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn primary" onclick="nouPi()">Crea un PI</button><button class="btn" onclick="carregaExemple()">Dades d'exemple</button></div>`
        : `<div style="margin-top:14px"><button class="btn" onclick="netejaFiltresTauler()">Neteja els filtres</button></div>`}</div>`
    : `<div class="scroll-x"><table class="stack">
      <thead><tr><th>Alumne/a</th><th>Etapa i curs</th><th>Tipus</th><th>Estat</th><th>Completesa</th><th>Revisió</th><th></th></tr></thead>
      <tbody>${llista.map(p => {
        const a = alumne(p.alumneId), pc = pctQualitat(p);
        return `<tr class="clickable" onclick="obrePi(${jq(p.id)})">
          <td data-l="Alumne/a"><span class="alias">${esc(a.alias)}</span><div class="muted small mono">${esc(p.id)}</div></td>
          <td data-l="Etapa i curs">${esc(a.curs)} · ${esc(a.grup)}</td>
          <td data-l="Tipus">${tipusTag(p.tipus)}</td>
          <td data-l="Estat">${estatTag(p.estat)}</td>
          <td data-l="Completesa"><div style="min-width:88px"><span class="mono small">${pc}%</span><div class="qc-bar"><i style="width:${pc}%"></i></div></div></td>
          <td data-l="Revisió">${p.proximaRevisio ? dataCat(p.proximaRevisio) : '<span class="tag warn">Sense data</span>'}</td>
          <td style="text-align:right"><button class="btn sm" onclick="event.stopPropagation();obreDoc(${jq(p.id)})">Document</button></td>
        </tr>`;
      }).join("")}</tbody></table></div>`}
  </div>
  <p class="legal">Aquesta eina segueix el model de pla de suport individualitzat del Departament d'Educació per a l'educació bàsica i el currículum del Decret 175/2022, de 27 de setembre: annex 2 (àrees d'educació primària) i annex 3 (matèries d'educació secundària obligatòria). Cada centre pot adaptar-ne el model.</p>`;
}
function statCard(l, v, alerta){
  return `<div class="stat" style="background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:13px 15px">
    <span class="eyebrow">${l}</span>
    <b style="display:block;font-family:var(--serif);font-size:28px;font-weight:400;line-height:1.1;margin-top:5px;${alerta?"color:var(--alert)":""}">${v}</b></div>`;
}
async function demanaCentre(){
  const v = await demana("Nom del centre educatiu", "Nom del centre (apareix a la capçalera de tots els documents)",
                         state.centre, "Institut …");
  if(v !== null){ state.centre = v; desa(); render(); toast("Nom del centre desat."); }
}

