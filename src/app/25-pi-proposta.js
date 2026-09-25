/* ---------------------------------------------------------------------------
   Proposta de mesures a partir dels perfils de l'alumne/a
   ---------------------------------------------------------------------------
   Carrega al pla la suma de les plantilles dels perfils marcats a la fitxa.
   És una proposta professional de partida, no una prescripció: tot arriba com
   a llista marcable i editable, i cap mesura entra al pla sense validar-la.
   Els suports intensius s'ofereixen sempre desmarcats perquè requereixen
   l'informe de reconeixement de l'EAP i la resolució corresponent
   (Decret 150/2017, articles 10 i 11). */
function pisDe(alumneId){ return state.pis.filter(p => p.alumneId === alumneId); }

/* Destinació que es proposa per a una mesura: transversal, tret que el catàleg
   la limiti a matèries concretes i només n'hi hagi una al pla. */
function destiSuggerit(p, b){
  if(!p || !b.materies || b.materies.includes("*")) return DEST_TOTES;
  const coincid = b.materies.filter(m => p.materies.includes(m));
  return coincid.length === 1 ? coincid[0] : DEST_TOTES;
}

/* Recalcula la llista i, si cal, els valors per defecte de cada fila. Es torna
   a cridar a cada repintat perquè el pla de destinació pot haver canviat. */
function preparaProposta(reinicia){
  const pp = state.pp, p = pp.pi ? pi(pp.pi) : null;
  const items = combinaPerfils(pp.perfils, pp.base);
  if(reinicia){ pp.tria = {}; pp.desti = {}; }
  items.forEach(x => {
    if(p && p.adaptacions.some(m => m.adId === x.id)) pp.tria[x.id] = false;
    else if(!(x.id in pp.tria))
      pp.tria[x.id] = x.prioritat === "nucli" && x.mesura.intensitat !== "Intensiva";
    if(!(x.id in pp.desti)) pp.desti[x.id] = destiSuggerit(p, x.mesura);
  });
  return items;
}

function dialegProposta(alumneId, perfils, desDeLaFitxa){
  const a = alumne(alumneId);
  const amb = (perfils || a.perfils || []).filter(x => plantillaPerfil(x));
  const seus = pisDe(alumneId);
  const actual = seus.find(x => x.id === state.currentPi)
              || seus.find(x => x.estat !== "tancat") || seus[0];
  state.pp = {alumne: alumneId, pi: actual ? actual.id : "", perfils: amb,
              base: true, tria: {}, desti: {}, fitxa: !!desDeLaFitxa};
  preparaProposta(true);
  obreModalProposta();
  pintaProposta();
}

/* La finestra es torna a obrir sencera cada cop que canvia alguna cosa del
   capçal. El botó «Torna» només hi surt quan s'hi ha arribat des de la fitxa
   de l'alumne/a, que és on ha de poder tornar. */
function obreModalProposta(){
  const pp = state.pp;
  openModal("Proposta de mesures segons el perfil", propostaModalHTML(), true, false,
            pp.fitxa ? () => editaAlumne(pp.alumne) : null);
}

function propostaModalHTML(){
  const pp = state.pp, a = alumne(pp.alumne), seus = pisDe(pp.alumne);
  const sensePlantilla = (a.perfils || []).filter(x => !plantillaPerfil(x));
  return `<div class="bm">
   <div class="bm-bar">
     <div class="pp-perfils">
       ${pp.perfils.length
         ? pp.perfils.map(x=>`<span class="tag met">${esc(x)}</span>`).join("")
         : `<span class="tag warn">Cap perfil amb plantilla</span>`}
       ${sensePlantilla.length ? `<span class="tag">Sense plantilla: ${esc(sensePlantilla.join(", "))}</span>` : ""}
     </div>
     <label class="chk" style="border:0;padding:0">
       <input type="checkbox" ${pp.base?"checked":""} onchange="state.pp.base=this.checked;pintaProposta()">
       <span class="txt small">Inclou-hi la <b>base universal comuna</b> (mesures que sostenen qualsevol PI, sigui quin sigui el perfil)</span>
     </label>
     ${seus.length ? `<div class="bm-dest">
       <label class="mes-f" style="flex:1"><span>Carrega-ho al pla</span>
         <select onchange="state.pp.pi=this.value;preparaProposta(true);pintaProposta()">
           ${seus.map(x=>`<option value="${x.id}" ${pp.pi===x.id?"selected":""}>${esc(x.id)} · ${esc(x.curs)} · ${esc(x.tipus==="continguts"?"curricular":"metodològic")}</option>`).join("")}</select></label>
       <span class="bm-count" id="pp-count"></span>
       <button class="btn sm ghost" onclick="closeModal()">Cancel·la</button>
       <button class="btn sm primary" id="pp-ok" onclick="aplicaProposta()">Carrega-les al pla</button>
     </div>` : `<div class="bm-dest">
       <span class="muted small" style="flex:1;min-width:200px">${esc(a.alias)} encara no té cap pla. Cal crear-lo per poder-hi carregar la proposta.</span>
       <span class="bm-count" id="pp-count"></span>
       <button class="btn sm x" title="Tanca" aria-label="Tanca" onclick="closeModal()">&times;</button>
       <button class="btn sm primary" onclick="creaPiPerProposta()">Crea el pla</button>
     </div>`}
   </div>
   <div class="bm-body" id="pp-body"></div>
  </div>`;
}

