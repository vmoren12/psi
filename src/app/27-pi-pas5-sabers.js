/* ----- Curs d'un criteri d'avaluació -----
   El decret agrupa els criteris en blocs de cursos ("1r i 2n" a primària,
   "1r, 2n i 3r" a l'ESO). El pla ha de dir de quin curs es pren cada criteri:
   és el que surt a la columna «Etapa i curs del criteri» del document.

   Mentre el docent no en concreti cap, val l'etiqueta del bloc sencer, que no
   és cap ajust de nivell. Quan en concreta un d'anterior al que cursa
   l'alumne/a, el pla passa a ser curricular.

   Els sabers que pengen del criteri en segueixen el curs, que és el cas
   normal, tret dels que el docent hagi canviat expressament (marcats amb
   s.manual): aquells conserven sempre el curs que els hagi posat. */
function canviaCursCrit(nom, key, v){
  up(x => {
    const st = currDe(x, nom);
    if(v === String(key).split("|")[2]) delete st.cursCrit[key];
    else st.cursCrit[key] = v;
    sabersDe(st, key).forEach(s => {
      if(s.manual) return;
      const opc = cursosOpcions(s.font, s.grup);
      s.curs = opc.includes(v) ? v : (opc[opc.length-1] || s.curs);
    });
  });
  revisaTipusPI();
  renderPi();
  pintaSabers();
}

/* ----- Sabers d'un criteri d'avaluació -----
   Cada criteri triat porta els seus sabers, i cada saber, el curs que se li
   assigna. La finestra recorda de quin criteri s'ha obert (state.sb) per
   poder-se repintar sense perdre el context, i mostra a dalt la competència
   específica i el criteri d'on es parteix. */
function obreSabers(nom, key){
  state.sb = {nom:nom, key:key};
  const codi = String(key).split("|")[1];
  openModal(`Sabers del criteri ${codi} · ${nom}`, `<div class="bm">
    <div class="bm-bar" id="sab-cap"></div>
    <div class="bm-body" id="sab-body"></div></div>`, true);
  pintaSabers();
}
function pintaSabers(){
  const cap = $("#sab-cap"), cos = $("#sab-body");
  if(!cap || !cos || !state.sb) return;
  cap.innerHTML = sabersCapHTML();
  cos.innerHTML = sabersCosHTML();
}
/* Els altres criteris triats de la mateixa competència específica: són els
   que poden rebre d'una sola clicada els sabers d'aquest criteri. */
