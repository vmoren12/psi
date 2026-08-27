/* ----- Pas 2: justificació (secció 3) ----- */
/* ----- Perfils de necessitats específiques dins de l'editor -----
   Els perfils viuen a la fitxa de l'alumne/a, no al pla: són de la persona i
   valen per a tots els seus plans. Es poden repassar i ajustar des d'aquí
   perquè és on es justifica la necessitat del PI, i el que s'hi marqui
   alimenta igualment els suggeriments del banc de mesures i la proposta de
   mesures segons el perfil del pas 4. Editar-los aquí és editar la fitxa. */
function targetaPerfils(p, a){
  const propis = (a.perfils||[]).filter(x => !PERFILS.includes(x));
  const obert = !!state.perfAltres || propis.length > 0;
  const n = (a.perfils||[]).length;
  const ambPlantilla = (a.perfils||[]).some(x => plantillaPerfil(x));
  return `
  <div class="card" data-qc="perfils"><div class="card-h"><h2>Perfils de necessitats específiques de suport educatiu</h2>
    <span class="tag${n?"":" warn"}">${n ? n + (n===1?" perfil":" perfils") : "Cap perfil"}</span>
    <button class="btn sm ghost" onclick="editaAlumne('${a.id}')">Edita la fitxa</button></div><div class="card-b">
    <p class="small muted" style="margin:0 0 11px">Són a la fitxa de <b>${esc(a.alias)}</b> i valen per a tots els seus plans: el que hi marquis aquí queda desat a la fitxa. Alimenten els suggeriments del banc de mesures i la proposta de mesures del pas 4.</p>
    <div class="chips">${PERFILS.map(x=>`<button type="button" class="chip" aria-pressed="${(a.perfils||[]).includes(x)}" onclick="commutaPerfilPi('${a.id}',${jq(x)})">${esc(x)}</button>`).join("")}<button type="button" class="chip" aria-pressed="${obert}" onclick="commutaAltresPi('${a.id}')">Altres…</button></div>
    ${obert ? `<label class="field" style="margin:11px 0 0"><span class="lbl">Altres perfils o necessitats</span>
      <input type="text" value="${esc(propis.join("; "))}" placeholder="Descriu el perfil o la necessitat; si n'hi ha més d'un, separa'ls amb punt i coma" onchange="desaAltresPi('${a.id}',this.value)">
      <span class="small muted" style="display:block;margin-top:4px">Es desen igual que la resta i surten al document, però no alimenten els suggeriments del banc de mesures.</span></label>` : ""}
    ${ambPlantilla ? `<div style="margin-top:13px"><button class="btn sm" onclick="dialegProposta('${a.id}')">Proposta de mesures segons el perfil…</button>
      <span class="small muted" style="display:block;margin-top:5px">Carrega al pas 4 la suma de les mesures de cada perfil marcat, sense duplicats i revisable abans d'afegir-la.</span></div>` : ""}
  </div></div>`;
}
function commutaPerfilPi(id, x){
  const a = alumne(id);
  a.perfils = a.perfils || [];
  const i = a.perfils.indexOf(x);
  if(i >= 0) a.perfils.splice(i, 1); else a.perfils.push(x);
  desa();
  renderPi();
}
/* El camp «Altres» no es tanca amb text a dins: seria esborrar-lo sense
   dir-ho. Per treure'n els perfils, es buida el camp. */
function commutaAltresPi(id){
  const propis = (alumne(id).perfils||[]).filter(x => !PERFILS.includes(x));
  if(propis.length){ state.perfAltres = true; toast("Buida el camp per treure aquests perfils."); }
  else state.perfAltres = !state.perfAltres;
  renderPi();
}
function desaAltresPi(id, v){
  const a = alumne(id);
  const nous = String(v||"").split(";").map(x => x.trim())
    .filter(x => x && !PERFILS.includes(x));
  a.perfils = (a.perfils||[]).filter(x => PERFILS.includes(x)).concat(nous);
  state.perfAltres = nous.length > 0;
  desa();
  renderPi();
  toast(nous.length ? "Perfils desats a la fitxa." : "S'han tret els altres perfils.");
}

function pas2(p, a){
  return `
  ${targetaPerfils(p, a)}

  <div class="card"><div class="card-h"><span class="num">3</span><h2>Justificació</h2></div><div class="card-b">
    <div class="eyebrow" style="margin-bottom:6px" data-qc="motius">Motivat per</div>
    ${MOTIUS.map((m,i)=>{
      const on = p.just.motius.includes(m);
      let extra = "";
      if(i===5 && on) extra = `<div class="row" style="margin-top:8px">
        <input type="text" placeholder="A proposta de (EAP/tutor/docent/família…)" value="${esc(p.just.caeiProposta)}" onchange="up(p=>p.just.caeiProposta=this.value)">
        <input type="text" placeholder="Motivada per" value="${esc(p.just.caeiMotiu)}" onchange="up(p=>p.just.caeiMotiu=this.value)"></div>`;
      if(i===6 && on) extra = `<input type="text" placeholder="Especifiqueu" value="${esc(p.just.altresMotiu)}" onchange="up(p=>p.just.altresMotiu=this.value)">`;
      return `<label class="chk"><input type="checkbox" ${on?"checked":""} onchange="upR(p=>{const s=new Set(p.just.motius);this.checked?s.add(${jq(m)}):s.delete(${jq(m)});p.just.motius=[...s]})"><span class="txt">${esc(m)}${extra}</span></label>`;
    }).join("")}
    <hr class="rule">
    <label class="field" data-qc="justificacio"><span class="lbl">Breu justificació de la necessitat d'elaboració del PI</span>
      <textarea style="min-height:110px" onchange="up(p=>p.just.text=this.value)" placeholder="Nivell actual de competències, mesures aplicades en cursos anteriors i orientacions per a l'atenció educativa.">${esc(p.just.text)}</textarea></label>
    <div class="row" data-qc="fortaleses">
      <label class="field"><span class="lbl">Capacitats, potencialitats i punts forts</span><textarea onchange="up(p=>p.just.fortaleses=this.value)">${esc(p.just.fortaleses)}</textarea></label>
      <label class="field"><span class="lbl">Punts febles i barreres observades</span><textarea onchange="up(p=>p.just.dificultats=this.value)">${esc(p.just.dificultats)}</textarea></label>
    </div>
    <label class="field" style="margin-bottom:0"><span class="lbl">Interessos i motivacions de l'alumne/a</span><textarea onchange="up(p=>p.just.interessos=this.value)">${esc(p.just.interessos)}</textarea></label>
    <p class="legal" style="margin-top:14px">Si l'alumne/a disposa d'un informe de reconeixement de necessitats específiques de suport educatiu, cal tenir en compte les orientacions que hi consten.</p>
  </div></div>`;
}

/* ----- Pas 3: professionals i serveis (secció 4) ----- */
function pas3(p){
  return `
  <div class="card" data-qc="professionals"><div class="card-h"><span class="num">4</span><h2>Professionals i serveis que hi intervenen</h2></div><div class="card-b">
    ${PROFESSIONALS.map((x,i)=>{
      const v = p.prof[i] || {on:false, detall:""};
      return `<label class="chk"><input type="checkbox" ${v.on?"checked":""} onchange="upR(p=>{p.prof[${i}]=p.prof[${i}]||{detall:''};p.prof[${i}].on=this.checked})">
        <span class="txt">${esc(x)}
        ${v.on?`<input type="text" placeholder="Nom, servei o periodicitat" value="${esc(v.detall)}" onchange="up(p=>p.prof[${i}].detall=this.value)">`:""}
        </span></label>`;
    }).join("")}
  </div></div>`;
}

