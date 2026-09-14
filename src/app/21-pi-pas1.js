/* ----- Pas 1: dades personals i escolars (seccions 1 i 2) ----- */
function pas1(p, a){
  return `
  <div class="card"><div class="card-h"><span class="num">1</span><h2>Dades personals</h2></div><div class="card-b">
    <div class="note info" style="margin-bottom:14px">Les dades personals es prenen de la fitxa de l'alumne/a. <button class="btn sm" onclick="editaAlumne('${a.id}')">Edita la fitxa</button></div>
    <div class="scroll-x"><table class="stack"><tbody>
      ${[["Nom i cognoms", a.alias],["Data de naixement", dataCat(a.naixement)],["Lloc de naixement", a.lloc],["Adreça", a.adreca],["Telèfon", a.telefon],["Pare, mare o tutor/a legal", a.tutorLegal],["Llengua d'ús habitual", a.llengua],["Altres llengües que coneix", a.altresLlengues]]
        .map(([k,v])=>`<tr><td data-l="Camp" style="width:38%"><span class="eyebrow">${k}</span></td><td data-l="Valor">${esc(v)||'<span class="muted">—</span>'}</td></tr>`).join("")}
    </tbody></table></div>
  </div></div>

  <div class="card" data-qc="escolars"><div class="card-h"><span class="num">2</span><h2>Dades escolars</h2></div><div class="card-b">
    <div class="row g3 top">
      <label class="field"><span class="lbl">Etapa</span>
        <select onchange="canviaEtapaPla(this.value)">${ETAPES.map(e=>`<option ${etapaPla(p)===e?"selected":""}>${e}</option>`).join("")}</select>
        <span class="small muted" style="display:block;margin-top:5px;line-height:1.45">${esPlaPrim(p)
          ? "Currículum de les àrees de primària (annex 2)."
          : "Currículum de les matèries de l'ESO (annex 3), amb el de primària a mà si cal ajustar-lo a un nivell inferior."}</span></label>
      <label class="field"><span class="lbl">Curs</span>
        <select onchange="up(p=>p.de.curs=this.value)"><option value="">—</option>
          ${cursosEtapa(etapaPla(p)).map(c=>{const v=cursSol(c);return `<option value="${esc(v)}" ${p.de.curs===v?"selected":""}>${esc(v)}</option>`;}).join("")}</select></label>
      <label class="field"><span class="lbl">Grup</span><input type="text" value="${esc(p.de.grup)}" onchange="up(p=>p.de.grup=this.value)"></label>
      <label class="field"><span class="lbl">Curs escolar</span><input type="text" value="${esc(p.curs)}" onchange="up(p=>p.curs=this.value)"></label>
    </div>
    <label class="field" data-qc="codi"><span class="lbl">Codi del pla</span>
      <input type="text" id="pi-codi" class="mono" value="${esc(p.id)}" maxlength="${CODI_PI_MAX}"
        onchange="canviaCodiPi(${jq(p.id)}, this.value)">
      <span class="small muted" style="display:block;margin-top:4px">Surt a la capçalera del document imprès. Pots adaptar-lo a la nomenclatura del centre; ha de ser únic i admet lletres, xifres, espais i els signes . _ - / ·</span>
    </label>
    <label class="field"><span class="lbl">Tutor/a responsable de coordinar l'elaboració del PI</span><input type="text" value="${esc(p.de.tutor)}" onchange="up(p=>p.de.tutor=this.value)"></label>
    <label class="field"><span class="lbl">Altres docents i/o especialistes que intervenen</span>
      <textarea onchange="up(p=>p.de.altresDocents=this.value)" placeholder="Docents de matèria, mestre/a de pedagogia terapèutica, especialista d'orientació educativa, educador/a, vetlladora, professionals externs…">${esc(p.de.altresDocents)}</textarea>
      <span class="small muted" style="display:block;margin-top:4px">Qui més intervé en el pla al costat del tutor/a. Al pas 3 se'n concreten els professionals i serveis responsables de cada actuació.</span>
    </label>
    <div class="row g3">
      <label class="field"><span class="lbl">Data d'arribada a Catalunya</span><input type="date" value="${esc(p.de.dataArribada)}" onchange="up(p=>p.de.dataArribada=this.value)"></label>
      <label class="field"><span class="lbl">Incorporació al sistema educatiu català</span><input type="date" value="${esc(p.de.dataSistema)}" onchange="up(p=>p.de.dataSistema=this.value)"></label>
      <label class="field"><span class="lbl">Incorporació al centre actual</span><input type="date" value="${esc(p.de.dataCentre)}" onchange="up(p=>p.de.dataCentre=this.value)"></label>
    </div>
    <div class="row">
      <label class="field"><span class="lbl">Escolarització prèvia</span><select onchange="up(p=>p.de.escolaritzacio=this.value)"><option value="">—</option>${ESCOLARITZACIO.map(x=>`<option ${p.de.escolaritzacio===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label class="field"><span class="lbl">Repeticions de curs</span><input type="text" value="${esc(p.de.repeticions)}" onchange="up(p=>p.de.repeticions=this.value)" placeholder="Cap / 3r de primària"></label>
    </div>
    <label class="field"><span class="lbl">Centres on ha estat matriculat anteriorment</span><input type="text" value="${esc(p.de.centresAnteriors)}" onchange="up(p=>p.de.centresAnteriors=this.value)"></label>
    <label class="field"><span class="lbl">Mesures i suports universals, addicionals i/o intensius rebuts fins ara</span><textarea onchange="up(p=>p.de.mesuresPrevies=this.value)">${esc(p.de.mesuresPrevies)}</textarea></label>
    <label class="field" style="margin-bottom:0"><span class="lbl">Altres informacions d'interès</span><textarea onchange="up(p=>p.de.altres=this.value)">${esc(p.de.altres)}</textarea></label>
  </div></div>`;
}

/* ----- Canvi d'etapa d'un pla -----
   L'etapa decideix quin currículum carrega el pla. Canviar-la a mig camí no és
   una operació neutra: les matèries de l'ESO no existeixen a primària i a
   l'inrevés, i el que s'hagi triat de l'etapa anterior deixa de tenir on
   penjar. Per això sempre es diu abans què se n'anirà i les mesures que hi
   estiguessin assignades tornen a ser transversals en comptes de perdre's. */
async function canviaEtapaPla(v){
  const p = P();
  if(!p || !ETAPES.includes(v) || etapaPla(p) === v){ renderPi(); return; }
  const noves = v === "Primària" ? AREES_PRIM : MATERIES;
  const fora = p.materies.filter(m => !noves.includes(m) && !EXTRA_FILES.includes(m));
  const queden = p.materies.filter(m => !fora.includes(m));
  const perduts = queden.reduce((n, m) => n + comptaTriat(p, m), 0);
  const punts = [];
  if(fora.length) punts.push(`<b>${esc(fora.join(", "))}</b>: ${fora.length===1?"no existeix":"no existeixen"} a ${esc(v)} i ${fora.length===1?"sortirà":"sortiran"} del pla amb tot el que s'hi hagi triat`);
  if(perduts) punts.push(`<b>${perduts}</b> element${perduts===1?"":"s"} del currículum ${perduts===1?"triat":"triats"} a les matèries que es mantenen: són de l'etapa anterior i es trauran`);
  if(punts.length && !await confirmaEsborrat(`Canvia l'etapa del pla a ${v}`,
        `El pla passarà a treballar amb el currículum de <b>${esc(v)}</b>:`, punts,
        {confirma:"Canvia l'etapa",
         peu:"Les mesures i els suports, els objectius, l'horari i la resta d'apartats es conserven. Les mesures assignades a una matèria que surti del pla passen a ser transversals."})) {
    renderPi();
    return;
  }
  up(x => {
    x.de.etapa = v;
    const nc = numCurs(x.de.curs);
    if(nc && nc > cursosEtapa(v).length) x.de.curs = "";
    fora.forEach(m => {
      x.materies = x.materies.filter(y => y !== m);
      delete x.mesures[m]; delete x.curr[m];
      x.adaptacions.forEach(z => { if(z.materia === m) z.materia = DEST_TOTES; });
      (x.objectius||[]).forEach(o => { if(o.materia === m) o.materia = ""; });
    });
    alineaFontsEtapa(x);
  });
  state.vistaCurr = {}; state.vistaAnim = {}; state.openMat = {};
  renderPi();
  toast(`El pla passa a l'etapa de ${v === "Primària" ? "primària" : "l'ESO"}.`);
}
/* Elements del currículum triats en una matèria, comptant totes les fonts. */
function comptaTriat(p, nom){
  const st = p.curr[nom];
  if(!st) return 0;
  return (st.criteris||[]).length + totsSabers(st).length + (st.sabersSense||[]).length
       + Object.values(st.adaptCE||{}).filter(x => (x||"").trim()).length;
}
/* Treu de cada matèria tot el que no provingui d'una font vàlida a l'etapa
   actual del pla. S'executa dins d'un up(), amb l'etapa ja canviada. */
function alineaFontsEtapa(x){
  (x.materies||[]).forEach(nom => {
    const st = currDe(x, nom);
    if(esPlaPrim(x)) st.prim = [];
    const ok = fontsDe(x, nom);
    st.criteris = (st.criteris||[]).filter(k => {
      if(ok.includes(fontDeClau(k))) return true;
      delete st.adapt[k]; delete st.accions[k]; delete st.sabersCrit[k]; delete st.cursCrit[k];
      return false;
    });
    Object.keys(st.adaptCE||{}).forEach(k => { if(!ok.includes(ceDeClau(nom, k).font)) delete st.adaptCE[k]; });
    Object.keys(st.sabersCrit||{}).forEach(k => {
      st.sabersCrit[k] = st.sabersCrit[k].filter(s => ok.includes(s.font));
      if(!st.sabersCrit[k].length) delete st.sabersCrit[k];
    });
    st.sabersSense = (st.sabersSense||[]).filter(s => ok.includes(s.font));
  });
}