/* «Crea el pla» de la finestra de proposta, per a l'alumnat que encara no en
   té cap: crea el pla i hi carrega d'una tirada les mesures marcades, que
   ja s'han pogut revisar a la llista. Després no deixa l'usuari enlloc: li
   pregunta si vol veure la fitxa o entrar al pla. */
async function creaPiPerProposta(){
  const pp = state.pp, a = alumne(pp.alumne);
  const p = creaPiObj(pp.alumne, "metodologic");
  pp.pi = p.id;
  const items = combinaPerfils(pp.perfils, pp.base).filter(x => pp.tria[x.id]);
  items.forEach(x => p.adaptacions.push(itemMesura(x.mesura, pp.desti[x.id] || DEST_TOTES)));
  desa();
  closeModal();
  render();
  const n = items.length;
  const msg = n ? `Pla ${p.id} creat amb ${n===1 ? "una mesura" : n + " mesures"} de la proposta.`
                : `Pla ${p.id} creat, sense cap mesura de la proposta.`;
  /* Des de la fitxa, s'hi torna sempre: és on era l'usuari. */
  if(pp.fitxa){ editaAlumne(pp.alumne); toast(msg); return; }
  toast(msg);
  const on = await obreDlg("Pla creat",
    `<p>S'ha creat el pla <b>${esc(p.id)}</b> de <b>${esc(a.alias)}</b>${
      n ? ` amb <b>${n===1 ? "una mesura" : n + " mesures"}</b> de la proposta, ja carregades al pas 4` : ""
    }. On vols continuar?</p>`,
    [{text:"Torna a la fitxa de l'alumne/a", classe:"ghost", valor:"fitxa"},
     {text:"Vés al pas 1 del pla", classe:"primary", valor:"pi"}]);
  if(on === "pi") obrePi(p.id);
  else if(on === "fitxa") editaAlumne(pp.alumne);
}

function pintaProposta(){
  const cos = $("#pp-body"); if(!cos) return;
  const pp = state.pp, p = pp.pi ? pi(pp.pi) : null;
  const items = preparaProposta(false);
  const dest = p ? [DEST_TOTES, ...p.materies] : [];
  const perInt = {};
  items.forEach(x => (perInt[x.mesura.intensitat] = perInt[x.mesura.intensitat] || []).push(x));
  const cap = `<div class="note info" style="margin:10px 0 4px">
    La proposta és la <b>suma</b> de les plantilles de cada perfil marcat a la fitxa, sense duplicats: no hi ha combinacions predefinides. Les mesures de <b>nucli</b> arriben marcades i les <b>complementàries</b>, desmarcades. Res no és definitiu: podràs editar-ho tot al pas 4.
    ${pp.perfils.map(x => { const pl = plantillaPerfil(x); return pl ? `<details style="margin-top:8px"><summary class="small"><b>${esc(pl.perfil)}</b> · ${esc(pl.nom)}</summary>
      <div class="small" style="margin:6px 0 0;line-height:1.55">${esc(pl.resum)}<div class="legal" style="margin-top:5px">${esc(pl.evidencia)}</div></div></details>` : ""; }).join("")}
    ${pp.base && PERFIL_BASE.resum ? `<details style="margin-top:8px"><summary class="small"><b>${esc(PERFIL_BASE.titol)}</b></summary>
      <div class="small" style="margin:6px 0 0;line-height:1.55">${esc(PERFIL_BASE.resum)}<div class="legal" style="margin-top:5px">${esc(PERFIL_BASE.evidencia)}</div></div></details>` : ""}
  </div>`;
  const cos2 = INTENSITATS.map(i => {
    const g = perInt[i]; if(!g || !g.length) return "";
    return `<div class="grp-title"><span class="eyebrow">Mesures i suports ${esc(INTENSITAT_PLURAL[i])}</span><span class="muted small">${g.length}</span></div>
      <p class="legal" style="margin:2px 0 8px">${esc(INTENSITAT_INFO[i].nota)}</p>
      ${g.map(x => filaProposta(x, p, dest)).join("")}`;
  }).join("");
  cos.innerHTML = cap + (cos2 || `<div class="empty"><b>Cap mesura a proposar</b>Marca almenys un perfil amb plantilla a la fitxa de l'alumne/a.</div>`);
  comptaProposta();
}

