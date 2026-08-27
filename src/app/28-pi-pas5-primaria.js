/* ----- Currículum de primària dins d'una matèria -----
   Regla del pas 5: davant de qualsevol dubte (correspondència parcial, més
   d'una àrea possible, cap àrea anàloga o solapament amb una altra matèria
   del pla) es pregunta sempre al docent. Només s'activa sense preguntar
   quan la correspondència és directa i no es repeteix enlloc més. */
/* Porta a la matèria el currículum d'una àrea de primària. Quan la
   correspondència és inequívoca i l'àrea no s'ha carregat enlloc més, no cal
   preguntar res; en qualsevol altre cas es demana sempre al docent. */
function triaPrimaria(nom){
  const p = P(), eq = equivalentsPrim(nom);
  if(eq.length===1 && eq[0].relacio==="directa" && !jaCarregada(p, nom, eq[0].area).length)
    activaPrimaria(nom, eq[0].area);
  else dialegPrimaria(nom);
}
/* Matèries del pla que ja porten aquesta àrea de primària. */
function jaCarregada(p, nom, area){
  return p.materies.filter(x => x!==nom && ((p.curr[x]||{}).prim||[]).includes(area));
}
function dialegPrimaria(nom){
  const p = P(), st = currDe(p, nom), eq = equivalentsPrim(nom);
  const fila = (area, e) => {
    const s = jaCarregada(p, nom, area);
    return `<label class="chk"><input type="checkbox" name="pa" value="${esc(area)}" ${st.prim.includes(area)?"checked":""}>
      <span class="txt"><b>${esc(area)}</b> <span class="tag ${e && e.relacio==="directa"?"met":"warn"}">${e ? (e.relacio==="directa"?"correspondència directa":"correspondència parcial") : "sense correspondència establerta"}</span>
      ${e && e.nota ? `<div class="small muted" style="margin-top:3px;line-height:1.5">${esc(e.nota)}</div>` : ""}
      ${s.length ? `<div class="small" style="margin-top:3px;color:var(--alert)">Ja s'ha carregat a ${esc(s.join(", "))}: comprova que no repeteixes els mateixos criteris en dues matèries del pla.</div>` : ""}
      </span></label>`;
  };
  const altres = AREES_PRIM.filter(a => !eq.some(e => e.area===a));
  openModal(`Currículum de primària · ${esc(nom)}`, `<div style="padding:20px 22px 26px">
    <div class="note info" style="margin-top:0">Tenir a mà una àrea de primària serveix per ajustar els criteris d'avaluació a un nivell inferior. La franja de la matèria porta una etiqueta per a cada currículum i les pots tenir totes dues obertes alhora; els criteris de les dues etapes es poden combinar dins d'aquesta matèria. Tenir-la a mà no canvia res: <b>el pla passa a ser curricular</b> quan es fa servir algun element de primària.</div>
    ${eq.length ? `<div class="eyebrow" style="margin:14px 0 4px">Àrees anàlogues a ${esc(nom)}</div>${eq.map(e=>fila(e.area,e)).join("")}`
                : `<div class="note"><b>${esc(nom)} no té cap àrea anàloga a primària.</b> Si cal, tria a mà l'àrea que sigui més pertinent per a l'alumne/a.</div>`}
    <div class="eyebrow" style="margin:16px 0 4px">Altres àrees de primària</div>
    <details class="ce"><summary><span class="cen">+</span><span class="cetxt small">Mostra les ${altres.length} àrees restants</span></summary>
      <div class="ceb">${altres.map(a=>fila(a,null)).join("")}</div></details>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap">
      <button class="btn ghost" onclick="closeModal()">Cancel·la</button>
      <button class="btn primary" onclick="desaTriaPrimaria(${jq(nom)})">Desa la tria</button>
    </div></div>`, true);
}
async function desaTriaPrimaria(nom){
  const tria = [...document.querySelectorAll("#modal input[name=pa]")].filter(x=>x.checked).map(x=>x.value);
  const p = P(), st = currDe(p, nom);
  const abans = st.prim.slice();
  const fora = abans.filter(a => !tria.includes(a));
  const perduts = fora.reduce((n,a) => n + comptaFont(p, nom, idPrim(a)), 0);
  if(perduts && !await confirma("Elements que es perdran",
        `Si treus <b>${esc(fora.join(", "))}</b> també es trauran del pla <b>${perduts}</b> element${perduts===1?"":"s"} que ja hi havies triat.`,
        {confirma:"Treu-los igualment", perillos:true})) return;
  fora.forEach(a => netejaFont(p, nom, idPrim(a)));
  up(x => currDe(x, nom).prim = tria);
  closeModal();
  revisaTipusPI();
  /* Es mostra l'àrea que s'acaba d'afegir; si només se n'han tret, la primera
     que quedi, i si no en queda cap, el currículum d'ESO. */
  tria.filter(a => !abans.includes(a)).forEach(a => mostraVista(nom, idPrim(a)));
  renderPi();
  toast(tria.length ? `Currículum de primària a ${nom}: ${tria.join(", ")}.`
                    : `S'ha tret el currículum de primària de ${nom}.`);
}
function activaPrimaria(nom, area){
  up(p => { const st = currDe(p, nom); if(!st.prim.includes(area)) st.prim.push(area); });
  mostraVista(nom, idPrim(area));
  renderPi();
  toast(`Currículum de primària de ${area}. Les etiquetes de la franja obren i tanquen cada etapa; el pla no passa a ser curricular fins que no en marquis cap element.`);
}
async function treuPrimaria(nom, area, forca){
  const p = P();
  const n = forca ? 0 : comptaFont(p, nom, idPrim(area));
  if(n && !await confirma("Elements que es perdran",
        `A <b>${esc(nom)}</b> hi ha <b>${n}</b> element${n===1?"":"s"} de ${esc(area)} (primària). Si treus l'àrea, també es trauran del pla.`,
        {confirma:"Treu l'àrea", perillos:true})) return;
  netejaFont(p, nom, idPrim(area));
  up(x => { const st = currDe(x, nom); st.prim = st.prim.filter(a => a!==area); });
  const v = state.vistaCurr[nom];
  if(Array.isArray(v)) state.vistaCurr[nom] = v.filter(f => f !== idPrim(area));
  renderPi();
  toast(`S'ha tret ${area} de ${nom}.`);
}
/* Elements d'una font concreta triats dins d'una matèria. */
function comptaFont(p, nom, font){
  const st = currDe(p, nom);
  let n = st.criteris.filter(k => fontDeClau(k)===font).length;
  n += Object.keys(st.adaptCE).filter(k => k.indexOf(font+"#")===0 && (st.adaptCE[k]||"").trim()).length;
  n += totsSabers(st).filter(s => s.font===font).length;
  n += (st.sabersSense||[]).filter(s => s.font===font).length;
  return n;
}
/* Treu del pla tot el que provingui d'una font. Els sabers d'aquesta font
   poden penjar de criteris d'una altra etapa, per això es repassen tots. */
function netejaFont(p, nom, font){
  const st = currDe(p, nom);
  st.criteris.filter(k => fontDeClau(k)===font).forEach(k => {
    st.criteris.splice(st.criteris.indexOf(k), 1);
    delete st.adapt[k]; delete st.accions[k]; delete st.sabersCrit[k]; delete st.cursCrit[k];
  });
  Object.keys(st.adaptCE).forEach(k => { if(k.indexOf(font+"#")===0) delete st.adaptCE[k]; });
  Object.keys(st.sabersCrit).forEach(k => {
    st.sabersCrit[k] = st.sabersCrit[k].filter(s => s.font !== font);
    if(!st.sabersCrit[k].length) delete st.sabersCrit[k];
  });
  st.sabersSense = (st.sabersSense||[]).filter(s => s.font !== font);
  desa();
}

