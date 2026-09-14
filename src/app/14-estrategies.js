/* ---------- 9. Estratègies metodològiques ----------
   Annex que encapçala els resultats dels dos bancs —la vista «Banc de
   mesures» i la finestra que s'obre des del pas 4— amb frases breus d'ús comú
   a l'aula, agrupades per categoria i etiquetades pels perfils de necessitats
   a què solen respondre.

   Ocupa una caixa petita amb desplaçament propi, d'unes deu frases, i el
   catàleg de mesures continua just a sota: és un complement per començar a
   redactar, no el contingut principal de la finestra, i no se li ha de menjar
   l'espai. El botó «Oculta» la redueix a la seva capçalera.

   Va abans del catàleg de mesures i no barrejada amb ell perquè són dues coses
   diferents: una mesura del Decret 150/2017 té intensitat, bloc i font
   normativa; una estratègia d'aquí és una frase de pràctica docent, sense
   norma al darrere, que sovint és el que es necessita per començar a redactar.

   Tot és editable: qualsevol frase del banc es pot reescriure o reetiquetar, el
   centre pot afegir-ne de pròpies i sempre se'n pot recuperar la del banc.
   Les dades viuen a  data/estrategies.json;  el que canvia el centre, a
   state.estrategiesEdit i state.estrategiesPropies.                        */

/* Frases que es veuen ara mateix, segons la cerca i el perfil que hi hagi
   posats al banc d'on es pinta la secció. La categoria és un filtre propi de
   la secció: els filtres de bloc, intensitat i matèria no s'hi apliquen
   perquè una frase no en té cap. */
function filtraEstrategies(q, perfil, perfilsAlumne){
  const text = (q||"").trim().toLowerCase();
  const cat = (state.estr||{}).cat || "";
  return ESTRATEGIES().filter(e => {
    if(cat && e.categoria !== cat) return false;
    if(perfil === "__alumne"){ if(!(e.perfils||[]).some(x => (perfilsAlumne||[]).includes(x))) return false; }
    else if(perfil && !(e.perfils||[]).includes(perfil) && (e.perfils||[]).length) return false;
    if(text && !(e.text+" "+e.categoria+" "+e.id+" "+(e.perfils||[]).join(" ")).toLowerCase().includes(text)) return false;
    return true;
  });
}

/* La secció sencera, tal com la insereixen renderBanc() i pintaResultatsBanc().
   `p` és el pla obert, si n'hi ha cap: sense pla les frases es poden llegir i
   editar, però no afegir enlloc. */
function seccioEstrategies(p, q, perfil, perfilsAlumne){
  const st = state.estr = state.estr || {cat:"", obert:true};
  const llista = filtraEstrategies(q, perfil, perfilsAlumne);
  const total = ESTRATEGIES().length;
  const cats = ESTRATEGIES_CATS();
  const perCat = {};
  llista.forEach(e => (perCat[e.categoria] = perCat[e.categoria] || []).push(e));
  const jaAl = id => p && p.adaptacions.some(x => x.adId === id);

  return `<section class="estr${st.obert?"":" tancada"}">
    <div class="estr-cap">
      <span class="estr-titol">Estratègies metodològiques</span>
      <span class="estr-annex">Complement del catàleg</span>
      <span class="muted small estr-n">${llista.length} de ${total}</span>
      <select class="estr-cat-sel" aria-label="Categoria d'estratègies" onchange="filtraCatEstrategies(this.value)">
        <option value="">Totes les categories</option>
        ${cats.map(c => `<option value="${esc(c)}" ${st.cat===c?"selected":""}>${esc(c)}</option>`).join("")}
      </select>
      <button class="btn sm ghost" onclick="editaEstrategia('')">Nova estratègia</button>
      ${comptaEstrategiesEditades() ? `<button class="btn sm ghost" onclick="restauraTotesEstrategies()">Restaura el banc</button>` : ""}
      <button class="btn sm ghost" aria-expanded="${st.obert}" onclick="plegaEstrategies()">${st.obert?"Oculta":"Mostra"}</button>
    </div>
    ${st.obert ? `
    <p class="legal estr-nota">Frases breus d'ús comú a l'aula, de la pràctica docent i de l'evidència sobre què funciona amb cada perfil. No provenen de cap norma: complementen el catàleg de mesures i es poden editar totes.</p>
    <div class="estr-scroll">${llista.length === 0
      ? `<div class="empty" style="padding:22px 14px;margin:0"><b>Cap estratègia amb aquests filtres</b>Prova amb altres paraules, canvia de categoria o escriu-ne una de nova.</div>`
      : cats.filter(c => perCat[c]).map(c => `
        <div class="estr-cat">
          <div class="estr-cat-t"><span class="eyebrow">${esc(c)}</span><span class="muted small">${perCat[c].length}</span></div>
          <div class="estr-list">${perCat[c].map(e => fitxaEstrategia(e, p, jaAl(e.id))).join("")}</div>
        </div>`).join("")}</div>` : ""}
  </section>`;
}

