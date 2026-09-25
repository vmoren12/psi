/* ----- Pas 6: objectius mesurables -----
   Les mesures i els suports es concentren al pas 4; aquí només s'hi
   formulen els objectius i la manera d'avaluar-ne l'assoliment.   */
function pas6(p, a){
  const senseObj = p.materies.filter(m => !p.objectius.some(o => o.materia===m));
  /* Els objectius solen referir-se al que s'ha prioritzat al pas 5: si hi ha
     res triat, s'ofereix consultar-ho sense sortir d'aquest pas. */
  const tria = resumCurricular(p);
  const nCE = tria.filter(x => x.tipus==="ce").length;
  const nCrit = tria.reduce((n,x) => n + (x.tipus==="ce" ? x.criteris.length : 0), 0);
  const nSab = comptaSabersResum(tria);
  return `
  <div class="card" data-qc="objectius"><div class="card-h"><h2>Objectius mesurables</h2><span class="tag">${p.objectius.length}</span>
    <button class="btn sm primary" onclick="afegeixObjectiu()">Afegeix un objectiu</button></div><div class="card-b">
    ${tria.length ? `<div class="note info" style="margin:0 0 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <span style="flex:1;min-width:220px">Al <b>pas 5</b> hi has prioritzat <b>${nCE}</b> competènci${nCE===1?"a específica":"es específiques"}, <b>${nCrit}</b> criteri${nCrit===1?"":"s"} d'avaluació i <b>${nSab}</b> saber${nSab===1?"":"s"}. Els objectius d'aquest pas s'hi haurien de poder referir.</span>
      <button class="btn sm" onclick="obreResumCurricular()">Consulta el que has triat</button>
    </div>` : ""}
    <div class="note info" style="margin:0 0 14px">
      Cada objectiu s'escriu com una <b>frase observable i mesurable</b>, amb criteri d'assoliment, termini i instrument d'avaluació.
    </div>

    <label class="chk" style="border-top:1px solid var(--line);padding:11px 0;margin-bottom:12px">
      <input type="checkbox" ${p.docObjectius!==false?"checked":""} onchange="upR(p=>p.docObjectius=this.checked)">
      <span class="txt"><b>Inclou els objectius al document del PI</b>
      <div class="small muted" style="margin-top:3px;line-height:1.5">Quan està marcat, el document porta l'apartat <b>5. Proposta educativa · Objectius i avaluació</b>, amb la frase de cada objectiu, la matèria i els instruments i evidències d'avaluació. Si es desmarca, els objectius es continuen desant i es continuen valorant al seguiment, però no surten al document.${p.objectius.length ? "" : " Ara mateix el pla no en té cap: l'apartat no sortiria igualment."}</div></span></label>

    ${senseObj.length ? `<div class="note" style="margin:0 0 14px">Sense cap objectiu encara: ${esc(senseObj.join(", "))}.</div>` : ""}

    ${p.objectius.length===0 ? `<div class="empty" style="padding:26px 14px"><b>Encara no hi ha cap objectiu</b>Afegeix-ne un i completa la frase; es construeix sola a mesura que omples els camps.</div>` : ""}

    ${p.objectius.map(o=>`<div class="obj-item">
      <div class="composer">${textLliure(o)
        ? `${esc(textLliure(o))}<div class="small muted" style="margin-top:6px;font-family:var(--sans)">S'usa el <b>text lliure</b>. Esborra'l per tornar a la frase construïda amb els camps.</div>`
        : frase(o, a.alias)}</div>
      <div class="row g3">
        <label class="field" style="margin-bottom:9px"><span class="lbl">Matèria</span><select onchange="upR(p=>ob('${o.id}').materia=this.value)"><option value="">—</option>${p.materies.map(m=>`<option ${o.materia===m?"selected":""}>${esc(m)}</option>`).join("")}</select></label>
        <label class="field" style="margin-bottom:9px"><span class="lbl">Trimestre</span><select onchange="upR(p=>ob('${o.id}').trimestre=this.value)"><option value="">—</option>${TRIMESTRES.map(t=>`<option ${o.trimestre===t?"selected":""}>${t}</option>`).join("")}</select></label>
      </div>
      <div class="field" style="margin-bottom:9px"><span class="lbl">Conducta observable</span>
        <div class="llista-camp">
          <input type="text" value="${esc(o.conducta)}" onchange="upR(p=>ob('${o.id}').conducta=this.value)" placeholder="identificar la idea principal d'un text expositiu">
          <button type="button" class="btn sm ghost" title="Obre el banc de frases per àmbits i el currículum de la matèria" onclick="obreBancConductes('${o.id}')">Banc de frases…</button>
        </div>
      </div>
      <div class="row">
        <label class="field" style="margin-bottom:9px"><span class="lbl">Suport o condició</span><input type="text" value="${esc(o.suport)}" onchange="upR(p=>ob('${o.id}').suport=this.value)" placeholder="amb el text en format accessible"></label>
        <label class="field" style="margin-bottom:9px"><span class="lbl">Context</span><input type="text" value="${esc(o.context)}" onchange="upR(p=>ob('${o.id}').context=this.value)" placeholder="a l'aula ordinària"></label>
      </div>
      <div class="row g3">
        <label class="field" style="margin-bottom:9px"><span class="lbl">Valor</span><input type="text" value="${esc(o.valor)}" onchange="upR(p=>ob('${o.id}').valor=this.value)" placeholder="4"></label>
        <label class="field" style="margin-bottom:9px"><span class="lbl">Unitat</span><input type="text" value="${esc(o.unitat)}" onchange="upR(p=>ob('${o.id}').unitat=this.value)" placeholder="de cada 5 textos"></label>
      </div>
      <label class="field" style="margin-bottom:9px"><span class="lbl">Text lliure de l'objectiu (opcional)</span>
        <textarea rows="2" onchange="upR(p=>ob('${o.id}').lliure=this.value)" placeholder="Si ho escrius aquí, aquest text substitueix la frase construïda amb els camps d'aquest objectiu.">${esc(o.lliure||"")}</textarea></label>
      ${campLlistaObj(o, "instrument", "Instruments d'avaluació", "Registre de lectura setmanal")}
      ${campLlistaObj(o, "evidencia", "Evidències", "Full de lectura amb la frase resum")}
      <button class="btn sm ghost danger" onclick="upR(p=>p.objectius=p.objectius.filter(x=>x.id!=='${o.id}'))">Elimina l'objectiu</button>
    </div>`).join("")}

    ${p.objectius.length ? `<button class="btn primary" onclick="afegeixObjectiu()">Afegeix un objectiu</button>` : ""}
  </div></div>`;
}
/* ----- El que s'ha triat al pas 5, aplanat per poder-ho consultar des del 6 -----
   Cada element porta la matèria del pla, la font curricular d'on surt (matèria
   de l'ESO o àrea de primària) i el nivell (etapa i curs), que és el que
   permet filtrar-ho. */
