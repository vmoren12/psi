/* ---------- Còpia completa ---------- */
/* El contingut d'una còpia completa. El fan servir la descàrrega manual, la
   còpia automàtica i cada instantània de l'historial: tots tres produeixen
   exactament el mateix fitxer i, per tant, es restauren igual. */
function dadesCopia(){
  return {v:5, data:avui(), centre:state.centre, logos:state.logos, alumnes:state.alumnes, pis:state.pis,
          mesuresPropies:state.mesuresPropies, mesuresEdit:state.mesuresEdit,
          estrategiesPropies:state.estrategiesPropies, estrategiesEdit:state.estrategiesEdit};
}
/* Deixa el contingut d'una còpia com a únic contingut de l'aplicació. */
function substitueixDades(d){
  state.centre = d.centre || "";
  state.logos = Array.isArray(d.logos) ? d.logos.slice(0, LOGOS_MAX) : [];
  state.alumnes = d.alumnes || [];
  state.mesuresPropies = d.mesuresPropies || [];
  state.mesuresEdit = netejaEdicions(d.mesuresEdit);
  state.estrategiesPropies = d.estrategiesPropies || [];
  state.estrategiesEdit = netejaEdicionsEstr(d.estrategiesEdit);
  state.pis = (d.pis || []).map(p => migraPi(p));
}
function exportaTot(){
  baixa(`pi-copia-${avui()}.json`, JSON.stringify(dadesCopia(), null, 1));
  toast("Còpia descarregada. Guarda-la en un lloc segur.");
}
function dialegRestaura(){
  openModal("Restaura una còpia de seguretat", `<div style="padding:20px 22px 26px">
    <p class="small" style="margin-top:0">Tria un fitxer descarregat prèviament amb «Descarrega la còpia completa».</p>
    <input type="file" accept="application/json,.json" id="imp-file" style="margin-bottom:14px">
    <div class="field"><span class="lbl">Què cal fer amb les dades actuals</span>
      <select id="imp-mode">
        <option value="substitueix">Substitueix-les per les de la còpia</option>
        <option value="afegeix">Afegeix-hi el contingut de la còpia (conserva el que hi ha)</option>
      </select></div>
    <p class="legal">En mode «afegeix», les fitxes i els plans de la còpia s'incorporen amb identificadors nous; no se'n perd cap dels actuals.</p>
    <div style="display:flex;gap:9px;margin-top:16px"><button class="btn primary" onclick="importa()">Restaura</button>
    <button class="btn ghost" onclick="closeModal()">Cancel·la</button></div></div>`);
}
function importa(){
  const f = $("#imp-file").files[0];
  if(!f){ toast("Tria un fitxer."); return; }
  const mode = $("#imp-mode") ? $("#imp-mode").value : "substitueix";
  const r = new FileReader();
  r.onload = async () => {
    let d;
    try{ d = JSON.parse(r.result); }
    catch(e){ avisa("El fitxer no es pot llegir", "El contingut no és un JSON vàlid. Tria una còpia descarregada des d'aquesta mateixa aplicació."); return; }
    if(!d || (!Array.isArray(d.alumnes) && !Array.isArray(d.pis))){
      avisa("Aquest fitxer no és una còpia del PI", "El JSON és vàlid, però no hi consta cap llista d'alumnat ni de plans. Comprova que és la còpia que has descarregat amb «Descarrega la còpia completa»."); return;
    }
    if(mode === "substitueix"){
      if(!await confirma("Substitueix les dades actuals",
            `Això substituirà <b>tot</b> el contingut d'aquest dispositiu (${state.alumnes.length} fitxes i ${state.pis.length} plans) pel de la còpia. Abans es desa una instantània del contingut d'ara a l'historial intern.`,
            {confirma:"Substitueix-ho tot", perillos:true})) return;
      await instantania("abans de restaurar una còpia");
      substitueixDades(d);
    } else {
      await instantania("abans d'afegir-hi una còpia");
      if(!state.centre) state.centre = d.centre || "";
      if(!(state.logos||[]).length && Array.isArray(d.logos)) state.logos = d.logos.slice(0, LOGOS_MAX);
      fusiona(d);
    }
    state.currentPi = null;
    desa(); closeModal(); go("dashboard");
    toast(`Còpia restaurada: ${state.alumnes.length} alumnes i ${state.pis.length} plans.`);
  };
  r.readAsText(f);
}

/* Incorpora una còpia sense perdre res: reassigna els identificadors que xoquin
   i manté la correspondència entre els plans i les seves fitxes d'alumnat. */
function fusiona(d){
  const idsAl = new Set(state.alumnes.map(a => a.id));
  const idsPi = new Set(state.pis.map(p => p.id));
  const idsMe = new Set((state.mesuresPropies||[]).map(m => m.id));
  const remap = {};
  (d.alumnes||[]).forEach(a => {
    const nou = Object.assign({}, a);
    if(!nou.id || idsAl.has(nou.id)){ const v = nou.id; nou.id = uid("AL"); if(v) remap[v] = nou.id; }
    idsAl.add(nou.id);
    state.alumnes.push(nou);
  });
  (d.pis||[]).forEach(p => {
    const nou = migraPi(p);
    if(remap[nou.alumneId]) nou.alumneId = remap[nou.alumneId];
    if(!nou.id || idsPi.has(nou.id)) nou.id = uid("PI-");
    idsPi.add(nou.id);
    state.pis.push(nou);
  });
  state.mesuresPropies = state.mesuresPropies || [];
  (d.mesuresPropies||[]).forEach(m => {
    const nou = Object.assign({}, m);
    if(!nou.id || idsMe.has(nou.id)) nou.id = uid("CM-");
    idsMe.add(nou.id);
    state.mesuresPropies.push(nou);
  });
  /* Les modificacions del catàleg no poden xocar entre elles —van pel codi de
     la mesura oficial—: les que ja hi ha manen, perquè el mode «afegeix» no
     ha de tocar res del que ja tenia el centre. */
  const ed = netejaEdicions(d.mesuresEdit);
  state.mesuresEdit = state.mesuresEdit || {};
  Object.keys(ed).forEach(id => { if(!state.mesuresEdit[id]) state.mesuresEdit[id] = ed[id]; });
  fusionaEstrategies(d);
}
/* El banc d'estratègies segueix el mateix criteri que el de mesures: les
   frases pròpies s'afegeixen amb identificador nou si el seu xoca, i les
   modificacions que ja tingués el centre manen sobre les del fitxer. */
function fusionaEstrategies(d){
  const ids = new Set((state.estrategiesPropies||[]).map(x => x.id));
  state.estrategiesPropies = state.estrategiesPropies || [];
  (d.estrategiesPropies||[]).forEach(x => {
    const nou = Object.assign({}, x);
    if(!nou.id || ids.has(nou.id)) nou.id = uid("CE-");
    ids.add(nou.id);
    state.estrategiesPropies.push(nou);
  });
  const ed = netejaEdicionsEstr(d.estrategiesEdit);
  state.estrategiesEdit = state.estrategiesEdit || {};
  Object.keys(ed).forEach(id => { if(!state.estrategiesEdit[id]) state.estrategiesEdit[id] = ed[id]; });
}

