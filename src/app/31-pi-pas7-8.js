/* ----- Pas 7: horari (secció 5) ----- */
function pas7(p){
  const dest = ["", ...p.materies, ...matsEtapa(p).filter(m=>!p.materies.includes(m))];
  return `
  <div class="card"><div class="card-h"><span class="num">5</span><h2>Horari de l'alumne/a</h2></div><div class="card-b">
    <div class="note info" style="margin-bottom:12px">Indica, per a cada franja, la matèria o activitat, els docents i altres suports, i l'emplaçament. Serveix per identificar la franja dedicada a ajustar l'atenció educativa.</div>
    <div class="scroll-x"><table class="horari">
      <thead><tr><th class="franja">Horari</th>${DIES.map(d=>`<th>${d}</th>`).join("")}</tr></thead>
      <tbody>${p.franges.map((fr,fi)=>{
        if(fr==="ESBARJO") return `<tr class="esbarjo"><td class="franja">Esbarjo</td>${DIES.map((d,di)=>`<td>${hcell(p,fi,di,true)}</td>`).join("")}</tr>`;
        return `<tr><td class="franja"><input type="text" value="${esc(fr)}" onchange="up(p=>p.franges[${fi}]=this.value)"></td>
          ${DIES.map((d,di)=>`<td class="hcell">${hcell(p,fi,di,false)}</td>`).join("")}</tr>`;
      }).join("")}</tbody>
    </table></div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn sm" onclick="upR(p=>p.franges.push('—'))">Afegeix franja</button>
      <button class="btn sm" onclick="upR(p=>p.franges.push('ESBARJO'))">Afegeix esbarjo</button>
      <button class="btn sm ghost" onclick="upR(p=>p.franges.pop())">Treu l'última</button>
    </div>
  </div></div>`;
}
function hcell(p, fi, di, esbarjo){
  const k = fi+"-"+di;
  const v = p.horari[k] || {m:"", d:"", e:""};
  if(esbarjo) return `<input type="text" style="min-height:32px;padding:5px 7px;font-size:12.5px" placeholder="Suports" value="${esc(v.d)}" onchange="up(p=>{p.horari['${k}']=p.horari['${k}']||{m:'',d:'',e:''};p.horari['${k}'].d=this.value})">`;
  return `<input type="text" placeholder="Matèria / activitat" value="${esc(v.m)}" onchange="up(p=>{p.horari['${k}']=p.horari['${k}']||{m:'',d:'',e:''};p.horari['${k}'].m=this.value})">
    <input type="text" placeholder="Docent/s i suports" value="${esc(v.d)}" onchange="up(p=>{p.horari['${k}']=p.horari['${k}']||{m:'',d:'',e:''};p.horari['${k}'].d=this.value})">
    <input type="text" placeholder="Emplaçament" value="${esc(v.e)}" onchange="up(p=>{p.horari['${k}']=p.horari['${k}']||{m:'',d:'',e:''};p.horari['${k}'].e=this.value})">`;
}