function resumCurricular(p){
  const out = [];
  if(!p) return out;
  p.materies.forEach(nom => {
    const st = p.curr[nom];
    if(!st) return;
    fontsDe(p, nom).forEach(font => {
      const u = unitat(font);
      if(!u) return;
      const etapa = etapaDe(font);
      (u.ce||[]).forEach(c => {
        const kce = claCE(nom, font, c.n);
        const adaptada = (st.adaptCE||{})[kce] || "";
        const criteris = (st.criteris||[]).filter(k => {
          const t = String(k).split("|");
          return t[0]===font && c.grups.some(g => g.curs===t[2] && g.items.some(i => i.c===t[1]));
        }).map(k => {
          const t = String(k).split("|"), cu = cursCriteri(st, k);
          return {codi:t[1], curs:cu, nivell:etapa+" · "+cu, text:critText(k),
                  adaptat:(st.adapt||{})[k] || "", accio:(st.accions||{})[k] || "",
                  baix:criteriInferior(p, st, k),
                  sabers:((st.sabersCrit||{})[k] || [])};
        });
        if(!adaptada && !criteris.length) return;
        out.push({tipus:"ce", materia:nom, font, etapa, baix:esInferior(p, font), n:c.n, desc:c.desc, adaptada, criteris});
      });
      /* Sabers que van quedar sense criteri en convertir un pla del format
         anterior: es llisten a part perquè es puguin tornar a assignar. */
      (st.sabersSense||[]).forEach(s => {
        if(s.font !== font) return;
        out.push({tipus:"saber", materia:nom, font, etapa, baix:esInferior(p, font),
                  nivell:etapa+" · "+(s.curs||"—"),
                  tema:"Sabers sense criteri", text:s.t});
      });
    });
    if((st.propis||"").trim())
      out.push({tipus:"propi", materia:nom, font:nom, etapa:etapaDe(nom), nivell:"", text:st.propis});
  });
  return out;
}
/* Sabers triats dins d'un resum ja aplanat. */
function comptaSabersResum(els){
  return els.reduce((n,e) => n + (e.tipus==="ce"
    ? e.criteris.reduce((m,c) => m + (c.sabers||[]).length, 0)
    : (e.tipus==="saber" ? 1 : 0)), 0);
}
function obreResumCurricular(){
  state.tc = {materia:"", nivell:""};
  openModal("El que has triat al pas 5", resumModalHTML(), true);
  pintaResum();
}
function resumModalHTML(){
  const els = resumCurricular(P());
  const mats = [...new Set(els.map(e => e.materia))];
  const nivells = [...new Set(els.reduce((ac,e) =>
    ac.concat(e.tipus==="ce" ? e.criteris.map(c => c.nivell) : (e.nivell ? [e.nivell] : [])), []))].sort();
  return `<div class="bm">
   <div class="bm-bar">
     <div class="bm-filters" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
       <select onchange="state.tc.materia=this.value;pintaResum()">
         <option value="">Totes les matèries</option>
         ${mats.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("")}</select>
       <select onchange="state.tc.nivell=this.value;pintaResum()">
         <option value="">Tots els nivells</option>
         ${nivells.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join("")}</select>
     </div>
     <div class="bm-dest">
       <span class="muted small" style="flex:1;min-width:200px">Competències específiques, criteris d'avaluació i sabers prioritzats al pas 5. Serveixen de referent per redactar els objectius.</span>
       <button class="btn sm x" title="Tanca" aria-label="Tanca" onclick="closeModal()">&times;</button>
     </div>
   </div>
   <div class="bm-body" id="tc-body"></div>
  </div>`;
}
function pintaResum(){
  const cos = $("#tc-body");
  if(!cos) return;
  const f = state.tc;
  let els = resumCurricular(P());
  if(f.materia) els = els.filter(e => e.materia===f.materia);
  if(f.nivell) els = els.map(e => {
    if(e.tipus!=="ce") return e.nivell===f.nivell ? e : null;
    const c = e.criteris.filter(x => x.nivell===f.nivell);
    return c.length ? Object.assign({}, e, {criteris:c}) : null;
  }).filter(Boolean);

  const perMat = {};
  els.forEach(e => (perMat[e.materia] = perMat[e.materia] || []).push(e));
  const claus = Object.keys(perMat);
  const etiq = (e, txt) => `<span class="tag ${e.etapa==="Primària"?"warn":"met"}">${esc(txt)}</span>`;

  cos.innerHTML = claus.length===0
   ? `<div class="empty"><b>Cap element amb aquests filtres</b>${resumCurricular(P()).length ? "Prova de treure'n algun." : "Torna al pas 5 i tria criteris d'avaluació o sabers."}</div>`
   : claus.map(m => {
      const g = perMat[m];
      const ces = g.filter(e => e.tipus==="ce");
      const sabs = g.filter(e => e.tipus==="saber");
      const props = g.filter(e => e.tipus==="propi");
      const nc = ces.reduce((n,e) => n + e.criteris.length, 0);
      const ns = comptaSabersResum(g);
      return `<div class="grp-title"><span class="eyebrow">${esc(m)}</span>
        <span class="muted small">${ces.length} competènci${ces.length===1?"a":"es"} · ${nc} criteri${nc===1?"":"s"} · ${ns} saber${ns===1?"":"s"}</span></div>
      ${ces.map(e=>`<div class="tc-box">
        <div style="display:flex;gap:9px;align-items:flex-start;flex-wrap:wrap">
          <span class="tc-cen ${e.baix?"prim":""}">CE${e.n}</span>
          <span style="flex:1;min-width:180px;font-size:13.5px;line-height:1.5">${esc(e.desc)}</span>
          ${e.baix?`<span class="tag warn">${esc(e.font)}</span>`:""}
        </div>
        ${e.adaptada?`<div class="adapt-box"><span class="lbl">Redacció adaptada de la competència</span>
          <div style="font-size:13.5px;line-height:1.5">${esc(e.adaptada)}</div></div>`:""}
        ${e.criteris.map(c=>`<div class="tc-crit ${c.baix?"prim":""}">
          <span class="code">${esc(c.codi)}</span>
          <span style="flex:1">${esc(c.adaptat || c.text)}
            <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap">
              ${etiq(e, c.nivell)}
              ${c.adaptat?`<span class="tag con">Text adaptat</span>`:""}
              ${c.accio && c.accio!=="Mantenir sense canvis"?`<span class="tag con">${esc(c.accio)}</span>`:""}
            </div>
            ${(c.sabers||[]).length?`<div style="margin-top:6px">
              <span class="eyebrow">Sabers d'aquest criteri</span>
              ${c.sabers.map(s=>`<div class="tc-sab"><span style="flex:1;min-width:140px">${esc(s.t)}</span>
                <span class="tag ${saberInferior(P(), s)?"warn":"met"}">${esc(etapaDe(s.font))} · ${esc(s.curs||"—")}</span></div>`).join("")}
            </div>`:""}</span></div>`).join("")}
      </div>`).join("")}
      ${sabs.length?`<div class="tc-box"><span class="eyebrow">Sabers sense criteri assignat</span>
        ${sabs.map(x=>`<div class="tc-crit ${x.baix?"prim":""}"><span class="code">·</span>
          <span style="flex:1">${esc(x.text)}<div style="margin-top:5px">${etiq(x, x.nivell)}</div></span></div>`).join("")}</div>`:""}
      ${props.map(x=>`<div class="tc-box"><span class="eyebrow">Criteris personalitzats i sabers afegits</span>
        <div style="font-size:13.5px;line-height:1.55;white-space:pre-wrap;margin-top:5px">${esc(x.text)}</div></div>`).join("")}`;
    }).join("");
}