/* Una frase del banc. Curta a propòsit: el text, els perfils i dos botons. */
function fitxaEstrategia(e, p, ja){
  return `<div class="estr-item ${ja?"ja":""}">
    <span class="estr-t">${esc(e.text)}</span>
    ${(e.perfils||[]).length ? `<span class="estr-perf">${e.perfils.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</span>` : ""}
    ${e.editada ? `<span class="tag edit" title="Frase del banc amb el text o les etiquetes modificats pel centre">Modificada</span>` : ""}
    <span class="estr-acc">
      <button class="btn sm ghost" title="Edita aquesta estratègia" onclick="editaEstrategia(${jq(e.id)})">Edita</button>
      ${p ? (ja
        ? `<span class="btn sm ok" aria-disabled="true">✓ Al pla</span>`
        : `<button class="btn sm primary" onclick="afegeixEstrategia(${jq(e.id)})">Afegeix</button>`) : ""}
    </span>
  </div>`;
}

function filtraCatEstrategies(v){
  state.estr = state.estr || {cat:"", obert:true};
  state.estr.cat = v;
  repintaEstrategies();
}
/* Oculta l'annex i el deixa reduït a la capçalera, o el torna a mostrar. */
function plegaEstrategies(){
  state.estr = state.estr || {cat:"", obert:true};
  state.estr.obert = !state.estr.obert;
  repintaEstrategies();
}
/* La secció viu dins de dos bancs diferents: es repinta el que estigui obert. */
function repintaEstrategies(){
  if(state.bm && state.bm.obert) pintaResultatsBanc();
  else if(state.view === "banc") renderBanc();
}

/* ----- Passar una frase al pla -----
   Entra com una mesura més de l'apartat 5 del document, amb la frase com a
   títol i com a redacció. Neix universal i amb l'eix «Metodologia» perquè és
   el que és una estratègia d'aula; des del pas 4 es pot canviar tot. */
function itemEstrategia(e, materia){
  return {id:uid("A"), adId:e.id, titol:e.text, text:e.text,
          materia: materia || DEST_TOTES, tipus:"Metodologia",
          bloc:"Estratègies metodològiques", intensitat:"Universal", concrecio:""};
}
function afegeixEstrategia(id){
  const e = estrategia(id); if(!e) return;
  const p = P();
  if(!p){ toast("Obre un pla per poder-hi afegir estratègies."); return; }
  const dest = (state.bm && state.bm.obert && state.bm.desti) || DEST_TOTES;
  let dup = false;
  up(x => {
    if(x.adaptacions.some(y => y.adId === id)){ dup = true; return; }
    x.adaptacions.push(itemEstrategia(e, dest));
  });
  if(dup){ toast("Aquesta estratègia ja consta al pla."); return; }
  if(state.bm && state.bm.obert) state.bm.afegides++;
  repintaEstrategies();
  toast(`Estratègia afegida a ${dest}.`);
}

/* ----- Editor d'una estratègia -----
   Val per a les tres coses que es poden fer: escriure'n una de nova, canviar
   una del centre i retocar una del banc. La diferència és on va el resultat,
   igual que a les mesures: les pròpies es desen senceres i de les del banc
   només se'n desa el que s'hagi canviat. */
function editaEstrategia(id){
  const e = id ? estrategia(id) : null;
  const propia = !id || !estrategiaOriginal(id);
  const editada = !!(e && e.editada);
  const v = e || {text:"", categoria:CAT_ESTR_CENTRE, perfils:[]};
  const cats = propia ? [CAT_ESTR_CENTRE].concat(ESTRATEGIES_CATEGORIES) : ESTRATEGIES_CATS();

  openModal(!id ? "Nova estratègia del centre"
            : (propia ? "Edita l'estratègia del centre" : "Edita l'estratègia del banc"),
  `<div style="padding:20px 22px 26px">
    ${propia ? "" : `<div class="note ${editada?"":"info"}" style="margin-bottom:14px">
      ${editada
        ? `<b>Estratègia del banc, modificada pel centre.</b> Els canvis es desen en aquest navegador i van a la còpia de seguretat; la frase original es pot recuperar sempre amb <b>Restaura l'original</b>.`
        : `<b>Estratègia del banc.</b> El que hi canviïs val només per a aquest centre i la frase original es pot recuperar sempre amb <b>Restaura l'original</b>.`}
      <br><span class="small">Codi <span class="mono">${esc(id)}</span>. Els plans que ja la tinguin conserven el text amb què s'hi va afegir.</span>
    </div>`}

    <label class="field"><span class="lbl">Frase</span>
      <textarea id="ne-t" rows="3" maxlength="140" placeholder="Breu i directa: «Donar instruccions clares i curtes», «Ús de l'agenda amb seguiment del tutor/a».">${esc(v.text)}</textarea>
      <span class="small muted" style="display:block;margin-top:4px">Aquest text és el que entrarà al pla tal com és. Si necessites una redacció llarga i amb font normativa, el seu lloc és el catàleg de mesures.</span></label>

    <label class="field"><span class="lbl">Categoria</span>
      <select id="ne-c">${cats.map(c=>`<option ${v.categoria===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label>

    <div class="field"><span class="lbl">Perfils de necessitat específica de suport educatiu</span>
      <p class="legal" style="margin:-2px 0 7px">Els perfils marcats són els que fan que l'estratègia es proposi a l'alumnat que els té. Sense cap perfil marcat, surt sempre.</p>
      <div class="pick" id="ne-perfils">${PERFILS.map(x=>{
        const on = (v.perfils||[]).includes(x);
        return `<label class="${on?"on":""}"><input type="checkbox" value="${esc(x)}" ${on?"checked":""} onchange="this.closest('label').classList.toggle('on',this.checked)">${esc(x)}</label>`;
      }).join("")}</div></div>

    <p class="legal">${propia
      ? "Les estratègies pròpies es desen en aquest navegador i s'inclouen a la còpia de seguretat."
      : "Les modificacions del banc es desen en aquest navegador i s'inclouen a la còpia de seguretat."}</p>

    <div style="display:flex;gap:9px;margin-top:16px;flex-wrap:wrap">
      <button class="btn primary" onclick="desaEstrategia(${jq(id||"")})">Desa</button>
      ${!propia && editada ? `<button class="btn ghost" onclick="restauraEstrategia(${jq(id)})">Restaura l'original</button>` : ""}
      ${propia && id ? `<button class="btn ghost danger" onclick="esborraEstrategia(${jq(id)})">Elimina</button>` : ""}
      <button class="btn ghost" onclick="tancaEditorEstrategia()">Cancel·la</button></div></div>`, true);
}

/* Com l'editor de mesures: si s'ha obert des de la finestra del banc, s'hi
   torna; si s'ha obert des de la vista, es tanca i prou. */
function tancaEditorEstrategia(){
  if(state.bm && state.bm.obert){
    openModal("Banc de mesures i suports", bancModalHTML(), true);
    pintaResultatsBanc();
  } else closeModal();
}

function desaEstrategia(id){
  const text = $("#ne-t").value.trim();
  if(!text){ toast("Cal escriure la frase."); return; }
  const dades = {text: text, categoria: $("#ne-c").value,
                 perfils: marcats("#ne-perfils input[type=checkbox]")};
  const orig = id ? estrategiaOriginal(id) : null;
  if(orig){
    const dif = {};
    CAMPS_ESTRATEGIA.forEach(c => {
      const nou = dades[c], vell = orig[c];
      if(Array.isArray(nou)){ if(!mateixaLlista(nou, vell)) dif[c] = nou; }
      else if(String(nou) !== String(vell == null ? "" : vell)) dif[c] = nou;
    });
    state.estrategiesEdit = state.estrategiesEdit || {};
    if(Object.keys(dif).length) state.estrategiesEdit[id] = dif;
    else delete state.estrategiesEdit[id];
    desa(); tancaEditorEstrategia(); render();
    toast(Object.keys(dif).length ? "Estratègia modificada per al centre." : "L'estratègia torna a ser la del banc.");
    return;
  }
  state.estrategiesPropies = state.estrategiesPropies || [];
  const ex = id ? state.estrategiesPropies.find(x => x.id === id) : null;
  if(ex) Object.assign(ex, dades);
  else state.estrategiesPropies.push(Object.assign({id:uid("CE-")}, dades));
  desa(); tancaEditorEstrategia(); render();
  toast("Estratègia desada al banc del centre.");
}

async function restauraEstrategia(id){
  if(!esEstrategiaEditada(id)){ toast("Aquesta estratègia ja és la del banc."); return; }
  if(!await confirma("Restaura l'estratègia del banc",
        "Vols descartar les modificacions del centre i tornar a la frase original? Els plans que ja la tinguin conserven el text amb què s'hi va afegir.",
        {confirma:"Restaura l'original"})) return;
  delete state.estrategiesEdit[id];
  desa(); tancaEditorEstrategia(); render();
  toast("Estratègia restaurada.");
}

async function restauraTotesEstrategies(){
  const n = comptaEstrategiesEditades();
  if(!n){ toast("El banc d'estratègies no té cap modificació."); return; }
  if(!await confirma("Restaura tot el banc d'estratègies",
        `Vols descartar les modificacions de <b>${n}</b> estratègi${n===1?"a":"es"} i tornar a les frases originals? Les estratègies pròpies del centre no s'hi toquen.`,
        {confirma:"Restaura-les totes", perillos:true})) return;
  state.estrategiesEdit = {};
  desa(); render(); repintaEstrategies();
  toast(`${n} estratègi${n===1?"a restaurada":"es restaurades"}.`);
}

async function esborraEstrategia(id){
  if(!await confirma("Elimina l'estratègia",
        "Vols eliminar aquesta estratègia del banc del centre? Els plans que ja la tinguin la conservaran.",
        {confirma:"Elimina l'estratègia", perillos:true})) return;
  state.estrategiesPropies = (state.estrategiesPropies||[]).filter(x => x.id !== id);
  desa(); tancaEditorEstrategia(); render();
  toast("Estratègia eliminada del banc.");
}