/* ----- Pas 8: conformitat, reunions i continuïtat (seccions 6-9) ----- */
function pas8(p){
  return `
  <div class="card" data-qc="conformitat"><div class="card-h"><span class="num">6</span><h2>Conformitat del pla</h2></div><div class="card-b">
    <p class="small muted" style="margin-top:0">El pare, la mare o el tutor/a legal són informats d'aquest pla i n'acorden el seguiment amb el tutor/a de l'alumne/a.</p>
    <label class="chk"><input type="checkbox" ${p.conformitat.familia?"checked":""} onchange="up(p=>p.conformitat.familia=this.checked)"><span class="txt">La família ha estat informada i hi dona conformitat</span></label>
    <label class="field" style="margin-top:12px"><span class="lbl">Acords amb la família</span>
      <textarea onchange="up(p=>p.conformitat.acordsFamilia=this.value)" placeholder="Compromisos que s'acorden amb la família: seguiment de l'agenda, hàbits i horaris a casa, comunicació amb el centre, autoritzacions, derivacions externes…">${esc(p.conformitat.acordsFamilia)}</textarea>
      <span class="small muted" style="display:block;margin-top:4px">Camp obert. Surt a l'apartat 6 del document, sota la conformitat. Els acords que es prenguin en una reunió concreta van a l'apartat 7.</span>
    </label>
    <div class="row" style="margin-top:12px">
      <label class="field"><span class="lbl">Lloc</span><input type="text" value="${esc(p.conformitat.lloc)}" onchange="up(p=>p.conformitat.lloc=this.value)"></label>
      <label class="field"><span class="lbl">Data</span><input type="date" value="${esc(p.conformitat.data)}" onchange="up(p=>p.conformitat.data=this.value)"></label>
    </div>
    <div class="row">
      <label class="field"><span class="lbl">Tutor/a de l'alumne/a</span><input type="text" value="${esc(p.conformitat.tutorSig)}" onchange="up(p=>p.conformitat.tutorSig=this.value)"></label>
      <label class="field" style="margin-bottom:0"><span class="lbl">Vistiplau i aprovació del director/a</span><input type="text" value="${esc(p.conformitat.director)}" onchange="up(p=>p.conformitat.director=this.value)"></label>
    </div>
    <div class="row" style="margin-top:14px">
      <label class="field"><span class="lbl">Data d'inici del pla</span><input type="date" value="${esc(p.dataInici)}" onchange="up(p=>p.dataInici=this.value)"></label>
      <label class="field" style="margin-bottom:0" data-qc="revisio"><span class="lbl">Propera revisió</span><input type="date" value="${esc(p.proximaRevisio)}" onchange="upR(p=>p.proximaRevisio=this.value)"></label>
    </div>
  </div></div>

  ${taulaReunions(p, "reunionsFamilia", "7", "Reunions i acords amb l'alumne/a, el pare, la mare o el tutor/a legal")}
  ${taulaReunions(p, "reunionsProf", "8", "Reunions de seguiment i avaluació amb els professionals implicats")}

  <div class="card"><div class="card-h"><span class="num">9</span><h2>Acords sobre la continuïtat del pla</h2></div><div class="card-b">
    ${p.continuitat.map(r=>`<div class="obj-item">
      <div class="row g3">
        <label class="field" style="margin-bottom:9px"><span class="lbl">Data</span><input type="date" value="${esc(r.data)}" onchange="up(p=>ct('${r.id}').data=this.value)"></label>
        <label class="field" style="margin-bottom:9px"><span class="lbl">Acord</span><select onchange="up(p=>ct('${r.id}').acord=this.value)">${["Continuïtat","Revisió","Finalització"].map(x=>`<option ${r.acord===x?"selected":""}>${x}</option>`).join("")}</select></label>
      </div>
      <label class="field" style="margin-bottom:9px"><span class="lbl">Agents participants</span><input type="text" value="${esc(r.agents)}" onchange="up(p=>ct('${r.id}').agents=this.value)"></label>
      <label class="field" style="margin-bottom:9px"><span class="lbl">Observacions</span><textarea onchange="up(p=>ct('${r.id}').obs=this.value)">${esc(r.obs)}</textarea></label>
      <button class="btn sm ghost danger" onclick="upR(p=>p.continuitat=p.continuitat.filter(x=>x.id!=='${r.id}'))">Elimina</button>
    </div>`).join("")}
    <button class="btn" onclick="upR(p=>p.continuitat.push({id:uid('CT'),data:avui(),agents:'',acord:'Continuïtat',obs:''}))">Afegeix un acord</button>
  </div></div>`;
}
function ct(id){ return P().continuitat.find(x=>x.id===id); }
function taulaReunions(p, camp, num, titol){
  return `<div class="card"><div class="card-h"><span class="num">${num}</span><h2>${titol}</h2></div><div class="card-b">
    ${p[camp].map(r=>`<div class="obj-item">
      <div class="row">
        <label class="field" style="margin-bottom:9px"><span class="lbl">Data</span><input type="date" value="${esc(r.data)}" onchange="up(p=>p.${camp}.find(x=>x.id==='${r.id}').data=this.value)"></label>
        <label class="field" style="margin-bottom:9px"><span class="lbl">Agents participants</span><input type="text" value="${esc(r.agents)}" onchange="up(p=>p.${camp}.find(x=>x.id==='${r.id}').agents=this.value)"></label>
      </div>
      <label class="field" style="margin-bottom:9px"><span class="lbl">Temes tractats</span><textarea onchange="up(p=>p.${camp}.find(x=>x.id==='${r.id}').temes=this.value)">${esc(r.temes)}</textarea></label>
      <label class="field" style="margin-bottom:9px"><span class="lbl">Acords</span><textarea onchange="up(p=>p.${camp}.find(x=>x.id==='${r.id}').acords=this.value)">${esc(r.acords)}</textarea></label>
      <button class="btn sm ghost danger" onclick="upR(p=>p.${camp}=p.${camp}.filter(x=>x.id!=='${r.id}'))">Elimina</button>
    </div>`).join("") || `<p class="muted small" style="margin-top:0">Encara no hi ha cap reunió registrada.</p>`}
    <button class="btn" onclick="upR(p=>p.${camp}.push({id:uid('R'),data:avui(),agents:'',temes:'',acords:''}))">Afegeix una reunió</button>
  </div></div>`;
}