/* ----- Camps «Instruments d'avaluació» i «Evidències» -----
   Un objectiu pot avaluar-se amb més d'un instrument i deixar més d'una
   evidència. Cada entrada és una casella independent, amb el seu botó de
   suggeriments, i totes surten en forma de llista dins de la mateixa casella
   del document final. */
function campLlistaObj(o, camp, etiqueta, marcador){
  const l = llistaObj(o, camp);
  const un = l.length === 1;
  const afegeix = camp === "instrument" ? "+ Afegeix un instrument" : "+ Afegeix una evidència";
  return `<div class="field" style="margin-bottom:9px"><span class="lbl">${esc(etiqueta)}${un?"":` · ${l.length}`}</span>
    ${l.map((v,i)=>`<div class="llista-camp">
      <input type="text" id="lc-${o.id}-${camp}-${i}" value="${esc(v)}" placeholder="${esc(marcador)}"
        onchange="desaLlistaObj('${o.id}','${camp}',${i},this.value)">
      <button type="button" class="btn sm ghost" title="Tria'n un de la llista" onclick="obreSuggeriments('${o.id}','${camp}',${i})">Suggeriments…</button>
      ${un?"":`<button type="button" class="btn sm ghost danger treu" title="Treu aquesta entrada" aria-label="Treu aquesta entrada" onclick="treuLlistaObj('${o.id}','${camp}',${i})">×</button>`}
    </div>`).join("")}
    <button type="button" class="btn sm ghost" onclick="afegeixLlistaObj('${o.id}','${camp}')">${afegeix}</button>
  </div>`;
}
function desaLlistaObj(id, camp, i, v){ up(() => { llistaObj(ob(id), camp)[i] = v; }); }
function afegeixLlistaObj(id, camp){
  const l = llistaObj(ob(id), camp);
  /* Sense caselles buides encadenades: si l'última encara no té text, s'hi va. */
  const buida = l.length && !(l[l.length-1]||"").trim();
  if(!buida) up(() => l.push(""));
  renderPi();
  const i = l.length - 1;
  setTimeout(() => { const e = $(`#lc-${id}-${camp}-${i}`); if(e){ e.focus(); e.scrollIntoView({block:"center"}); } }, 20);
}
function treuLlistaObj(id, camp, i){
  upR(() => { const l = llistaObj(ob(id), camp); l.splice(i,1); if(!l.length) l.push(""); });
}