function filaProposta(x, p, dest){
  const b = x.mesura;
  const ja = p && p.adaptacions.some(m => m.adId === x.id);
  const k = "pp-" + x.id;
  return `<div class="chk pp-fila${ja?" ja":""}">
    <input type="checkbox" id="${k}" ${state.pp.tria[x.id]?"checked":""} ${ja?"disabled":""}
      onchange="state.pp.tria[${jq(x.id)}]=this.checked;comptaProposta()">
    <span class="txt">
      <label class="cap" for="${k}"><b>${esc(b.titol)}</b>
        ${tagIntensitat(b.intensitat)}
        <span class="tag${x.prioritat==="nucli"?" met":""}">${x.prioritat==="nucli"?"Nucli":"Complementària"}</span>
        ${ja?`<span class="tag">Ja consta al pla</span>`:""}</label>
      <div class="small muted" style="margin-top:4px;line-height:1.55">${esc(b.concrecio || b.desc)}</div>
      <div class="pp-peu">
        <span class="legal" style="flex:1;min-width:150px">Prové de: ${esc(x.origens.join(" · "))}</span>
        ${!ja && dest.length > 1 ? `<span class="mes-f"><span>Afegeix a</span>
          <select onchange="state.pp.desti[${jq(x.id)}]=this.value">
            ${dest.map(d=>`<option value="${esc(d)}" ${state.pp.desti[x.id]===d?"selected":""}>${esc(d)}</option>`).join("")}</select></span>` : ""}
      </div>
    </span></div>`;
}

/* Recompta sense repintar, per no perdre la posició de lectura de la llista.
   Només compta el que hi ha a la llista ara mateix: en treure la base universal
   les seves mesures queden marcades a pp.tria per si es torna a posar, però
   mentrestant no s'han de comptar ni carregar. */
function comptaProposta(){
  const pp = state.pp;
  const n = combinaPerfils(pp.perfils, pp.base).filter(x => pp.tria[x.id]).length;
  const c = $("#pp-count");
  if(c) c.textContent = n + (n===1 ? " mesura marcada" : " mesures marcades");
  const b = $("#pp-ok");
  if(b){ b.textContent = n ? `Carrega ${n===1?"la mesura":"les "+n+" mesures"} al pla` : "Carrega-les al pla"; b.disabled = !n; }
}

function aplicaProposta(){
  const pp = state.pp, p = pp.pi ? pi(pp.pi) : null;
  if(!p){ toast("Tria un pla de destinació."); return; }
  const items = combinaPerfils(pp.perfils, pp.base).filter(x => pp.tria[x.id]);
  if(!items.length){ toast("No hi ha cap mesura marcada."); return; }
  let n = 0;
  items.forEach(x => {
    if(p.adaptacions.some(m => m.adId === x.id)) return;
    p.adaptacions.push(itemMesura(x.mesura, pp.desti[x.id] || DEST_TOTES));
    n++;
  });
  desa();
  closeModal();
  const msg = n ? `${n===1 ? "Una mesura carregada" : n + " mesures carregades"} al pla ${p.id}.`
                : "Les mesures marcades ja constaven al pla.";
  /* Carregar la proposta no fa navegar enlloc: des de la fitxa de l'alumne/a
     s'hi torna, i des de qualsevol altre lloc es queda on era, repintat. */
  if(pp.fitxa){ render(); editaAlumne(pp.alumne); }
  else render();
  toast(msg);
}
