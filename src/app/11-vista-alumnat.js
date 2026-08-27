/* ---------- 6. Alumnat ---------- */
/* ----- Cerca i filtres d'Alumnat -----
   Amb pocs alumnes la llista es llegeix sencera, però un centre gran pot tenir
   centenars de fitxes i més d'un pla per fitxa. Els filtres de pla (tipus i
   estat) actuen sobre l'alumne/a: hi surt si ALGUN dels seus plans hi encaixa. */
function filtresAlumnesActius(){
  const f = state.alFilters;
  return !!(f.q.trim() || f.curs || f.grup || f.perfil || f.tipus || f.estat);
}
function netejaFiltresAlumnes(){
  state.alFilters = {q:"", curs:"", grup:"", perfil:"", tipus:"", estat:""};
  renderAlumnes();
}
function filtraAlumnes(){
  const f = state.alFilters;
  const q = f.q.trim().toLowerCase();
  return state.alumnes.filter(a => {
    const seus = pisDe(a.id);
    if(f.curs && a.curs !== f.curs) return false;
    if(f.grup && a.grup !== f.grup) return false;
    if(f.perfil && !(a.perfils||[]).includes(f.perfil)) return false;
    if(f.tipus === "cap"){ if(seus.length) return false; }
    else if(f.tipus && !seus.some(p => p.tipus === f.tipus)) return false;
    if(f.estat && !seus.some(p => p.estat === f.estat)) return false;
    if(q){
      /* La cerca lliure mira també els perfils i els codis dels plans: és el
         camí més curt per trobar una fitxa quan només se'n recorda un tros. */
      const text = [a.alias, a.curs, a.grup, a.tutorLegal, a.tutorLegal2,
                    ...(a.perfils||[]), ...seus.map(p => p.id)].join(" ").toLowerCase();
      if(!text.includes(q)) return false;
    }
    return true;
  }).sort((x, y) => (x.grup||"").localeCompare(y.grup||"", "ca")
                 || (x.alias||"").localeCompare(y.alias||"", "ca"));
}

/* Un pla dins de la fila d'Alumnat: codi per obrir-lo, estat per saber com està
   i «×» per eliminar-lo. El tipus va al títol per no allargar la cel·la. */
function fitxaPiFila(p){
  const tipus = p.tipus === "continguts" ? "curricular" : "metodològic i d'accés";
  return `<span class="pi-chip">
    <span class="pi-chip-b">
      <button class="btn sm mono" title="Obre el pla ${esc(p.id)} · ${tipus}" onclick="obrePi(${jq(p.id)})">${esc(p.id)}</button>
      <button class="btn sm ghost danger treu" title="Elimina el pla ${esc(p.id)}" aria-label="Elimina el pla ${esc(p.id)}" onclick="esborraPi(${jq(p.id)})">×</button>
    </span>
    ${estatTag(p.estat)}</span>`;
}

