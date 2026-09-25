/* ---------- 10. Seguiment ---------- */
/* Esborrany de valoració d'un pla, creat a demanda. Els controls del formulari
   hi escriuen a través d'aquesta funció: així el codi del pla, que l'usuari pot
   canviar, mai no s'interpola dins d'un accés a l'objecte. */
function draft(id, p){
  const d = state.draftValoracions[id] = state.draftValoracions[id]
    || {valoracions:{}, observacions:"", trimestre:TRIMESTRES[0], decisio:"Continuïtat",
        autor: (p && p.de.tutor) || ""};
  return d;
}
/* ----- Cerca i filtres del seguiment -----
   La pestanya s'obre amb els plans que hi ha en marxa (vigents i en seguiment),
   tinguin objectius o no: un pla sense objectius també s'ha de poder veure, per
   avisar que en falten i per poder-hi deixar notes igualment. La resta d'estats
   es consulten canviant el filtre, de manera que l'històric no queda amagat. */
const SEG_ESTATS = [
  ["actius", "Vigents i en seguiment"],
  ["vigent", "Només vigents"],
  ["seguiment", "Només en seguiment"],
  ["esborrany", "Només esborranys"],
  ["tancat", "Només tancats"],
  ["", "Tots els estats"]
];

function filtresSeguimentActius(){
  const f = state.segFilters;
  return !!(f.q.trim() || f.curs || f.grup || f.objectius || f.estat !== "actius");
}
function netejaFiltresSeguiment(){
  state.segFilters = {q:"", curs:"", grup:"", estat:"actius", objectius:""};
  renderSeguiment();
}
function filtraSeguiment(){
  const f = state.segFilters;
  const q = f.q.trim().toLowerCase();
  return state.pis.filter(p => {
    const a = alumne(p.alumneId);
    if(f.estat === "actius"){ if(p.estat !== "vigent" && p.estat !== "seguiment") return false; }
    else if(f.estat && p.estat !== f.estat) return false;
    if(f.curs && a.curs !== f.curs) return false;
    if(f.grup && a.grup !== f.grup) return false;
    if(f.objectius === "amb" && !p.objectius.length) return false;
    if(f.objectius === "sense" && p.objectius.length) return false;
    if(q && ![a.alias, a.curs, a.grup, p.id, p.de.tutor].join(" ").toLowerCase().includes(q)) return false;
    return true;
  }).sort((x, y) => {
    const ax = alumne(x.alumneId), ay = alumne(y.alumneId);
    return (ax.grup||"").localeCompare(ay.grup||"", "ca")
        || (ax.alias||"").localeCompare(ay.alias||"", "ca")
        || String(x.id).localeCompare(String(y.id), "ca");
  });
}

/* Porta a definir objectius al pas 6 del pla indicat. */
function vesAObjectius(id){
  state.currentPi = id;
  state.step = 6;
  go("pi");
  vesA(6, "objectius");
}
function triaSeguiment(id){
  state.seguimentPi = id;
  renderSeguiment();
  requestAnimationFrame(() => {
    const el = $("#seg-detall");
    if(el){ try{ el.scrollIntoView({block:"start", behavior:"smooth"}); }catch(e){ el.scrollIntoView(); } }
  });
}
const ultimaValoracio = p => p.seguiments.length ? p.seguiments[p.seguiments.length-1] : null;