/* ----- Suggeriments per als camps «Instrument d'avaluació» i «Evidència» ----- */
function obreSuggeriments(objId, camp, idx){
  state.sg = {obj:objId, camp:camp, idx:idx||0, q:""};
  openModal(camp==="instrument" ? "Instruments d'avaluació" : "Evidències d'aprenentatge", suggModalHTML(), true);
  pintaSuggeriments();
  setTimeout(() => { const i = $("#sg-q"); if(i) i.focus(); }, 30);
}
function suggModalHTML(){
  const o = ob(state.sg.obj) || {};
  const actual = o.id ? (llistaObj(o, state.sg.camp)[state.sg.idx] || "") : "";
  return `<div class="bm">
   <div class="bm-bar">
     <div class="bm-filters" style="grid-template-columns:1fr">
       <input type="search" id="sg-q" placeholder="Cerca dins la llista de suggeriments…" value=""
         oninput="state.sg.q=this.value;pintaSuggeriments()">
     </div>
     <div class="bm-dest">
       <span class="muted small" style="flex:1;min-width:200px">${actual ? `Ara hi diu: <b>${esc(actual)}</b>. Si en tries un altre, el substituirà.` : `Tria'n un de la llista per a la casella ${state.sg.idx+1}, o tanca i escriu-hi el text que vulguis.`}</span>
       <span class="bm-count" id="sg-count"></span>
       <button class="btn sm x" title="Tanca" aria-label="Tanca" onclick="closeModal()">&times;</button>
     </div>
   </div>
   <div class="bm-body" id="sg-body"></div>
  </div>`;
}
function pintaSuggeriments(){
  const cos = $("#sg-body");
  if(!cos) return;
  const sg = state.sg;
  const grups = sg.camp==="instrument" ? INSTRUMENTS_SUGG : EVIDENCIES_SUGG;
  const q = (sg.q||"").trim().toLowerCase();
  const o = ob(sg.obj);
  /* Es marquen els que ja consten a l'objectiu, en qualsevol de les caselles. */
  const posats = o ? llistaPlena(o, sg.camp) : [];
  let n = 0;
  const html = grups.map(g => {
    const items = g.items.filter(x => !q || (g.g+" "+x).toLowerCase().includes(q));
    n += items.length;
    if(!items.length) return "";
    return `<div class="grp-title"><span class="eyebrow">${esc(g.g)}</span><span class="muted small">${items.length}</span></div>
      <div class="sg-list">${items.map(x=>`<button type="button" class="sg-item ${posats.includes(x)?"ja":""}" onclick="triaSuggeriment(${jq(x)})">${esc(x)}</button>`).join("")}</div>`;
  }).join("");
  const c = $("#sg-count");
  if(c) c.textContent = n + " suggeriments";
  cos.innerHTML = html || `<div class="empty"><b>Cap suggeriment</b>Prova amb altres paraules; el camp també admet text lliure.</div>`;
}
function triaSuggeriment(text){
  const sg = state.sg;
  const o = ob(sg.obj);
  if(!o){ toast("L'objectiu ja no existeix."); closeModal(); return; }
  const l = llistaObj(o, sg.camp);
  if(l.some((v,i) => i !== sg.idx && (v||"").trim() === text)){
    toast("Aquest ja consta en una altra casella d'aquest objectiu.");
    return;
  }
  up(() => { l[sg.idx] = text; });
  closeModal();
  renderPi();
  toast(`${sg.camp==="instrument" ? "Instrument" : "Evidència"}: «${text}».`);
}

function ob(id){ return P().objectius.find(o=>o.id===id); }
function afegeixObjectiu(){
  upR(p => p.objectius.push({id:uid('OB'), materia:p.materies[0]||'', conducta:'', suport:'', context:'',
                             valor:'', unitat:'', trimestre:'', lliure:'', instruments:[''], evidencies:['']}));
}