function renderAlumnes(){
  const f = state.alFilters;
  const llista = filtraAlumnes();
  const total = state.alumnes.length;
  const actius = filtresAlumnesActius();
  const cursos = [...new Set(state.alumnes.map(a => a.curs).filter(Boolean))].sort();
  const grups = [...new Set(state.alumnes.map(a => a.grup).filter(Boolean))].sort();
  const perfils = [...new Set(state.alumnes.flatMap(a => a.perfils||[]))].sort((x,y)=>x.localeCompare(y,"ca"));
  const opcions = (llista2, valor) => llista2.map(x =>
    `<option value="${esc(x)}" ${valor===x?"selected":""}>${esc(x)}</option>`).join("");

  const barra = `
  <div class="toolbar">
    <input type="search" data-cerca="alumnes" placeholder="Cerca per nom, grup, perfil o codi de PI" value="${esc(f.q)}"
      oninput="state.alFilters.q=this.value;cercaViva(this,renderAlumnes)">
    <select onchange="state.alFilters.curs=this.value;renderAlumnes()">
      <option value="">Tots els cursos</option>${opcions(cursos, f.curs)}</select>
    <select onchange="state.alFilters.grup=this.value;renderAlumnes()">
      <option value="">Tots els grups</option>${opcions(grups, f.grup)}</select>
    <select onchange="state.alFilters.perfil=this.value;renderAlumnes()">
      <option value="">Tots els perfils</option>${opcions(perfils, f.perfil)}</select>
    <select onchange="state.alFilters.tipus=this.value;renderAlumnes()">
      <option value="">Amb PI o sense</option>
      <option value="metodologic" ${f.tipus==="metodologic"?"selected":""}>PI metodològic i d'accés</option>
      <option value="continguts" ${f.tipus==="continguts"?"selected":""}>PI curricular</option>
      <option value="cap" ${f.tipus==="cap"?"selected":""}>Sense cap PI</option></select>
    <select onchange="state.alFilters.estat=this.value;renderAlumnes()">
      <option value="">Tots els estats del PI</option>
      ${["esborrany","vigent","seguiment","tancat"].map(e=>`<option value="${e}" ${f.estat===e?"selected":""}>${e[0].toUpperCase()+e.slice(1)}</option>`).join("")}</select>
    <span style="flex:1"></span>
    <span class="muted small mono">${llista.length === total ? `${total} alumne${total===1?"":"s"}` : `${llista.length} de ${total}`}</span>
    ${actius ? `<button class="btn sm ghost" onclick="netejaFiltresAlumnes()">Neteja els filtres</button>` : ""}
  </div>`;

  if(total === 0){
    $("#view-alumnes").innerHTML = `<div class="card"><div class="empty"><b>Encara no hi ha alumnat</b>Afegeix una fitxa per començar a elaborar un PI.
      <div style="margin-top:14px"><button class="btn primary" onclick="editaAlumne()">Afegeix alumne/a</button></div></div></div>`;
    return;
  }
  if(llista.length === 0){
    $("#view-alumnes").innerHTML = barra + `<div class="card"><div class="empty"><b>Cap fitxa amb aquests filtres</b>Prova de treure'n algun o de canviar el text de la cerca.
      <div style="margin-top:14px"><button class="btn" onclick="netejaFiltresAlumnes()">Neteja els filtres</button></div></div></div>`;
    return;
  }

  $("#view-alumnes").innerHTML = barra
   + `<div class="card"><div class="scroll-x"><table class="stack">
      <thead><tr><th>Alumne/a</th><th>Curs i grup</th><th>Perfils</th><th>Informe EAP</th><th>PI</th><th></th></tr></thead>
      <tbody>${llista.map(a => {
        const seus = pisDe(a.id);
        return `<tr>
          <td data-l="Alumne/a"><span class="alias">${esc(a.alias)}</span></td>
          <td data-l="Curs i grup">${esc(a.curs)} · ${esc(a.grup)}</td>
          <td data-l="Perfils">${a.perfils.length ? a.perfils.map(x=>`<span class="tag" style="margin:0 3px 3px 0">${esc(x)}</span>`).join("") : '<span class="muted small">—</span>'}</td>
          <td data-l="Informe EAP">${a.eap ? `<span class="tag met">Sí · ${dataCat(a.dataEap)}</span>` : '<span class="muted small">No consta</span>'}</td>
          <td data-l="PI">${seus.length ? seus.map(fitxaPiFila).join("") : `<button class="btn sm" onclick="nouPi('${a.id}')">Crea'n un</button>`}</td>
          <td><div class="fila-accions">
            <button class="btn sm ghost" onclick="editaAlumne('${a.id}')">Edita</button>
            <button class="btn sm ghost danger" onclick="esborraAlumne('${a.id}')">Elimina</button>
          </div></td>
        </tr>`;
      }).join("")}</tbody></table></div></div>
      <p class="legal">Recomanació: fes servir inicials o un àlies en lloc del nom complet mentre treballes el document. Les dades es guarden només en aquest navegador: descarrega't una còpia des de <button class="btn sm ghost" onclick="go('dades')">Dades i còpies</button></p>`;
}
function editaAlumne(id){
  const a = id ? state.alumnes.find(x=>x.id===id) : {id:uid("AL"), alias:"", grup:"", etapa:"ESO", curs:"1r ESO", perfils:[], naixement:"", lloc:"", adreca:"", tutorLegal:"", telefon:"", correu:"", tutorLegal2:"", telefon2:"", correu2:"", llengua:"", altresLlengues:"", eap:false, dataEap:""};
  /* Els perfils que no són a la llista tancada són els que s'han escrit a
     «Altres»: es desen igual que la resta, dins de a.perfils. */
  const perfilsAltres = (a.perfils||[]).filter(x => !PERFILS.includes(x)).join("; ");
  const tut2 = !!(a.tutorLegal2||"").trim();
  openModal(id ? "Fitxa de l'alumne/a" : "Nou alumne/a", `<div style="padding:20px 22px 28px">
    <div class="row">
      <label class="field"><span class="lbl">Nom o àlies</span><input type="text" id="a-alias" value="${esc(a.alias)}" placeholder="M. R."></label>
      <label class="field"><span class="lbl">Data de naixement</span><input type="date" id="a-naix" value="${esc(a.naixement)}"></label>
    </div>
    <div class="row">
      <label class="field"><span class="lbl">Lloc de naixement</span><input type="text" id="a-lloc" value="${esc(a.lloc)}"></label>
      <label class="field"><span class="lbl">Adreça</span><input type="text" id="a-adreca" value="${esc(a.adreca)}"></label>
    </div>
    <div class="tutor-box">
      <span class="eyebrow">Pare, mare o tutor/a legal</span>
      <div class="row g3" style="margin:8px 0 0">
        <label class="field"><span class="lbl">Nom i cognoms</span><input type="text" id="a-tutleg" value="${esc(a.tutorLegal)}"></label>
        <label class="field"><span class="lbl">Telèfon</span><input type="text" id="a-tel" value="${esc(a.telefon)}" inputmode="tel"></label>
        <label class="field"><span class="lbl">Correu electrònic</span><input type="text" id="a-correu" value="${esc(a.correu||"")}" placeholder="familia@exemple.cat" inputmode="email" autocomplete="off"></label>
      </div>
    </div>
    <div class="tutor-box" id="a-tut2" ${tut2?"":'style="display:none"'}>
      <span class="eyebrow">Segon/a tutor/a legal</span>
      <div class="row g3" style="margin:8px 0 0">
        <label class="field"><span class="lbl">Nom i cognoms</span><input type="text" id="a-tutleg2" value="${esc(a.tutorLegal2||"")}"></label>
        <label class="field"><span class="lbl">Telèfon</span><input type="text" id="a-tel2" value="${esc(a.telefon2||"")}" inputmode="tel"></label>
        <label class="field"><span class="lbl">Correu electrònic</span><input type="text" id="a-correu2" value="${esc(a.correu2||"")}" placeholder="familia@exemple.cat" inputmode="email" autocomplete="off"></label>
      </div>
    </div>
    <div id="a-tut2-btn" style="margin:0 0 14px${tut2?";display:none":""}">
      <button type="button" class="btn sm ghost" onclick="mostraSegonTutor()">+ Afegeix un segon tutor/a</button>
    </div>
    <div class="row">
      <label class="field"><span class="lbl">Llengua d'ús habitual</span><input type="text" id="a-llengua" value="${esc(a.llengua)}"></label>
      <label class="field"><span class="lbl">Altres llengües que coneix</span><input type="text" id="a-altresll" value="${esc(a.altresLlengues)}"></label>
    </div>
    <div class="row g3 top">
      <label class="field"><span class="lbl">Etapa</span><select id="a-etapa" onchange="canviaEtapaAlumne()">${ETAPES.map(e=>`<option ${etapaAlumne(a)===e?"selected":""}>${e}</option>`).join("")}</select>
        <span class="small muted" style="display:block;margin-top:5px;line-height:1.45">Decideix el currículum del pla: àrees de primària (annex 2) o matèries de l'ESO (annex 3).</span></label>
      <label class="field"><span class="lbl">Curs</span><select id="a-curs">${cursosEtapa(etapaAlumne(a)).map(c=>`<option ${a.curs===c?"selected":""}>${c}</option>`).join("")}</select></label>
      <label class="field"><span class="lbl">Grup</span><input type="text" id="a-grup" value="${esc(a.grup)}" placeholder="2n A"></label>
      <label class="field"><span class="lbl">Data de l'informe EAP</span><input type="date" id="a-dataeap" value="${esc(a.dataEap)}"></label>
    </div>
    <div class="field"><span class="lbl">Perfils de necessitats específiques de suport educatiu</span>
      <div class="chips" id="a-perfils">${PERFILS.map(x=>`<button type="button" class="chip" data-p="${esc(x)}" aria-pressed="${a.perfils.includes(x)}" onclick="this.setAttribute('aria-pressed', this.getAttribute('aria-pressed')!=='true')">${x}</button>`).join("")}<button type="button" class="chip" id="a-perfil-altres" aria-pressed="${!!perfilsAltres}" onclick="commutaPerfilAltres()">Altres…</button></div>
      <div id="a-altres-wrap" style="margin-top:9px${perfilsAltres?"":";display:none"}">
        <input type="text" id="a-altres" value="${esc(perfilsAltres)}" placeholder="Descriu el perfil o la necessitat; si n'hi ha més d'un, separa'ls amb punt i coma">
        <span class="small muted" style="display:block;margin-top:4px">Aquests perfils es desen igual que la resta i surten al document, però no alimenten els suggeriments del banc de mesures.</span>
      </div>
    </div>
    <div class="note info" style="margin:14px 0 0">
      <b>Proposta de mesures i suports segons el perfil.</b> Cada perfil té una plantilla de mesures del banc del Departament, seleccionades amb la normativa i la literatura professional de referència. La proposta es revisa abans de carregar-la i es continua editant al <b>pas 4</b> del pla.
      <div style="margin-top:10px"><button type="button" class="btn sm" onclick="desaAlumne('${a.id}',${!id},'proposta')">Desa la fitxa i mostra la proposta…</button></div>
    </div>
    <div style="display:flex;gap:9px;margin-top:18px;flex-wrap:wrap">
      <button class="btn primary" onclick="desaAlumne('${a.id}',${!id})">Desa</button>
      <button class="btn ghost" onclick="closeModal()">Cancel·la</button>
      ${id?`<button class="btn danger" style="margin-left:auto" onclick="esborraAlumne('${a.id}')">Elimina</button>`:""}
    </div></div>`);
}
/* En canviar l'etapa de la fitxa, el desplegable de curs passa als cursos de
   l'etapa nova i hi manté el mateix número de curs sempre que hi existeixi. */
