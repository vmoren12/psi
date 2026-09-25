/* ---------- 11. Document ---------- */
function obreDoc(id){
  const p = pi(id), a = alumne(p.alumneId);
  state.docPi = id;
  docEditant = false;
  openModal("PI · " + a.alias, doc(p, a), false, true);
}
/* Repinta el document obert sense perdre la posició de lectura. */
function refrescaDoc(){
  if(!state.docPi || !$("#modal").classList.contains("on")) return;
  const p = pi(state.docPi);
  if(!p) return;
  $("#modal-body").innerHTML = doc(p, alumne(p.alumneId));
  aplicaEdicioDoc();
}
/* Una fila de la taula de mesures del document oficial: agrupa les mesures
   triades per a una destinació i hi afegeix la concreció escrita. */
function cellaMesuresDoc(p, dest, etiqueta){
  const items = p.adaptacions.filter(x => x.materia===dest);
  const txt = (p.mesures[dest]||"").trim();
  if(!items.length && !txt) return "";
  /* Graella simplificada: només el títol de cada mesura, agrupades per
     intensitat sota un petit títol. */
  if(p.docMesuresSimples){
    if(!items.length) return "";
    const grups = INTENSITATS.map(i => [i, items.filter(x => x.intensitat===i)])
      .concat([["", items.filter(x => !INTENSITATS.includes(x.intensitat))]])
      .filter(([, l]) => l.length);
    return `<tr><td class="k">${esc(etiqueta)}</td><td>${grups.map(([i, l], n) =>
      `<div class="mes-grup"${n ? "" : ' style="margin-top:0"'}>Mesures i suports ${esc(i ? INTENSITAT_PLURAL[i] : "sense intensitat")}</div>
      <ul style="margin:0;padding-left:16px">${l.map(x => `<li>${esc(x.titol)}</li>`).join("")}</ul>`).join("")}</td></tr>`;
  }
  return `<tr><td class="k">${esc(etiqueta)}</td><td>
    ${items.length ? `<ul style="margin:0 0 ${txt?"8px":"0"};padding-left:16px">${items.map(x=>
      `<li><b>${esc(x.titol)}</b> <i>(${esc(x.intensitat)})</i>${x.text?`<br>${esc(x.text)}`:""}</li>`).join("")}</ul>` : ""}
    ${txt ? esc(txt) : ""}
  </td></tr>`;
}

/* Casella «Instrument i evidència» del document: instruments i evidències d'un
   objectiu, cadascun en forma de llista quan n'hi ha més d'un. */