function renderSeguiment(){
  const f = state.segFilters;
  const llista = filtraSeguiment();
  const total = state.pis.length;
  const actius = filtresSeguimentActius();
  const cursos = [...new Set(state.pis.map(p => alumne(p.alumneId).curs).filter(Boolean))].sort();
  const grups = [...new Set(state.pis.map(p => alumne(p.alumneId).grup).filter(Boolean))].sort();

  if(total === 0){
    $("#view-seguiment").innerHTML = `<div class="card"><div class="empty"><b>Encara no hi ha cap pla</b>Crea un PI per poder-ne fer el seguiment.
      <div style="margin-top:14px"><button class="btn primary" onclick="nouPi()">Crea un PI</button></div></div></div>`;
    return;
  }

  const barra = `
  <div class="toolbar">
    <input type="search" data-cerca="seguiment" placeholder="Cerca per alumne/a, grup, tutor/a o codi de PI" value="${esc(f.q)}"
      oninput="state.segFilters.q=this.value;cercaViva(this,renderSeguiment)">
    <select onchange="state.segFilters.curs=this.value;renderSeguiment()">
      <option value="">Tots els cursos</option>
      ${cursos.map(x=>`<option value="${esc(x)}" ${f.curs===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <select onchange="state.segFilters.grup=this.value;renderSeguiment()">
      <option value="">Tots els grups</option>
      ${grups.map(x=>`<option value="${esc(x)}" ${f.grup===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <select onchange="state.segFilters.estat=this.value;renderSeguiment()">
      ${SEG_ESTATS.map(e=>`<option value="${e[0]}" ${f.estat===e[0]?"selected":""}>${e[1]}</option>`).join("")}</select>
    <select onchange="state.segFilters.objectius=this.value;renderSeguiment()">
      <option value="">Amb objectius o sense</option>
      <option value="amb" ${f.objectius==="amb"?"selected":""}>Amb objectius definits</option>
      <option value="sense" ${f.objectius==="sense"?"selected":""}>Sense objectius definits</option></select>
    <span style="flex:1"></span>
    <span class="muted small mono">${llista.length === total ? `${total} pla${total===1?"":"ns"}` : `${llista.length} de ${total}`}</span>
    ${actius ? `<button class="btn sm ghost" onclick="netejaFiltresSeguiment()">Neteja els filtres</button>` : ""}
  </div>`;

  if(llista.length === 0){
    $("#view-seguiment").innerHTML = barra + `<div class="card"><div class="empty"><b>Cap pla amb aquests filtres</b>${
      f.estat === "actius"
        ? "Cap pla no és vigent ni en seguiment ara mateix. Canvia el filtre d'estat si vols veure els esborranys o els plans tancats."
        : "Prova de treure'n algun o de canviar el text de la cerca."}
      <div style="margin-top:14px"><button class="btn" onclick="netejaFiltresSeguiment()">Neteja els filtres</button></div></div></div>`;
    return;
  }

  /* Si la tria anterior ja no encaixa amb els filtres, s'agafa la primera. */
  const sel = llista.find(p => p.id === state.seguimentPi) || llista[0];
  state.seguimentPi = sel.id;

  const taula = `
  <div class="card"><div class="card-h"><h2>Plans a seguir</h2><span class="tag">${llista.length}</span></div>
    <div class="scroll-x"><table class="stack">
    <thead><tr><th>Alumne/a</th><th>Curs i grup</th><th>Estat</th><th>Objectius</th><th>Última valoració</th><th>Registrades</th></tr></thead>
    <tbody>${llista.map(p => {
      const a = alumne(p.alumneId), u = ultimaValoracio(p);
      return `<tr class="clickable ${p.id===sel.id?"sel":""}" onclick="triaSeguiment(${jq(p.id)})">
        <td data-l="Alumne/a"><span class="alias">${esc(a.alias)}</span><div class="muted small mono">${esc(p.id)}</div></td>
        <td data-l="Curs i grup">${esc(a.curs)} · ${esc(a.grup)}</td>
        <td data-l="Estat">${estatTag(p.estat)}</td>
        <td data-l="Objectius">${p.objectius.length
          ? `<span class="tag met">${p.objectius.length}</span>`
          : `<span class="tag warn">Sense objectius</span>`}</td>
        <td data-l="Última valoració">${u ? `${dataCat(u.data)}<div class="muted small">${esc(u.trimestre)}</div>` : '<span class="muted small">—</span>'}</td>
        <td data-l="Registrades">${p.seguiments.length || '<span class="muted small">0</span>'}</td>
      </tr>`;
    }).join("")}</tbody></table></div>
  </div>`;

  $("#view-seguiment").innerHTML = barra + taula + detallSeguiment(sel);
}

/* Fitxa de valoració i històric del pla triat. Un pla sense objectius hi arriba
   igual: s'hi avisa que en falten, s'ofereix anar-los a definir i s'hi pot
   registrar igualment una nota lliure de seguiment. */
function detallSeguiment(sel){
  const a = alumne(sel.alumneId);
  const d = draft(sel.id, sel);
  const senseObj = sel.objectius.length === 0;
  const teNota = !!(d.observacions||"").trim();
  const nVal = Object.keys(d.valoracions).filter(k => sel.objectius.some(o => o.id === k)).length;
  const potRegistrar = nVal > 0 || teNota;
  return `
  <div class="card" id="seg-detall"><div class="card-h">
    <h2>${esc(a.alias)} <span class="mono small muted">${esc(sel.id)}</span></h2>
    ${estatTag(sel.estat)}
    <button class="btn sm ghost" onclick="obrePi(${jq(sel.id)})">Obre el pla</button>
    <button class="btn sm" onclick="obreDoc(${jq(sel.id)})">Document</button>
  </div><div class="card-b">

    ${senseObj ? `<div class="note" style="margin:0 0 14px">
      <b>Aquest pla encara no té cap objectiu mesurable.</b> El seguiment del PI es documenta valorant els objectius del <b>pas 6</b>: sense objectius no es pot deixar constància del grau d'assoliment. Hi pots escriure notes igualment, però convé definir-los.
      <div style="margin-top:10px"><button class="btn sm" onclick="vesAObjectius(${jq(sel.id)})">Vés al pas 6 i defineix-ne</button></div>
    </div>` : ""}

    <div class="row g3">
      <label class="field"><span class="lbl">Trimestre</span><select onchange="draft(${jq(sel.id)}).trimestre=this.value;renderSeguiment()">${TRIMESTRES.map(t=>`<option ${d.trimestre===t?"selected":""}>${esc(t)}</option>`).join("")}</select></label>
      <label class="field"><span class="lbl">Decisió</span><select onchange="draft(${jq(sel.id)}).decisio=this.value">${["Continuïtat","Revisió","Finalització"].map(t=>`<option ${d.decisio===t?"selected":""}>${t}</option>`).join("")}</select></label>
      <label class="field"><span class="lbl">Responsable</span><input type="text" value="${esc(d.autor)}" onchange="draft(${jq(sel.id)}).autor=this.value"></label>
    </div>

    ${grupsTrimestre(sel.objectius).map(([t, obs]) => `<div class="seg-tri${t===d.trimestre?" actual":""}">
      <div class="grp-title"><span class="eyebrow">${esc(t || "Sense trimestre assignat")}</span>
        <span class="muted small">${obs.length} objectiu${obs.length===1?"":"s"}</span>
        ${t===d.trimestre ? `<span class="tag met">Trimestre d'aquesta valoració</span>` : ""}</div>
      ${obs.map(o=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div class="small" style="margin-bottom:7px"><span class="tag">${esc(o.materia||"—")}</span> ${esc(fraseText(o, a.alias))}</div>
        <div class="scale">${ESCALA.map(e=>`<button aria-pressed="${d.valoracions[o.id]===e}" onclick="draft(${jq(sel.id)}).valoracions[${jq(o.id)}]=${jq(e)};renderSeguiment()">${e}</button>`).join("")}</div>
      </div>`).join("")}
    </div>`).join("")}

    <label class="field" style="margin-top:14px"><span class="lbl">Observacions i notes de seguiment</span>
      <textarea onchange="draft(${jq(sel.id)}).observacions=this.value;renderSeguiment()"
        placeholder="${senseObj ? "Escriu-hi la nota de seguiment: com va el pla, què s'ha ajustat i què cal revisar." : "Com ha anat el trimestre, què s'ha ajustat i què cal revisar."}">${esc(d.observacions)}</textarea></label>

    <div style="display:flex;gap:11px;align-items:center;flex-wrap:wrap">
      <button class="btn primary" onclick="registraSeguiment(${jq(sel.id)})" ${potRegistrar?"":"disabled"}>Registra la valoració</button>
      <span class="muted small">${potRegistrar
        ? (nVal
            ? `${nVal} objectiu${nVal===1?"":"s"} valorat${nVal===1?"":"s"}${teNota?" i una nota escrita":""}.`
            : "Es registrarà com a nota de seguiment, sense valoració d'objectius.")
        : (senseObj ? "Escriu una nota per poder-la registrar." : "Valora almenys un objectiu o escriu una nota.")}</span>
    </div>
  </div></div>

  <div class="card"><div class="card-h"><h2>Històric</h2><span class="tag">${sel.seguiments.length}</span></div><div class="card-b">
    ${sel.seguiments.length===0 ? `<p class="muted small" style="margin:0">Encara no hi ha cap valoració registrada per a aquest pla.</p>` :
    `<div class="timeline">${sel.seguiments.slice().reverse().map(s=>{
      const items = Object.entries(s.valoracions||{}).map(kv=>{
        const o = sel.objectius.find(x=>x.id===kv[0]);
        return o ? `<li class="small">${esc(o.materia||"—")} · ${esc(o.trimestre||"sense trimestre")}: <b>${esc(kv[1])}</b></li>` : "";
      }).filter(Boolean);
      return `<div class="ev">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>${esc(s.trimestre)}</b><span class="muted small">${dataCat(s.data)}</span>
        <span class="tag ${s.decisio==="Finalització"?"":"met"}">${esc(s.decisio)}</span>
        ${items.length ? "" : `<span class="tag">Nota de seguiment</span>`}</div>
      ${items.length ? `<ul style="margin:7px 0;padding-left:18px">${items.join("")}</ul>` : ""}
      ${s.observacions?`<p class="small" style="margin:5px 0;color:var(--ink2)">${esc(s.observacions)}</p>`:""}
      <div class="muted small mono">${esc(s.autor||"")}</div></div>`;
    }).join("")}</div>`}
  </div></div>`;
}

/* Objectius agrupats pel trimestre que tenen assignat al pas 6, en l'ordre
   dels trimestres; els que no en tenen, al final. */
function grupsTrimestre(obs){
  const g = TRIMESTRES.map(t => [t, obs.filter(o => o.trimestre === t)]);
  g.push(["", obs.filter(o => !TRIMESTRES.includes(o.trimestre))]);
  return g.filter(([, l]) => l.length);
}

/* Es registra una entrada si hi ha alguna cosa a deixar constància: objectius
   valorats, una nota lliure, o totes dues. Un pla sense objectius definits
   només pot deixar la nota, i és igualment una entrada vàlida de l'històric. */
function registraSeguiment(id){
  const p = pi(id);
  if(!p) return;
  const d = draft(id, p);
  /* Les valoracions d'objectius que ja s'han esborrat del pla no compten. */
  const vals = {};
  Object.keys(d.valoracions||{}).forEach(k => {
    if(p.objectius.some(o => o.id === k)) vals[k] = d.valoracions[k];
  });
  const nota = (d.observacions||"").trim();
  if(!Object.keys(vals).length && !nota){
    toast(p.objectius.length ? "Valora almenys un objectiu o escriu una nota." : "Escriu una nota per poder-la registrar.");
    return;
  }
  p.seguiments.push({id:uid("SG"), data:avui(), trimestre:d.trimestre, valoracions:vals,
                     observacions:nota, decisio:d.decisio, autor:d.autor});
  if(p.estat==="vigent") p.estat = "seguiment";
  delete state.draftValoracions[id];
  desa(); renderSeguiment();
  toast(Object.keys(vals).length ? "Valoració registrada." : "Nota de seguiment registrada.");
}