function canviaEtapaAlumne(){
  const e = $("#a-etapa"), c = $("#a-curs");
  if(!e || !c) return;
  const ll = cursosEtapa(e.value), abans = numCurs(c.value);
  c.innerHTML = ll.map(x => `<option>${esc(x)}</option>`).join("");
  c.value = ll.find(x => numCurs(x) === abans) || ll[0];
}

/* Mostra el camp del segon tutor/a legal, que està amagat fins que es demana. */
function mostraSegonTutor(){
  const f = $("#a-tut2"), b = $("#a-tut2-btn");
  if(!f) return;
  f.style.display = ""; if(b) b.style.display = "none";
  const i = $("#a-tutleg2"); if(i) i.focus();
}
/* Perfil «Altres…»: obre o tanca el camp de text lliure. */
function commutaPerfilAltres(){
  const b = $("#a-perfil-altres"), on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", String(on));
  $("#a-altres-wrap").style.display = on ? "" : "none";
  if(on){ const i = $("#a-altres"); if(i) i.focus(); }
}
/* `seguent` val "proposta" quan es desa des del botó de proposta de mesures:
   la fitxa es desa primer perquè el diàleg treballi amb els perfils definitius. */
function desaAlumne(id, nou, seguent){
  const g = s => { const e = $("#"+s); return e ? e.value.trim() : ""; };
  const perfils = [...document.querySelectorAll("#a-perfils .chip[data-p]")]
    .filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.dataset.p);
  const bAlt = $("#a-perfil-altres");
  if(bAlt && bAlt.getAttribute("aria-pressed")==="true")
    g("a-altres").split(";").map(x=>x.trim()).filter(Boolean)
      .forEach(x => { if(!perfils.includes(x)) perfils.push(x); });
  if(!g("a-alias")){ toast("Cal indicar un nom o àlies."); return; }
  const correu = g("a-correu"), correu2 = g("a-correu2");
  const bo = c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
  if(correu && !bo(correu)){ toast("El correu del pare, mare o tutor/a legal no sembla vàlid."); return; }
  if(correu2 && !bo(correu2)){ toast("El correu del segon/a tutor/a legal no sembla vàlid."); return; }
  const obj = {id, alias:g("a-alias"), naixement:g("a-naix"), lloc:g("a-lloc"), adreca:g("a-adreca"),
    tutorLegal:g("a-tutleg"), telefon:g("a-tel"), correu,
    tutorLegal2:g("a-tutleg2"), telefon2:g("a-tel2"), correu2,
    llengua:g("a-llengua"), altresLlengues:g("a-altresll"),
    etapa:g("a-etapa") || "ESO",
    curs:g("a-curs"), grup:g("a-grup"), dataEap:g("a-dataeap"), eap:!!g("a-dataeap"), perfils};
  if(nou) state.alumnes.push(obj);
  else Object.assign(state.alumnes.find(x=>x.id===id), obj);
  desa(); closeModal(); render();
  if(seguent === "proposta"){
    if(!perfils.some(x => plantillaPerfil(x))){
      toast("Cap dels perfils marcats té plantilla de mesures.");
      return;
    }
    dialegProposta(id, null, true);
    return;
  }
  toast("Fitxa desada.");
}
/* ---------- Esborrat de fitxes i de plans ----------
   Tot l'esborrat viu a la vista d'Alumnat, que és on hi ha la fitxa (l'objecte
   pare) i, a la mateixa fila, els plans que en depenen. El tauler es deixa net
   de controls destructius perquè les seves files són clicables i obren l'editor:
   un control d'esborrat al costat convidaria a accidents.

   Cap pla no pot quedar orfe: eliminar una fitxa elimina sempre els seus plans,
   i sempre es diu abans quants són i què contenen. */