function cellaAvaluacioDoc(o){
  const bloc = (camp, un, molts) => {
    const l = llistaPlena(o, camp);
    if(!l.length) return "";
    const cos = l.length === 1 ? esc(l[0])
      : `<ul style="margin:2px 0 0;padding-left:15px">${l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
    return `<div><span class="orig">${l.length===1?un:molts}</span><br>${cos}</div>`;
  };
  const parts = [bloc("instrument", "Instrument", "Instruments"),
                 bloc("evidencia", "Evidència", "Evidències")].filter(Boolean);
  return parts.length ? parts.join('<div style="height:6px"></div>') : "—";
}

/* Valoracions registrades al seguiment per a un objectiu, per ordre. */
function valoracionsObj(p, o){
  return p.seguiments.filter(s => (s.valoracions||{})[o.id])
    .map(s => ({v:s.valoracions[o.id], trimestre:s.trimestre, data:s.data}));
}
/* Casella «Avaluació»: el grau d'assoliment de cada valoració registrada. */
function cellaAssolimentDoc(p, o){
  const l = valoracionsObj(p, o);
  if(!l.length) return "—";
  return l.map(x => `<div><b>${esc(x.v)}</b><br><span class="orig">${esc(x.trimestre)} · ${dataCat(x.data)}</span></div>`)
    .join('<div style="height:5px"></div>');
}

function kv(rows){
  return `<table><tbody>${rows.map(([k,v])=>`<tr><td class="k">${k}</td><td>${v||"—"}</td></tr>`).join("")}</tbody></table>`;
}
function doc(p, a){
  const logos = state.logos || [];
  const corrents = logos.filter(l => l.totes), pag1 = logos.filter(l => !l.totes);
  const filaLogos = (arr, cls) => `<div class="logos${cls?" "+cls:""}">${arr.map(l=>`<img src="${esc(l.src)}" alt="${esc(l.nom||"Logo del centre")}">`).join("")}</div>`;
  return `<div class="doc${corrents.length ? " cap-corrent" : ""}">
  ${einesLogos()}
  ${einesDoc(p)}
  <table class="fulls">
  <thead><tr><td><div class="marge-dalt"></div>${corrents.length ? filaLogos(corrents) : ""}</td></tr></thead>
  <tbody><tr><td>
  ${pag1.length ? filaLogos(pag1, corrents.length ? "" : "puja") : ""}
  <div class="doc-cos" id="doc-cos">${p.docEdit && p.docEdit.html ? netejaHtmlDoc(p.docEdit.html) : docCos(p, a)}</div>
  </td></tr></tbody>
  <tfoot><tr><td><div class="marge-baix"></div></td></tr></tfoot>
  </table>
  </div>`;
}

/* Contingut del document generat a partir del pla. És la part que es pot
   editar a mà des de la previsualització (vegeu 51-document-edicio.js). */
function docCos(p, a){
  const prof = Object.entries(p.prof).filter(([i,v])=>v && v.on).map(([i,v])=>`<li>${esc(PROFESSIONALS[i])}${v.detall?": "+esc(v.detall):""}</li>`).join("");
  /* Una matèria surt al document si s'hi ha prioritzat algun criteri o saber,
     si s'hi han escrit criteris propis o si s'hi ha adaptat una competència
     específica (encara que no s'hagi seleccionat cap criteri concret). */
  const matsCurr = p.materies.filter(m => {
    const st = p.curr[m] || {};
    return (st.criteris||[]).length || Object.keys(st.sabersCrit||{}).length
        || (st.sabersSense||[]).length || (st.sabers||[]).length || st.propis
        || Object.values(st.adaptCE||{}).some(v => (v||"").trim());
  });
  const ambObjectius = p.objectius.length && p.docObjectius!==false;
  const ambAval = ambObjectius && p.objectius.some(o => valoracionsObj(p, o).length);
  return `
  <div class="head">
    <div style="flex:1;min-width:200px">
      <div class="centre">${esc(state.centre||"[Centre educatiu]")}</div>
      <h1>Pla de suport individualitzat</h1>
      <div class="centre">Educació bàsica · ${esPlaPrim(p)?"Educació primària":"Educació secundària obligatòria"} · Curs ${esc(p.curs)}</div>
    </div>
    <div class="centre" style="text-align:right">${esc(p.id)}<br>${p.tipus==="continguts"?"Curricular · amb adaptació de criteris":"Metodològic i d'accés"}</div>
  </div>

  <section><h2>1. Dades personals</h2>
  ${kv([["Nom i cognoms de l'alumne/a", esc(a.alias)],["Data de naixement", dataCat(a.naixement)],["Lloc de naixement", esc(a.lloc)],["Adreça", esc(a.adreca)],
        ["Nom i cognoms del pare, mare o tutor/a legal", esc(a.tutorLegal)],
        ["Telèfon del pare, mare o tutor/a legal", esc(a.telefon)],
        ["Correu electrònic del pare, mare o tutor/a legal", esc(a.correu)]]
       .concat((a.tutorLegal2||"").trim() ? [
        ["Nom i cognoms del segon/a tutor/a legal", esc(a.tutorLegal2)],
        ["Telèfon del segon/a tutor/a legal", esc(a.telefon2)],
        ["Correu electrònic del segon/a tutor/a legal", esc(a.correu2)]] : [])
       .concat([["Llengua d'ús habitual", esc(a.llengua)],["Altres llengües que coneix", esc(a.altresLlengues)]]))}</section>

  <section><h2>2. Dades escolars</h2>
  ${kv([["Etapa", esc(etapaPla(p) === "Primària" ? "Educació primària" : "Educació secundària obligatòria")],
       ["Curs", esc(p.de.curs)],["Grup", esc(p.de.grup)],["Tutor/a responsable de coordinar el PI", esc(p.de.tutor)],
       ["Data d'arribada a Catalunya", dataCat(p.de.dataArribada)],["Data d'incorporació al sistema educatiu català", dataCat(p.de.dataSistema)],
       ["Data d'incorporació al centre actual", dataCat(p.de.dataCentre)],["Escolarització prèvia", esc(p.de.escolaritzacio)],
       ["Centres on ha estat matriculat anteriorment", esc(p.de.centresAnteriors)],["Repeticions de curs", esc(p.de.repeticions)],
       ["Mesures i suports rebuts fins a l'actualitat", esc(p.de.mesuresPrevies)],["Altres informacions d'interès", esc(p.de.altres)]])}</section>

  <section><h2>3. Justificació</h2>
  <h3>Motivat per</h3>
  <ul>${p.just.motius.map(m=>{
    let ex = "";
    if(m===MOTIUS[5]) ex = (p.just.caeiProposta?` a proposta de ${esc(p.just.caeiProposta)}`:"") + (p.just.caeiMotiu?`, motivada per ${esc(p.just.caeiMotiu)}`:"");
    if(m===MOTIUS[6]) ex = p.just.altresMotiu?`: ${esc(p.just.altresMotiu)}`:"";
    return `<li>${esc(m)}${ex}</li>`;
  }).join("") || "<li>—</li>"}</ul>
  <h3>Breu justificació de la necessitat d'elaboració del PI</h3>
  <p>${esc(p.just.text)||"—"}</p>
  ${kv([["Capacitats, potencialitats i punts forts", esc(p.just.fortaleses)],["Punts febles i barreres", esc(p.just.dificultats)],["Interessos i motivacions", esc(p.just.interessos)],["Perfils de necessitats", a.perfils.map(esc).join(", ")]])}</section>

  <section><h2>4. Professionals i serveis que hi intervenen</h2>
  <ul>${prof || "<li>—</li>"}</ul></section>

  <section><h2>5. Proposta educativa · Mesures i suports</h2>
  ${p.adaptacions.length ? `<div class="doc-eina no-print" contenteditable="false"><button class="btn sm ghost" onclick="commutaMesuresSimples()">${p.docMesuresSimples ? "Mostra la redacció de cada mesura" : "Mostra només els títols de les mesures"}</button></div>` : ""}
  <table><thead><tr><th style="width:30%">Matèria / Àmbit / Projecte</th><th>Mesures i suports universals, addicionals i/o intensius</th></tr></thead>
  <tbody>
  ${cellaMesuresDoc(p, DEST_TOTES, "Totes les matèries del pla")}
  ${p.materies.map(m => cellaMesuresDoc(p, m, m)).join("") || (p.adaptacions.length ? "" : `<tr><td colspan="2">—</td></tr>`)}
  </tbody></table>
  <p class="legal">Intensitat de les mesures d'aquest pla: ${(()=>{const c=comptaIntensitats(p);return `${c.Universal} universals, ${c.Addicional} addicionals i ${c.Intensiva} intensives`;})()}. Decret 150/2017, de 17 d'octubre, de l'atenció educativa a l'alumnat en el marc d'un sistema educatiu inclusiu.</p></section>

  ${matsCurr.map(nom=>{
    const st = p.curr[nom];
    /* Una fila per criteri d'avaluació triat: cada criteri porta els seus
       sabers i la seva etapa i curs. La competència específica ocupa amb
       rowspan totes les files dels seus criteris. Les files s'agrupen per
       font (la matèria de l'ESO i, si n'hi ha, les àrees de primària que
       s'hi han carregat), de manera que els codis 1.1 de les dues etapes no
       es barregen. */
    const grups = [];
    fontsDe(p, nom).forEach(font => {
      const byCE = {};
      (st.criteris||[]).filter(k => fontDeClau(k)===font).forEach(k=>{
        const n = k.split("|")[1].split(".")[0];
        (byCE[n] = byCE[n] || []).push(k);
      });
      Object.keys(st.adaptCE||{}).forEach(kce => {
        const c = ceDeClau(nom, kce);
        if(c.font===font && (st.adaptCE[kce]||"").trim() && !byCE[c.n]) byCE[c.n] = [];
      });
      Object.keys(byCE).sort((x,y)=>x-y).forEach(n => grups.push({font, n, claus:ordenaCriteris(byCE[n])}));
    });
    const cellaSabers = ll => ll.length
      ? `<ul style="margin:0;padding-left:16px">${ll.map(s=>`<li>${esc(s.t)}<br><span class="orig">${esc(etapaDe(s.font))} · ${esc(s.curs||"—")}${esInferior(p, s.font)?" · "+esc(areaPrim(s.font)):""}</span></li>`).join("")}</ul>`
      : "—";
    const baixos = sabersInferiors(p, nom);
    const critBaixos = criterisInferiors(p, nom);
    return `<section><h2>5. Proposta educativa · ${esc(nom)}</h2>
    <table><thead><tr><th style="width:24%">Competències específiques</th><th style="width:32%">Criteris d'avaluació</th><th>Sabers</th><th style="width:14%">Etapa i curs del criteri</th></tr></thead>
    <tbody>${grups.map(fila=>{
      const u = unitat(fila.font), prim = esInferior(p, fila.font);
      const kce = claCE(nom, fila.font, fila.n);
      const ce = u ? u.ce.find(c=>c.n===+fila.n) : null;
      const adCE = (st.adaptCE||{})[kce];
      const cela = `<td rowspan="${Math.max(1, fila.claus.length)}">${prim?`<b>Primària · ${esc(areaPrim(fila.font))}</b><br>`:""}${esc(adCE ? ("CE"+fila.n+" · "+adCE) : (ce?("CE"+fila.n+" · "+ce.desc):("CE"+fila.n)))}${adCE&&ce?`<br><span class="orig">Text de referència del decret: ${esc(ce.desc)}</span>`:""}</td>`;
      if(!fila.claus.length)
        return `<tr>${cela}<td>—</td><td>—</td><td>${esc(prim ? "Primària · "+areaPrim(fila.font) : etapaDe(fila.font))}</td></tr>`;
      return fila.claus.map((k, i)=>{
        const ad = (st.adapt||{})[k], ac = (st.accions||{})[k];
        return `<tr>${i===0?cela:""}<td>${k.split("|")[1]} ${esc(ad ? ad : critText(k))}`
          + (ac && ac!=="Mantenir sense canvis" ? ` <i>(${esc(ac)})</i>` : "")
          + (ad ? `<br><span class="orig">Text de referència del decret: ${esc(critText(k))}</span>` : "")
          + `</td><td>${cellaSabers((st.sabersCrit||{})[k] || [])}</td>`
          + `<td>${esc(etapaDe(fila.font)+" · "+cursCriteri(st, k))}</td></tr>`;
      }).join("");
    }).join("")}</tbody></table>
    ${(st.sabersSense||[]).length?`<p class="legal">Sabers prioritzats sense criteri d'avaluació assignat: ${esc(st.sabersSense.map(s=>s.t).join(" · "))}.</p>`:""}
    ${st.propis?`<h3>Criteris personalitzats i sabers afegits</h3><p>${esc(st.propis)}</p>`:""}
    ${(baixos.length || critBaixos.length)?`<p class="legal">${esc(nom)} incorpora ${[
        critBaixos.length ? `${critBaixos.length} criteri${critBaixos.length===1?"":"s"} d'avaluació` : "",
        baixos.length ? `${baixos.length} saber${baixos.length===1?"":"s"}` : ""].filter(Boolean).join(" i ")} d'un nivell anterior al que cursa l'alumne/a (${esc(p.de.curs||"—")}), motiu pel qual el pla consta com a <b>curricular</b>. L'alumne/a s'avalua d'acord amb els criteris i els sabers que consten en aquest pla, cosa que en cap cas pot suposar una limitació en les seves qualificacions.</p>`:""}
    ${(st.prim||[]).length?`<p class="legal">Aquesta matèria incorpora elements curriculars d'educació primària (annex 2 del Decret 175/2022): ${esc(st.prim.join(", "))}. L'alumne/a s'avalua d'acord amb els criteris que consten en aquest pla, cosa que en cap cas pot suposar una limitació en les seves qualificacions.</p>`:""}</section>`;
  }).join("")}

  ${p.transv.length?`<section><h2>5. Proposta educativa · Competències transversals</h2>
  <table><thead><tr><th style="width:30%">Competència transversal</th><th>Competències específiques</th><th>Criteris d'avaluació</th><th style="width:18%">Etapa i curs</th></tr></thead>
  <tbody>${p.transv.map(t=>{
    const c = COMP_TRANSVERSALS.find(x=>x.id===t.id);
    return `<tr><td class="k">${esc(c.nom)}</td><td>${esc(t.ce)||"—"}</td><td>${esc(t.criteris)||"—"}</td><td>${esc(t.etapa)||"—"}</td></tr>`;
  }).join("")}</tbody></table></section>`:""}

  ${ambObjectius?`<section><h2>5. Proposta educativa · Objectius i avaluació</h2>
  <table><thead><tr><th style="width:${ambAval?18:22}%">Matèria</th><th>Objectiu</th><th style="width:${ambAval?20:24}%">Instrument i evidència</th>${ambAval?`<th style="width:17%">Avaluació</th>`:""}</tr></thead>
  <tbody>${p.objectius.map(o=>`<tr><td class="k">${esc(o.materia)}</td><td>${esc(fraseText(o, a.alias))}</td><td>${cellaAvaluacioDoc(o)}</td>${ambAval?`<td>${cellaAssolimentDoc(p, o)}</td>`:""}</tr>`).join("")}</tbody></table></section>`:""}

  ${Object.keys(p.horari).some(k=>{const v=p.horari[k];return v&&(v.m||v.d||v.e)}) ? `<section><h2>5. Proposta educativa · Horari</h2>
  <table><thead><tr><th>Horari</th>${DIES.map(d=>`<th>${d}</th>`).join("")}</tr></thead>
  <tbody>${p.franges.map((fr,fi)=>`<tr><td class="k">${esc(fr==="ESBARJO"?"Esbarjo":fr)}</td>
    ${DIES.map((d,di)=>{const v=p.horari[fi+"-"+di]||{};
      return `<td style="font-size:11.5px">${esc(v.m||"")}${v.d?`<br><i>${esc(v.d)}</i>`:""}${v.e?`<br>${esc(v.e)}`:""}</td>`;}).join("")}</tr>`).join("")}</tbody></table></section>`:""}

  <section><h2>6. Conformitat del pla de suport individualitzat</h2>
  <p>El pare, la mare o el tutor o tutora legal són informats d'aquest pla de suport individualitzat i n'acorden el seguiment amb el tutor/a de l'alumne/a.
  ${p.conformitat.familia?"<b>Consta la conformitat de la família.</b>":"<b>Pendent de conformitat.</b>"}</p>
  ${(p.conformitat.acordsFamilia||"").trim()?`<h3>Acords amb la família</h3><p>${esc(p.conformitat.acordsFamilia)}</p>`:""}
  <div class="sig">
    <div>Signatura del pare, mare o tutor/a legal</div>
    <div>Signatura del tutor/a de l'alumne/a<br>${esc(p.conformitat.tutorSig)}</div>
  </div>
  <div class="sig">
    <div>Vistiplau i aprovació del director/a<br>${esc(p.conformitat.director)}</div>
    <div style="border:0"></div>
  </div>
  <div class="cloenda">
    <div class="lloc"><b>Lloc i data:</b> ${esc(p.conformitat.lloc)||"—"}${p.conformitat.data?", "+dataCat(p.conformitat.data):""}</div>
    <div class="segell">Segell del centre</div>
  </div>
  </section>

  ${taulaDocReunions("7. Reunions de seguiment i acords amb l'alumne/a, el pare, la mare o el tutor o tutora legal", p.reunionsFamilia)}
  ${taulaDocReunions("8. Reunions de seguiment i avaluació del PI amb els professionals implicats", p.reunionsProf)}

  <section><h2>9. Acords sobre la continuïtat del pla de suport individualitzat</h2>
  <table><thead><tr><th style="width:14%">Data</th><th style="width:28%">Agents participants</th><th style="width:18%">Acord</th><th>Observacions</th></tr></thead>
  <tbody>${p.continuitat.map(r=>`<tr><td>${dataCat(r.data)}</td><td>${esc(r.agents)}</td><td>${esc(r.acord)}</td><td>${esc(r.obs)}</td></tr>`).join("")
   || `<tr><td colspan="4">—</td></tr>`}</tbody></table></section>

  ${p.seguiments.length?`<section><h2>Annex · ${ambObjectius ? "Registre de seguiment del pla" : "Valoració del grau d'assoliment dels objectius"}</h2>
  ${p.seguiments.map(s=>`<h3>${esc(s.trimestre)} — ${dataCat(s.data)} · ${esc(s.decisio)}</h3>
    ${ambObjectius ? "" : `<ul>${Object.entries(s.valoracions||{}).map(([k,v])=>{const o=p.objectius.find(x=>x.id===k);return o?`<li>${esc(o.materia)}: <b>${esc(v)}</b> — ${esc(fraseText(o, a.alias))}</li>`:"";}).join("")}</ul>`}
    ${s.observacions?`<p>${esc(s.observacions)}</p>`:(ambObjectius?`<p class="orig">Sense observacions.</p>`:"")}`).join("")}</section>`:""}

  <div class="foot">Pla de suport individualitzat · Curs ${esc(p.curs)} · ${esc(state.centre||"[Centre educatiu]")} · Document generat el ${dataCat(avui())}<br>
  Elements curriculars extrets del Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació bàsica.</div>`;
}
function taulaDocReunions(titol, arr){
  return `<section><h2>${titol}</h2>
  <table><thead><tr><th style="width:14%">Data</th><th style="width:24%">Agents participants</th><th>Temes tractats</th><th style="width:28%">Acords</th></tr></thead>
  <tbody>${arr.map(r=>`<tr><td>${dataCat(r.data)}</td><td>${esc(r.agents)}</td><td>${esc(r.temes)}</td><td>${esc(r.acords)}</td></tr>`).join("")
   || `<tr><td colspan="4">—</td></tr>`}</tbody></table></section>`;
}

