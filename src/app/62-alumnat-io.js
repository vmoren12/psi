/* ---------- Alumnat ---------- */
const CAMPS_ALUMNE = ["alias","etapa","curs","grup","naixement","lloc","adreca",
                      "tutorLegal","telefon","correu",
                      "tutorLegal2","telefon2","correu2",
                      "llengua","altresLlengues","dataEap","perfils"];

function exportaAlumnes(format){
  if(!state.alumnes.length){ toast("No hi ha cap fitxa per descarregar."); return; }
  if(format === "json"){
    baixa(`pi-alumnat-${avui()}.json`, JSON.stringify({v:1, tipus:"alumnat", alumnes:state.alumnes}, null, 1));
  } else {
    const cel = v => {
      const s = String(v==null?"":v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    };
    const files = [CAMPS_ALUMNE.join(",")].concat(state.alumnes.map(a =>
      CAMPS_ALUMNE.map(c => cel(c==="perfils" ? (a.perfils||[]).join("; ") : a[c])).join(",")));
    /* BOM perquè els fulls de càlcul reconeguin l'UTF-8 i els accents. */
    baixa(`pi-alumnat-${avui()}.csv`, "﻿" + files.join("\r\n"), "text/csv;charset=utf-8");
  }
  toast("Alumnat descarregat.");
}

function dialegImportaAlumnes(){
  openModal("Carrega alumnat", `<div style="padding:20px 22px 26px">
    <p class="small" style="margin-top:0">Accepta un fitxer <b>JSON</b> descarregat des d'aquí o un <b>CSV</b> amb la capçalera de columnes indicada a la secció «Alumnat».</p>
    <input type="file" accept=".json,.csv,application/json,text/csv" id="ial-file" style="margin-bottom:14px">
    <div class="field"><span class="lbl">Fitxes que ja existeixen (mateix nom o àlies i mateix grup)</span>
      <select id="ial-mode">
        <option value="omet">Omet-les i afegeix només les noves</option>
        <option value="actualitza">Actualitza-les amb les dades del fitxer</option>
        <option value="duplica">Afegeix-les igualment com a fitxes noves</option>
      </select></div>
    <p class="legal">Els plans existents no es toquen mai. Els perfils que no coincideixin amb els de l'aplicació es desen com a perfils «Altres» i es notifiquen.</p>
    <div style="display:flex;gap:9px;margin-top:16px"><button class="btn primary" onclick="importaAlumnes()">Carrega</button>
    <button class="btn ghost" onclick="closeModal()">Cancel·la</button></div></div>`);
}

/* Lector de CSV que respecta les cometes i els salts de línia dins d'un camp. */
function llegeixCSV(text){
  const files = [];
  let fila = [], camp = "", dins = false;
  text = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for(let i=0; i<text.length; i++){
    const c = text[i];
    if(dins){
      if(c === '"'){ if(text[i+1] === '"'){ camp += '"'; i++; } else dins = false; }
      else camp += c;
    } else if(c === '"'){ dins = true; }
    else if(c === "," || c === ";"){ fila.push(camp); camp = ""; }
    else if(c === "\n"){ fila.push(camp); files.push(fila); fila = []; camp = ""; }
    else camp += c;
  }
  if(camp !== "" || fila.length){ fila.push(camp); files.push(fila); }
  return files.filter(f => f.some(x => String(x).trim() !== ""));
}

function importaAlumnes(){
  const f = $("#ial-file").files[0];
  if(!f){ toast("Tria un fitxer."); return; }
  const mode = $("#ial-mode").value;
  const r = new FileReader();
  r.onload = () => {
    let entrades = [];
    const brut = String(r.result);
    try{
      if(/\.csv$/i.test(f.name) || (brut.trim()[0] !== "{" && brut.trim()[0] !== "[")){
        const files = llegeixCSV(brut);
        if(files.length < 2){ toast("El CSV no té cap fila de dades."); return; }
        const caps = files[0].map(x => x.trim());
        if(!caps.includes("alias")){ toast("Al CSV hi falta la columna «alias»."); return; }
        entrades = files.slice(1).map(fila => {
          const o = {};
          caps.forEach((c, i) => o[c] = (fila[i] || "").trim());
          o.perfils = (o.perfils || "").split(/[;|]/).map(s => s.trim()).filter(Boolean);
          return o;
        });
      } else {
        const d = JSON.parse(brut);
        entrades = Array.isArray(d) ? d : (d.alumnes || []);
      }
    }catch(e){ toast("No s'ha pogut llegir el fitxer."); return; }

    entrades = entrades.filter(x => x && String(x.alias||"").trim());
    if(!entrades.length){ toast("No s'hi ha trobat cap fitxa amb nom o àlies."); return; }

    let nous = 0, actualitzats = 0, omesos = 0;
    const perfilsIgnorats = new Set();
    entrades.forEach(e => {
      /* Els perfils que no són a la llista tancada s'accepten com a perfils
         «Altres»: es conserven al pla i al document, però no alimenten els
         suggeriments del banc de mesures i per això es notifiquen. */
      const perfils = (Array.isArray(e.perfils) ? e.perfils : [])
        .map(x => String(x||"").trim()).filter(Boolean);
      perfils.forEach(x => { if(!PERFILS.includes(x)) perfilsIgnorats.add(x); });
      /* El curs pot arribar de qualsevol de les dues etapes. Si el fitxer duu
         etapa, mana; si no, es dedueix del text del curs. */
      const etapa = ETAPES.includes(String(e.etapa||"").trim()) ? String(e.etapa).trim()
                  : (/prim/i.test(String(e.curs||"")) ? "Primària" : "ESO");
      const llista = cursosEtapa(etapa);
      const curs = llista.includes(e.curs) ? e.curs
                 : (llista.find(c => c.startsWith(cursSol(e.curs))) || llista[0]);
      const dades = {
        alias:String(e.alias).trim(), etapa, curs, grup:String(e.grup||"").trim(),
        naixement:e.naixement||"", lloc:e.lloc||"", adreca:e.adreca||"",
        tutorLegal:e.tutorLegal||"", telefon:e.telefon||"", correu:e.correu||"",
        tutorLegal2:e.tutorLegal2||"", telefon2:e.telefon2||"", correu2:e.correu2||"",
        llengua:e.llengua||"", altresLlengues:e.altresLlengues||"",
        dataEap:e.dataEap||"", eap:!!e.dataEap, perfils
      };
      const ex = state.alumnes.find(a =>
        a.alias.trim().toLowerCase() === dades.alias.toLowerCase() &&
        (a.grup||"").trim().toLowerCase() === dades.grup.toLowerCase());
      if(ex && mode === "omet"){ omesos++; return; }
      if(ex && mode === "actualitza"){ Object.assign(ex, dades); actualitzats++; return; }
      state.alumnes.push(Object.assign({id:uid("AL")}, dades));
      nous++;
    });

    desa(); closeModal(); go("alumnes");
    const parts = [];
    if(nous) parts.push(`${nous} fitxa${nous===1?"":"es"} nova${nous===1?"":"es"}`);
    if(actualitzats) parts.push(`${actualitzats} actualitzada${actualitzats===1?"":"es"}`);
    if(omesos) parts.push(`${omesos} omesa${omesos===1?"":"es"}`);
    toast(parts.join(", ") + ".");
    if(perfilsIgnorats.size)
      setTimeout(() => toast("Perfils desats com a «Altres» (no són a la llista de l'aplicació): " + [...perfilsIgnorats].join(", ")), 2600);
  };
  r.readAsText(f, "utf-8");
}

async function esborraTot(){
  if(!await confirma("Esborra totes les dades",
        "S'esborraran <b>tot l'alumnat, tots els plans, les mesures i les estratègies pròpies i les modificacions del catàleg i del banc d'estratègies</b> d'aquest dispositiu.",
        {confirma:"Continua", perillos:true})) return;
  if(!await confirma("Confirmació final",
        "L'acció no es pot desfer. Has descarregat una còpia de seguretat abans de continuar?",
        {cancella:"No, atura't", confirma:"Sí, esborra-ho tot", perillos:true})) return;
  await instantania("abans d'esborrar-ho tot");
  localStorage.removeItem(KEY);
  state.centre = ""; state.logos = []; state.alumnes = []; state.pis = []; state.mesuresPropies = [];
  state.mesuresEdit = {}; state.estrategiesPropies = []; state.estrategiesEdit = {};
  state.currentPi = null;
  closeModal(); go("dashboard"); toast("Dades esborrades.");
}

async function carregaExemple(){
  if(state.pis.length && !await confirma("Carrega les dades d'exemple",
        "Les dades d'exemple substituiran el contingut actual d'aquest dispositiu.",
        {confirma:"Carrega l'exemple", perillos:true})) return;
  await instantania("abans de carregar l'exemple");
  exemple(); go("dashboard"); toast("Dades d'exemple carregades.");
}