/* Frases amb el volum de feina que hi ha dins d'un pla, per poder dir amb
   precisió què es perdrà. */
function resumContingutPi(p){
  const parts = [];
  const posa = (q, un, molts) => { if(q) parts.push(`<b>${q}</b> ${q===1 ? un : molts}`); };
  posa(p.adaptacions.length, "mesura o suport", "mesures i suports");
  posa(p.objectius.length, "objectiu", "objectius");
  posa(comptaAdaptacions(p), "adaptació curricular", "adaptacions curriculars");
  posa((p.seguiments||[]).length, "seguiment registrat", "seguiments registrats");
  return parts;
}

/* Fila descriptiva d'un pla dins d'un diàleg d'esborrat. */
function fitxaPiDlg(p){
  const cont = resumContingutPi(p);
  return `<b>${esc(p.id)}</b> · ${esc(p.curs)} ${estatTag(p.estat)}
    <div class="small muted" style="margin-top:2px">${cont.length ? cont.join(" · ") : "Sense contingut encara"}</div>`;
}

/* Treu un pla de l'estat i neteja tot el que hi apuntava. Sense confirmar res:
   la confirmació la fa qui crida. */
function treuPi(id){
  state.pis = state.pis.filter(p => p.id !== id);
  if(state.currentPi === id) state.currentPi = null;
  if(state.seguimentPi === id) state.seguimentPi = null;
  if(state.docPi === id) state.docPi = null;
  delete state.draftValoracions[id];
}

