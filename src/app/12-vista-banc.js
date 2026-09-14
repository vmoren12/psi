/* ---------- 7. Banc de mesures i suports ---------- */
function renderBanc(){
  const f = state.bankFilters;
  const p = state.currentPi ? pi(state.currentPi) : null;
  const a = p ? alumne(p.alumneId) : null;
  const q = (f.q||"").trim().toLowerCase();
  const llista = MESURES().filter(b =>
    (!f.intensitat || b.intensitat===f.intensitat) &&
    (!f.bloc || b.bloc===f.bloc) &&
    (!f.tipus || b.tipus===f.tipus) &&
    (!f.perfil || b.perfils.includes(f.perfil) || !b.perfils.length) &&
    (!f.materia || b.materies.includes("*") || b.materies.includes(f.materia)) &&
    (!q || (b.titol+" "+b.desc+" "+b.concrecio+" "+b.id+" "+b.bloc+" "+b.tipus).toLowerCase().includes(q)));

  const perBloc = {};
  llista.forEach(b => (perBloc[b.bloc] = perBloc[b.bloc] || []).push(b));
  const jaAl = id => p && p.adaptacions.some(x => x.adId===id);
  const propies = (state.mesuresPropies||[]).length;
  const editades = comptaEditades();

  $("#view-banc").innerHTML = `
  <div class="toolbar">
    <input type="search" data-cerca="banc" placeholder="Cerca per títol, contingut o codi" value="${esc(f.q)}" oninput="state.bankFilters.q=this.value;cercaViva(this,renderBanc)">
    <select onchange="state.bankFilters.intensitat=this.value;renderBanc()"><option value="">Totes les intensitats</option>${INTENSITATS.map(x=>`<option ${f.intensitat===x?"selected":""}>${x}</option>`).join("")}</select>
    <select onchange="state.bankFilters.bloc=this.value;renderBanc()"><option value="">Tots els blocs</option>${BLOCS_MESURA.map(x=>`<option ${f.bloc===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <select onchange="state.bankFilters.perfil=this.value;renderBanc()"><option value="">Tots els perfils</option>${PERFILS.map(x=>`<option ${f.perfil===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <select onchange="state.bankFilters.materia=this.value;renderBanc()"><option value="">Totes les matèries</option>${MATERIES_BANC().map(x=>`<option ${f.materia===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <span class="muted small">${llista.length} de ${MESURES().length}</span>
  </div>

  <div class="card"><div class="card-b" style="padding:13px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <span class="small muted" style="flex:1;min-width:200px">Catàleg de mesures i suports segons el Decret 150/2017. ${propies?`Inclou <b>${propies}</b> mesur${propies===1?"a pròpia":"es pròpies"} del centre.`:"Pots afegir-hi mesures pròpies del centre."} Qualsevol mesura es pot editar amb el botó <b>Edita</b> de la seva fitxa.${editades?` <b>${editades}</b> mesur${editades===1?"a del catàleg està modificada":"es del catàleg estan modificades"} pel centre.`:""}</span>
    <button class="btn sm" onclick="novaMesuraCentre()">Nova mesura del centre</button>
    ${editades?`<button class="btn sm ghost" onclick="restauraTotesMesures()">Restaura el catàleg</button>`:""}
    <button class="btn sm ghost" onclick="exportaMesures()">Exporta</button>
    <button class="btn sm ghost" onclick="importaMesuresDialog()">Importa</button>
  </div></div>

  ${seccioEstrategies(p, f.q, f.perfil, a ? a.perfils : [])}

  ${p ? `<div class="note info" style="margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <span style="flex:1;min-width:220px">Tens obert el PI de <b>${esc(alumne(p.alumneId).alias)}</b>. Les mesures que afegeixis aniran a <b>${esc(DEST_TOTES)}</b>; des del pas 4 les pots reassignar a una matèria concreta.</span>
    <button class="btn sm" onclick="go('pi')">Vés al pla</button>
    <button class="btn sm ghost" onclick="tancaPi(true)">Tanca el pla</button>
  </div>` : ""}

  ${llista.length===0 ? `<div class="empty"><b>Cap resultat</b>Prova amb altres paraules o treu algun filtre.</div>` :
    BLOCS_MESURA.concat(["Mesures pròpies del centre"]).filter(b => perBloc[b]).map(b => `
      <div class="grp-title"><span class="eyebrow">${esc(b)}</span><span class="muted small">${perBloc[b].length}</span></div>
      ${notaBloc(b)}
      <div class="bank">${perBloc[b].map(x => fitxaBanc(x, jaAl(x.id))).join("")}</div>`).join("")}

  <p class="legal" style="margin-top:22px">Fonts: Decret 150/2017, de 17 d'octubre, de l'atenció educativa a l'alumnat en el marc d'un sistema educatiu inclusiu; <i>Mesures i suports universals en el centre educatiu</i> (Departament d'Educació, 2023); taules de mesures i suports universals, addicionals i intensius del Departament d'Educació. </p>`;
}

/* ---------- Editor d'una mesura del banc ----------
   Val tant per a les mesures pròpies del centre com per a les del catàleg del
   Departament. La diferència és on va el resultat: les pròpies es desen
   senceres a state.mesuresPropies i les del catàleg només hi desen els camps
   que s'hagin canviat (state.mesuresEdit), de manera que sempre se'n pot
   recuperar el text oficial. */

/* Etiquetes de matèria que es poden posar a una mesura: les que ja fa servir
   el catàleg, més les matèries de l'ESO i les àrees de primària. */
function MATERIES_ETIQUETA(){
  const v = new Set();
  MESURES().forEach(b => (b.materies||[]).forEach(m => { if(m && m !== "*") v.add(m); }));
  MATERIES.forEach(m => v.add(m));
  AREES_PRIM.forEach(m => v.add(m));
  return [...v].sort();
}
const marcats = sel => [...document.querySelectorAll(sel)].filter(x => x.checked).map(x => x.value);
const mateixaLlista = (a, b) => (a||[]).slice().sort().join("\u00a7") === (b||[]).slice().sort().join("\u00a7");

/* Compatibilitat amb el nom antic: el botó «Nova mesura del centre». */
function novaMesuraCentre(id){ editaMesura(id || ""); }

function editaMesura(id){
  const m = id ? mesura(id) : null;
  const propia = !id || !mesuraOriginal(id);          /* mesura del centre o nova */
  const editada = !!(m && m.editada);
  const v = m || {titol:"", desc:"", concrecio:"", intensitat:"Universal", tipus:TIPUS_MESURA[0],
                  bloc:"Mesures pròpies del centre", perfils:[], materies:["*"],
                  font:"Mesura pròpia del centre"};
  const totes = (v.materies||[]).includes("*") || !(v.materies||[]).length;
  const blocs = propia ? ["Mesures pròpies del centre"].concat(BLOCS_MESURA) : BLOCS_MESURA;

  openModal(!id ? "Nova mesura del centre" : (propia ? "Edita la mesura del centre" : "Edita la mesura del catàleg"),
  `<div style="padding:20px 22px 26px">
    ${propia ? "" : `<div class="note ${editada?"":"info"}" style="margin-bottom:14px">
      ${editada
        ? `<b>Mesura del catàleg del Departament, modificada pel centre.</b> Els canvis es desen en aquest navegador i van a la còpia de seguretat; el text oficial es pot recuperar en qualsevol moment amb <b>Restaura l'original</b>.`
        : `<b>Mesura del catàleg del Departament.</b> El que hi canviïs val només per a aquest centre: es desa en aquest navegador i el text oficial es pot recuperar sempre amb <b>Restaura l'original</b>.`}
      <br><span class="small">Codi <span class="mono">${esc(id)}</span>. Els plans que ja tinguin aquesta mesura conserven el text amb què s'hi va afegir.</span>
    </div>`}

    <label class="field"><span class="lbl">Títol</span><input type="text" id="nm-t" value="${esc(v.titol)}" placeholder="Nom breu de la mesura"></label>
    <label class="field"><span class="lbl">Descripció · què és</span><textarea id="nm-d" rows="4" placeholder="En què consisteix la mesura.">${esc(v.desc)}</textarea></label>
    <label class="field"><span class="lbl">Concreció · com es redacta al PI</span><textarea id="nm-c" rows="4" placeholder="Redacció que s'incorporarà al pla quan s'afegeixi aquesta mesura.">${esc(v.concrecio)}</textarea></label>

    <div class="row">
      <label class="field" style="flex:1"><span class="lbl">Intensitat</span><select id="nm-i">${INTENSITATS.map(x=>`<option ${v.intensitat===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label class="field" style="flex:1"><span class="lbl">Tipus de mesura · eix</span><select id="nm-x">${TIPUS_MESURA.map(x=>`<option ${v.tipus===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
    </div>
    <label class="field"><span class="lbl">Bloc del banc</span><select id="nm-b">${blocs.map(x=>`<option ${v.bloc===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>

    <div class="field"><span class="lbl">Perfils de necessitat específica de suport educatiu</span>
      <p class="legal" style="margin:-2px 0 7px">Els perfils marcats són els que fan que la mesura es proposi a l'alumnat que els té. Sense cap perfil marcat, la mesura surt sempre.</p>
      <div class="pick" id="nm-perfils">${PERFILS.map(x=>{
        const on = (v.perfils||[]).includes(x);
        return `<label class="${on?"on":""}"><input type="checkbox" value="${esc(x)}" ${on?"checked":""} onchange="this.closest('label').classList.toggle('on',this.checked)">${esc(x)}</label>`;
      }).join("")}</div></div>

    <div class="field"><span class="lbl">Matèries i àrees</span>
      <label class="chk" style="border:0;padding:0 0 8px"><input type="checkbox" id="nm-all" ${totes?"checked":""}
        onchange="$('#nm-mats').style.display=this.checked?'none':'flex'">
        <span class="txt">Val per a totes les matèries i àrees</span></label>
      <div class="pick scroll" id="nm-mats" style="display:${totes?"none":"flex"}">${MATERIES_ETIQUETA().map(x=>{
        const on = (v.materies||[]).includes(x);
        return `<label class="${on?"on":""}"><input type="checkbox" value="${esc(x)}" ${on?"checked":""} onchange="this.closest('label').classList.toggle('on',this.checked)">${esc(x)}</label>`;
      }).join("")}</div></div>

    <label class="field"><span class="lbl">Font o referència normativa</span><input type="text" id="nm-f" value="${esc(v.font)}" placeholder="D'on surt la mesura"></label>

    <p class="legal">${propia
      ? "Les mesures pròpies es desen en aquest navegador i s'inclouen a la còpia de seguretat."
      : "Les modificacions del catàleg es desen en aquest navegador i s'inclouen a la còpia de seguretat."}</p>

    <div style="display:flex;gap:9px;margin-top:16px;flex-wrap:wrap">
      <button class="btn primary" onclick="desaMesura(${jq(id||"")})">Desa</button>
      ${!propia && editada ? `<button class="btn ghost" onclick="restauraMesura(${jq(id)})">Restaura l'original</button>` : ""}
      ${propia && id ? `<button class="btn ghost danger" onclick="esborraMesuraCentre(${jq(id)})">Elimina</button>` : ""}
      <button class="btn ghost" onclick="tancaEditorMesura()">Cancel·la</button></div></div>`, true);
}

/* Si l'editor s'ha obert des de la finestra del banc, s'hi torna; si s'ha
   obert des de la vista del banc, es tanca i prou. */
function tancaEditorMesura(){
  if(state.bm && state.bm.obert){
    openModal("Banc de mesures i suports", bancModalHTML(), true);
    pintaResultatsBanc();
  } else closeModal();
}

function desaMesura(id){
  const t = $("#nm-t").value.trim();
  if(!t){ toast("Cal un títol."); return; }
  const totes = $("#nm-all").checked;
  const mats = totes ? ["*"] : marcats("#nm-mats input[type=checkbox]");
  const dades = {
    titol: t,
    desc: $("#nm-d").value.trim(),
    concrecio: $("#nm-c").value.trim(),
    intensitat: $("#nm-i").value,
    tipus: $("#nm-x").value,
    bloc: $("#nm-b").value,
    perfils: marcats("#nm-perfils input[type=checkbox]"),
    materies: mats.length ? mats : ["*"],
    font: $("#nm-f").value.trim()
  };
  const orig = id ? mesuraOriginal(id) : null;
  if(orig){
    /* Del catàleg oficial només se'n desa el que s'ha canviat. */
    const dif = {};
    CAMPS_MESURA.forEach(c => {
      const nou = dades[c], vell = orig[c];
      if(Array.isArray(nou)){ if(!mateixaLlista(nou, vell)) dif[c] = nou; }
      else if(String(nou) !== String(vell == null ? "" : vell)) dif[c] = nou;
    });
    state.mesuresEdit = state.mesuresEdit || {};
    if(Object.keys(dif).length) state.mesuresEdit[id] = dif;
    else delete state.mesuresEdit[id];
    desa(); tancaEditorMesura(); render();
    toast(Object.keys(dif).length ? "Mesura del catàleg modificada per al centre." : "La mesura torna a ser la del catàleg.");
    return;
  }
  state.mesuresPropies = state.mesuresPropies || [];
  const ex = id ? state.mesuresPropies.find(x => x.id === id) : null;
  if(ex) Object.assign(ex, dades);
  else state.mesuresPropies.push(Object.assign({id:uid("CM-")}, dades));
  desa(); tancaEditorMesura(); render();
  toast("Mesura desada al banc del centre.");
}

/* Torna una mesura del catàleg al seu text oficial. */
async function restauraMesura(id){
  if(!esEditada(id)){ toast("Aquesta mesura ja és la del catàleg."); return; }
  if(!await confirma("Restaura la mesura del catàleg",
        "Vols descartar les modificacions del centre i tornar al text oficial del Departament? Els plans que ja tinguin la mesura conserven el text amb què s'hi va afegir.",
        {confirma:"Restaura l'original"})) return;
  delete state.mesuresEdit[id];
  desa(); tancaEditorMesura(); render();
  toast("Mesura restaurada al text del catàleg.");
}

/* Descarta totes les modificacions del catàleg d'una tirada. Les mesures
   pròpies del centre no s'hi toquen: no formen part del catàleg oficial. */
async function restauraTotesMesures(){
  const n = comptaEditades();
  if(!n){ toast("El catàleg no té cap modificació."); return; }
  if(!await confirma("Restaura tot el catàleg",
        `Vols descartar les modificacions de <b>${n}</b> mesur${n===1?"a":"es"} del catàleg i tornar al text oficial del Departament? Les mesures pròpies del centre no s'hi toquen.`,
        {confirma:"Restaura-les totes", perillos:true})) return;
  state.mesuresEdit = {};
  desa(); render();
  if(state.bm && state.bm.obert) pintaResultatsBanc();
  toast(`${n} mesur${n===1?"a restaurada":"es restaurades"} al text del catàleg.`);
}

async function esborraMesuraCentre(id){
  if(!await confirma("Elimina la mesura del banc",
        "Vols eliminar aquesta mesura del banc del centre? Els plans que ja la tinguin la conservaran.",
        {confirma:"Elimina la mesura", perillos:true})) return;
  state.mesuresPropies = (state.mesuresPropies||[]).filter(x=>x.id!==id);
  desa(); tancaEditorMesura(); render(); toast("Mesura eliminada del banc.");
}
function exportaMesures(){
  /* Es descarrega tot el que el centre ha afegit als bancs: les mesures i les
     estratègies pròpies, i les modificacions fetes sobre les del Departament
     i sobre les del banc de frases. */
  const d = {v:3, tipus:"banc-mesures-centre", mesures:state.mesuresPropies||[],
             edicions:state.mesuresEdit||{},
             estrategies:state.estrategiesPropies||[],
             edicionsEstrategies:state.estrategiesEdit||{}};
  const blob = new Blob([JSON.stringify(d, null, 1)], {type:"application/json"});
  const u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = "mesures-del-centre.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(u), 800);
}
function importaMesuresDialog(){
  openModal("Importa mesures del centre", `<div style="padding:20px 22px 26px">
    <p class="small muted" style="margin-top:0">Tria un fitxer exportat prèviament amb el botó «Exporta». Les mesures i les estratègies pròpies s'afegiran a les que ja tinguis, i les modificacions substituiran les que hi hagi de la mateixa mesura o estratègia.</p>
    <input type="file" id="im-file" accept="application/json,.json">
    <div style="display:flex;gap:9px;margin-top:16px"><button class="btn primary" onclick="importaMesures()">Importa</button>
    <button class="btn ghost" onclick="closeModal()">Cancel·la</button></div></div>`);
}
/* Les estratègies d'un fitxer exportat: les pròpies s'afegeixen amb
   identificador nou si el seu ja existeix i les modificacions manen sobre les
   que hi hagi per a la mateixa frase. Retorna quantes n'han entrat. */
function importaEstrategiesDe(d){
  state.estrategiesPropies = state.estrategiesPropies || [];
  const ids = new Set(state.estrategiesPropies.map(x => x.id));
  const noves = (d.estrategies||[]).filter(x => x && String(x.text||"").trim());
  noves.forEach(x => {
    const e = Object.assign({perfils:[], categoria:CAT_ESTR_CENTRE}, x);
    if(!e.id || ids.has(e.id)) e.id = uid("CE-");
    ids.add(e.id);
    state.estrategiesPropies.push(e);
  });
  const ed = netejaEdicionsEstr(d.edicionsEstrategies);
  state.estrategiesEdit = Object.assign(state.estrategiesEdit || {}, ed);
  return noves.length + Object.keys(ed).length;
}
function importaMesures(){
  const f = $("#im-file").files[0];
  if(!f){ toast("Tria un fitxer."); return; }
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      const noves = (d.mesures||[]).filter(x => x && x.titol);
      state.mesuresPropies = state.mesuresPropies || [];
      const ids = new Set(state.mesuresPropies.map(x=>x.id));
      noves.forEach(x => {
        const m = Object.assign({perfils:[], materies:["*"], concrecio:"", desc:"",
          bloc:"Mesures pròpies del centre", tipus:TIPUS_MESURA[0], intensitat:"Universal",
          font:"Mesura pròpia del centre"}, x);
        if(!m.id || ids.has(m.id)) m.id = uid("CM-");
        ids.add(m.id);
        state.mesuresPropies.push(m);
      });
      /* Les modificacions del catàleg s'identifiquen pel codi de la mesura:
         la del fitxer mana sobre la que hi hagi per al mateix codi. */
      const ed = netejaEdicions(d.edicions);
      state.mesuresEdit = Object.assign(state.mesuresEdit || {}, ed);
      const nEd = Object.keys(ed).length;
      const nEs = importaEstrategiesDe(d);
      desa(); closeModal(); render();
      toast(`${noves.length} mesures importades`
        + (nEd ? `, ${nEd} del catàleg modificad${nEd===1?"a":"es"}` : "")
        + (nEs ? ` i ${nEs} estratègi${nEs===1?"a":"es"}` : "") + ".");
    }catch(e){ toast("El fitxer no és vàlid."); }
  };
  r.readAsText(f);
}