function germansCE(p, nom, key){
  const st = currDe(p, nom);
  const t = String(key).split("|"), font = t[0], n = t[1].split(".")[0];
  return st.criteris.filter(k => k !== key && fontDeClau(k) === font
    && String(k).split("|")[1].split(".")[0] === n);
}
function sabersCapHTML(){
  const p = P(), nom = state.sb.nom, key = state.sb.key;
  const st = currDe(p, nom);
  const t = String(key).split("|"), font = t[0], codi = t[1];
  const curs = cursCriteri(st, key);
  const n = codi.split(".")[0];
  const u = unitat(font);
  const ce = u ? u.ce.find(x => x.n === +n) : null;
  const kce = claCE(nom, font, n);
  const adCE = (st.adaptCE||{})[kce] || "";
  const ad = (st.adapt||{})[key] || "";
  const prim = esPrim(font);
  const baix = esInferior(p, font);
  const germans = germansCE(p, nom, key);
  const sb = sabersDe(st, key);
  return `
    <div style="display:flex;gap:9px;align-items:flex-start;flex-wrap:wrap">
      <span class="cen" style="background:${baix?"var(--warn)":"var(--met)"}">CE${n}</span>
      <span style="flex:1;min-width:200px;font-size:13.5px;line-height:1.5">${esc(adCE || (ce ? ce.desc : "Competència específica "+n))}</span>
      <span class="tag ${baix?"warn":"met"}">${prim?"Primària · "+esc(areaPrim(font)):"ESO · "+esc(nom)}</span>
    </div>
    <div style="display:flex;gap:9px;align-items:flex-start;border-top:1px dotted var(--line2);padding-top:9px">
      <span style="font-family:var(--mono);font-size:11.5px;color:${baix?"var(--warn)":"var(--met)"};flex:0 0 auto;padding-top:2px">${esc(codi)}</span>
      <span style="flex:1;min-width:0;font-size:13.5px;line-height:1.5">${esc(ad || critText(key))}
        <div style="margin-top:5px"><span class="tag">${esc(etapaDe(font))} · ${esc(curs)}</span>${criteriInferior(p, st, key)?` <span class="tag warn">Curs anterior al de l'alumne/a</span>`:""}${ad?` <span class="tag con">Text adaptat</span>`:""}</div></span>
    </div>
    <div class="bm-dest">
      <span class="muted small" style="flex:1;min-width:200px">Tria els sabers que vertebren aquest criteri. Els prens amb el curs del criteri (<b>${esc(curs)}</b>) tret que n'hi canviïs un expressament. <b>${sb.length}</b> ${sb.length===1?"saber triat":"sabers triats"}.</span>
      ${germans.length ? `<button class="btn sm" onclick="copiaSabersGermans()" ${sb.length?"":"disabled"}>Fes servir aquests sabers als altres ${germans.length} criteri${germans.length===1?"":"s"} de la CE${n}</button>` : ""}
      <button class="btn sm x" title="Tanca" aria-label="Tanca" onclick="closeModal()">&times;</button>
    </div>`;
}
/* ----- Sabers que ja consten en un altre criteri d'avaluació del pla -----
   Un mateix saber es pot treballar des de criteris diferents i, per tant, es
   pot triar més d'un cop: no és cap error. Però al document surt repetit a
   cada criteri, i sovint el que es vol és penjar-lo només d'un. Per això la
   finestra de sabers els destaca i, en triar-ne un que ja hi és, ho avisa.

   Retorna {clau del saber: [{materia, codi del criteri}]}; el criteri que
   s'està editant no hi compta. */
function sabersDelPla(p, nomActual, keyActual){
  const out = {};
  Object.keys(p.curr || {}).forEach(nom => {
    const st = p.curr[nom] || {};
    Object.keys(st.sabersCrit || {}).forEach(k => {
      if(nom === nomActual && k === keyActual) return;
      (st.sabersCrit[k] || []).forEach(sb => {
        const cl = claSaber(sb);
        (out[cl] = out[cl] || []).push({materia: nom, codi: String(k).split("|")[1]});
      });
    });
  });
  return out;
}
/* «Matemàtiques (2.1, 2.3) · Llengua Catalana i Literatura (1.2)» */
function etiquetaDup(l){
  const per = {};
  (l||[]).forEach(x => (per[x.materia] = per[x.materia] || []).push(x.codi));
  return Object.keys(per).map(m =>
    `${m} (${[...new Set(per[m])].sort().join(", ")})`).join(" · ");
}

function sabersCosHTML(){
  const p = P(), nom = state.sb.nom, key = state.sb.key;
  const st = currDe(p, nom);
  const sb = sabersDe(st, key);
  const tria = {}; sb.forEach(s => tria[claSaber(s)] = s);
  const dups = sabersDelPla(p, nom, key);
  let nDup = 0;
  const cos = fontsDe(p, nom).map(font => {
    const u = unitat(font);
    if(!u || !(u.sabers||[]).length) return "";
    const prim = esPrim(font);
    const baix = esInferior(p, font);
    return `<div class="grp-title"><span class="eyebrow">${esc(prim ? "Primària · "+areaPrim(font) : font)}</span>
      <span class="muted small">${u.sabers.length} bloc${u.sabers.length===1?"":"s"} de sabers · ${prim?"annex 2":"annex 3"}</span></div>
    ${u.sabers.map((g, gi) => {
      const k = "SB#"+font+"##"+gi, ob = !!state.openSab[k];
      const opc = cursosOpcions(font, g.curs);
      const ntri = g.temes.reduce((n,te) => n + te.items.filter(i => tria[font+"§"+g.curs+"§"+i.t]).length, 0);
      const ndup = g.temes.reduce((n,te) => n + te.items.filter(i => dups[font+"§"+g.curs+"§"+i.t]).length, 0);
      nDup += ndup;
      return `<details class="ce" style="margin-top:8px" ${ob?"open":""}>
        <summary onclick="event.preventDefault();state.openSab[${jq(k)}]=!state.openSab[${jq(k)}];pintaSabers()">
          <span class="cen" style="background:${baix?"var(--warn)":"var(--ink)"};color:#fff">${esc(g.curs.length>18?g.curs.slice(0,16)+"…":g.curs)}</span>
          <span class="cetxt small">${g.temes.reduce((n,te)=>n+te.items.length,0)} sabers en ${g.temes.length} blocs${ntri?` · <span class="sel-count">${ntri} triats</span>`:""}${ndup?` · <span class="sel-count dup">${ndup} ja en un altre criteri</span>`:""}</span></summary>
        ${!ob?"":`<div class="ceb">${g.temes.map(te=>`<div class="curs-lbl">${esc(te.tema||"Sabers")}</div>
          ${te.items.map(i=>{
            const cl = font+"§"+g.curs+"§"+i.t;
            const s = tria[cl];
            const dup = dups[cl];
            return `<div class="crit ${s?"on":""} ${dup?"dup":""} ${baix?"prim":""}">
              <input type="checkbox" ${s?"checked":""} onchange="toggleSaber(${jq(font)},${gi},${jq(i.t)})" aria-label="Saber: ${esc(i.t.slice(0,60))}">
              <span class="ct">${esc(i.t)}
              ${dup?`<div class="crit-tools"><span class="tag dup" title="Aquest saber ja consta en un altre criteri d'avaluació d'aquest pla">Ja triat a ${esc(etiquetaDup(dup))}</span></div>`:""}
              ${s?`<div class="crit-tools">
                <span class="eyebrow">Curs del saber</span>
                <select class="btn sm" style="min-height:32px;width:auto" onchange="cursSaber(${jq(cl)},this.value)">
                  ${opc.map(o=>`<option ${s.curs===o?"selected":""}>${esc(o)}</option>`).join("")}</select>
                ${s.manual?`<button class="btn sm ghost" title="Torna a fer que aquest saber segueixi el curs del criteri" onclick="segueixCursCrit(${jq(cl)})">Segueix el criteri</button>`:`<span class="tag">Segueix el curs del criteri</span>`}
                ${saberInferior(p, s)?`<span class="tag warn">Curs anterior al de l'alumne/a</span>`:""}
              </div>`:""}</span></div>`;
          }).join("")}`).join("")}</div>`}</details>`;
    }).join("")}`;
  }).join("");
  const baixos = sb.filter(s => saberInferior(p, s));
  return `${cos || `<div class="empty"><b>Aquesta matèria no té sabers al decret</b>Concreta'ls al camp «Criteris personalitzats o sabers afegits» de la franja de la matèria.</div>`}
    ${nDup ? `<p class="legal sab-peu"><b>${nDup} d'aquests sabers ${nDup===1?"ja consta":"ja consten"} en un altre criteri d'avaluació d'aquest pla</b> i estan destacats a la llista. Es poden tornar a triar —un mateix saber es pot treballar des de criteris diferents—, però al document sortiran repetits a cada criteri.</p>` : ""}
    <p class="legal sab-peu">${baixos.length
      ? `<b>Avís.</b> ${baixos.length} d'aquests sabers ${baixos.length===1?"és d'un curs anterior":"són d'un curs anterior"} al que fa l'alumne/a (${esc(p.de.curs||"—")}). Per això el pla passa automàticament a ser <b>curricular</b>: l'alumne/a s'avalua d'acord amb els criteris i els sabers que consten al pla, cosa que en cap cas pot suposar una limitació en les seves qualificacions.`
      : `Si tries un saber d'un curs anterior al que fa l'alumne/a (${esc(p.de.curs||"—")}), el pla passarà automàticament a ser <b>curricular</b>.`}</p>`;
}
async function toggleSaber(font, gi, text){
  const nom = state.sb.nom, key = state.sb.key;
  const u = unitat(font); if(!u) return;
  const g = (u.sabers||[])[gi]; if(!g) return;
  const opc = cursosOpcions(font, g.curs);
  const cl = font+"§"+g.curs+"§"+text;
  /* Triar un saber que ja penja d'un altre criteri del pla es permet, però
     s'avisa: al document sortirà repetit a cada criteri. Desmarcar-lo no
     demana res. */
  const pla = P();
  const jaHi = sabersDe(currDe(pla, nom), key).some(s => claSaber(s) === cl);
  if(!jaHi){
    const dup = sabersDelPla(pla, nom, key)[cl];
    if(dup && dup.length && !await confirma("Aquest saber ja consta al pla",
          `«${esc(text)}» ja està triat a <b>${esc(etiquetaDup(dup))}</b>. El pots triar també en aquest criteri —un mateix saber es pot treballar des de criteris diferents—, però al document sortirà repetit a cada criteri.`,
          {confirma:"Tria'l igualment"})){
      pintaSabers();                 /* torna la casella al seu estat real */
      return;
    }
  }
  up(x => {
    const st = currDe(x, nom), l = st.sabersCrit[key] = st.sabersCrit[key] || [];
    const i = l.findIndex(s => claSaber(s) === cl);
    if(i>=0) l.splice(i,1);
    else l.push({t:text, font:font, grup:g.curs, curs:cursHeretat(st, key, opc)});
    if(!l.length) delete st.sabersCrit[key];
  });
  revisaTipusPI();
  renderPi();
  pintaSabers();
}
/* Curs que hereta un saber acabat de triar: el del criteri d'on penja, si el
   bloc de sabers l'abasta, i si no el més alt del bloc (per no rebaixar el
   nivell del pla sense que ningú ho hagi decidit). */
function cursHeretat(st, key, opc){
  const c = cursCriteri(st, key);
  return opc.includes(c) ? c : (opc[opc.length-1] || "");
}
/* Canviar el curs d'un saber el desvincula del criteri: a partir d'aquí manté
   el que li hagi posat el docent encara que el criteri en canviï. */
function cursSaber(cl, v){
  const nom = state.sb.nom, key = state.sb.key;
  up(x => { const s = sabersDe(currDe(x, nom), key).find(y => claSaber(y) === cl);
    if(s){ s.curs = v; s.manual = true; } });
  revisaTipusPI();
  renderPi();
  pintaSabers();
}
/* Torna a lligar un saber al curs del criteri d'on penja. */
function segueixCursCrit(cl){
  const nom = state.sb.nom, key = state.sb.key;
  up(x => {
    const st = currDe(x, nom), s = sabersDe(st, key).find(y => claSaber(y) === cl);
    if(!s) return;
    delete s.manual;
    s.curs = cursHeretat(st, key, cursosOpcions(s.font, s.grup));
  });
  revisaTipusPI();
  renderPi();
  pintaSabers();
}
/* Els mateixos sabers per a la resta de criteris triats de la competència. */
function copiaSabersGermans(){
  const p = P(), nom = state.sb.nom, key = state.sb.key;
  const g = germansCE(p, nom, key);
  if(!g.length) return;
  up(x => { const st = currDe(x, nom), src = sabersDe(st, key);
    /* Els sabers que seguien el curs del criteri d'origen passen a seguir el
       del criteri de destinació; els que el docent havia fixat a mà, no. */
    g.forEach(k => st.sabersCrit[k] = src.map(s => s.manual
      ? {t:s.t, font:s.font, grup:s.grup, curs:s.curs, manual:true}
      : {t:s.t, font:s.font, grup:s.grup, curs:cursHeretat(st, k, cursosOpcions(s.font, s.grup))})); });
  revisaTipusPI();
  renderPi();
  pintaSabers();
  toast(`Sabers copiats a ${g.length} criteri${g.length===1?"":"s"} més de la mateixa competència.`);
}
function critText(key){
  const t = String(key).split("|"), font = t[0], codi = t[1], curs = t[2];
  const u = unitat(font); if(!u) return codi;
  for(const c of u.ce) for(const g of c.grups) if(g.curs===curs)
    for(const i of g.items) if(i.c===codi) return i.t;
  return codi;
}
/* Competència específica a partir d'una clau de l'estat: a l'ESO és el número
   sol ("3") i a primària porta la font al davant ("Primària · Àrea#3"). */
function ceDeClau(nom, kce){
  const tall = String(kce).indexOf("#");
  const font = tall < 0 ? nom : String(kce).slice(0, tall);
  const n = +(tall < 0 ? kce : String(kce).slice(tall + 1));
  const u = unitat(font);
  return {font: font, n: n, ce: u ? u.ce.find(c => c.n === n) : null};
}