/* Després d'esborrar: si l'usuari era a l'editor del pla que ja no hi és, no
   se'l deixa en una pantalla buida. */
function tornaDespresDEsborrar(){
  if(state.view === "pi" && !state.currentPi) go("alumnes");
  else render();
}

async function esborraPi(id){
  const p = pi(id);
  if(!p) return;
  const a = alumne(p.alumneId);
  if(!await confirmaEsborrat("Elimina el pla",
        `Vols eliminar el pla <b>${esc(p.id)}</b> de <b>${esc(a.alias)}</b>? La fitxa de l'alumne/a es manté: només s'elimina aquest pla.`,
        [fitxaPiDlg(p)],
        {confirma:"Elimina el pla",
         peu:"L'acció no es pot desfer. Si el que vols és tancar-lo perquè ja no és vigent, canvia'n l'estat a «Tancat» en lloc d'eliminar-lo."})) return;
  treuPi(id);
  desa(); closeModal();
  tornaDespresDEsborrar();
  toast(`Pla ${p.id} eliminat.`);
}

async function esborraAlumne(id){
  const a = state.alumnes.find(x => x.id === id);
  if(!a) return;
  const seus = pisDe(id);
  const n = seus.length;
  const ok = n
    ? await confirmaEsborrat("Elimina la fitxa i els seus plans",
        `Vols eliminar la fitxa de <b>${esc(a.alias)}</b>? ${n===1 ? "També s'eliminarà el pla que en depèn:" : `També s'eliminaran els <b>${n}</b> plans que en depenen:`}`,
        seus.map(fitxaPiDlg),
        {confirma: n===1 ? "Elimina la fitxa i el pla" : `Elimina la fitxa i els ${n} plans`,
         peu:"L'acció no es pot desfer. Descarrega't una còpia des de «Dades i còpies» si vols conservar-ne el rastre."})
    : await confirma("Elimina la fitxa",
        `Vols eliminar la fitxa de <b>${esc(a.alias)}</b>? No té cap pla associat, però l'acció no es pot desfer.`,
        {confirma:"Elimina la fitxa", perillos:true});
  if(!ok) return;
  seus.forEach(p => treuPi(p.id));
  state.alumnes = state.alumnes.filter(x => x.id !== id);
  desa(); closeModal();
  tornaDespresDEsborrar();
  toast(n ? `Fitxa i ${n} pla${n===1?"":"ns"} eliminats.` : "Fitxa eliminada.");
}

