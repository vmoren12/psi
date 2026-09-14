/* ---------- 12. Còpia de seguretat ---------- */
/* ---------- 8b. Dades i còpies de seguretat ---------- */

function formataMida(b){
  return b < 1024 ? b + " B" : b < 1048576 ? (b/1024).toFixed(1) + " kB" : (b/1048576).toFixed(2) + " MB";
}
function midaEmmagatzematge(){
  try{ return formataMida(new Blob([localStorage.getItem(KEY) || ""]).size); }
  catch(e){ return "—"; }
}
function baixa(nom, contingut, tipus){
  const blob = new Blob([contingut], {type: tipus || "application/json;charset=utf-8"});
  const u = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = u; a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

/* ---------- Còpia automàtica i historial intern ----------
   Dues xarxes de seguretat independents, i totes dues silencioses:

     · La còpia automàtica descarrega cada X minuts el mateix fitxer que el
       botó «Descarrega la còpia completa», i només si hi ha hagut canvis. Va
       a la carpeta de baixades del navegador —una pàgina web no pot escriure
       en cap altre lloc del disc—, i per això la pantalla explica com triar-la.

     · L'historial intern desa les últimes instantànies dins del navegador
       mateix i deixa tornar enrere sense haver de buscar cap fitxer. No
       protegeix de perdre el perfil del navegador; protegeix de l'accident
       més freqüent, que és esborrar o substituir dades sense voler.

   Cap de les dues compara continguts per saber si hi ha novetats: totes dues
   miren el comptador de revisió que fa avançar desa(). */

function segellHora(t){
  const d = t ? new Date(t) : new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
function horaCat(t){
  const d = new Date(t), p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} a les ${p(d.getHours())}:${p(d.getMinutes())}`;
}
/* Sense contingut no hi ha res a protegir: ni es baixen fitxers ni es desen
   instantànies buides. */
function dadesBuides(){
  return !state.alumnes.length && !state.pis.length && !(state.mesuresPropies||[]).length
      && !(state.estrategiesPropies||[]).length && !comptaEstrategiesEditades();
}

/* ----- Còpia automàtica a la carpeta de baixades -----
   La configuració és d'aquest dispositiu, com la resta de preferències del
   navegador: no va dins de la còpia de seguretat. */
const KEY_COPIA = "pi-eso-copia";
const MINUTS_COPIA = [5, 10, 15, 30, 60];
const copia = {auto:false, minuts:10, ultima:0, rev:0};

function carregaCopia(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY_COPIA) || "{}");
    copia.auto = !!d.auto;
    copia.minuts = MINUTS_COPIA.includes(+d.minuts) ? +d.minuts : 10;
    copia.ultima = +d.ultima || 0;
  }catch(e){}
}
function desaConfigCopia(){
  try{ localStorage.setItem(KEY_COPIA, JSON.stringify({auto:copia.auto, minuts:copia.minuts, ultima:copia.ultima})); }catch(e){}
}
function activaCopiaAuto(on){
  copia.auto = !!on;
  desaConfigCopia();
  /* La primera còpia es fa a l'instant, no d'aquí a deu minuts: així es veu de
     seguida que funciona i el navegador demana el permís de baixades múltiples
     mentre qui l'activa hi és al davant. */
  if(copia.auto && !dadesBuides()) faCopiaAuto();
  else refrescaDades();
}
function minutsCopiaAuto(v){
  copia.minuts = MINUTS_COPIA.includes(+v) ? +v : 10;
  desaConfigCopia();
  refrescaDades();
}
function faCopiaAuto(){
  baixa(`pi-copia-auto-${segellHora()}.json`, JSON.stringify(dadesCopia(), null, 1));
  copia.ultima = Date.now();
  copia.rev = revisio;
  desaConfigCopia();
  if(!document.hidden) toast("Còpia automàtica desada a la carpeta de baixades.");
  refrescaDades();
}

/* ----- Historial intern d'instantànies -----
   Es desa a IndexedDB, l'únic magatzem del navegador on caben unes quantes
   còpies senceres sense competir amb les dades de treball. Quan el navegador
   no en dona —el Chrome el bloqueja si l'aplicació s'obre amb doble clic
   sobre el fitxer, amb una adreça file://—, l'historial es manté a la memòria
   de la pestanya: continua servint per desfer un error, però es perd en
   tancar-la, i la pantalla ho adverteix. */
const HIST_DB = "pi-eso-historial", HIST_STORE = "instantanies";
const HIST_MAX = 10;          /* instantànies que es conserven */
const HIST_CADA = 5 * 60000;  /* separació mínima entre instantànies automàtiques */
let histDB = null;            /* connexió a IndexedDB, si n'hi ha */
let histMem = [];             /* reserva en memòria quan no n'hi ha */
let histPersistent = false;
let histIndex = [];           /* fitxa de cada instantània sense el contingut: la llista es pinta d'aquí */
let histRev = 0, histUltima = 0;
/* Clau de cada instantania: l'instant en que es fa. Dues instantanies seguides
   podrien caure dins del mateix mil·lisegon —abans d'esborrar-ho tot, per
   exemple, se'n demana una tot just després d'una altra— i llavors la segona
   n'esborraria la primera sense dir-ho. El rellotge propi ho evita: mai no
   torna enrere ni repeteix. */
let histSeg = 0;
function histClau(){
  const ara = Date.now();
  histSeg = ara > histSeg ? ara : histSeg + 1;
  return histSeg;
}

function histObre(){
  return new Promise(res => {
    let req;
    try{ req = indexedDB.open(HIST_DB, 1); }catch(e){ res(null); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(HIST_STORE)) db.createObjectStore(HIST_STORE, {keyPath:"ts"});
    };
    req.onsuccess = () => res(req.result);
    req.onerror = req.onblocked = () => res(null);
  });
}
function histTx(mode){
  try{ return histDB.transaction(HIST_STORE, mode); }catch(e){ return null; }
}
function histGuarda(reg){
  if(!histDB){ histMem.unshift(reg); return Promise.resolve(true); }
  return new Promise(res => {
    const tx = histTx("readwrite");
    if(!tx){ res(false); return; }
    tx.objectStore(HIST_STORE).put(reg);
    tx.oncomplete = () => res(true);
    tx.onerror = tx.onabort = () => res(false);
  });
}
function histLlegeix(ts){
  if(!histDB) return Promise.resolve(histMem.find(r => r.ts === ts) || null);
  return new Promise(res => {
    const tx = histTx("readonly");
    if(!tx){ res(null); return; }
    const p = tx.objectStore(HIST_STORE).get(ts);
    p.onsuccess = () => res(p.result || null);
    tx.onerror = tx.onabort = () => res(null);
  });
}
function histEsborra(llista){
  if(!histDB){ histMem = histMem.filter(r => !llista.includes(r.ts)); return Promise.resolve(true); }
  return new Promise(res => {
    const tx = histTx("readwrite");
    if(!tx){ res(false); return; }
    const st = tx.objectStore(HIST_STORE);
    llista.forEach(ts => st.delete(ts));
    tx.oncomplete = () => res(true);
    tx.onerror = tx.onabort = () => res(false);
  });
}
/* Les instantànies senceres només es llegeixen quan es recuperen o es
   descarreguen. L'índex que pinta la llista es construeix un sol cop, en
   arrencar, i a partir d'aquí es manté al dia sol. */
const histFitxa = r => ({ts:r.ts, motiu:r.motiu, mida:r.mida, nAl:r.nAl, nPi:r.nPi});
function histCarregaIndex(){
  if(!histDB){ histIndex = histMem.map(histFitxa); refrescaDades(); return Promise.resolve(); }
  return new Promise(res => {
    const tx = histTx("readonly");
    if(!tx){ res(); return; }
    const p = tx.objectStore(HIST_STORE).getAll();
    p.onsuccess = () => {
      histIndex = (p.result || []).map(histFitxa).sort((a, b) => b.ts - a.ts);
      histUltima = histIndex.length ? histIndex[0].ts : 0;
      histSeg = Math.max(histSeg, histUltima);
      refrescaDades();
      res();
    };
    tx.onerror = tx.onabort = () => res();
  });
}
async function instantania(motiu){
  if(dadesBuides()) return false;
  const json = JSON.stringify(dadesCopia());
  const reg = {ts: histClau(), motiu: motiu || "canvis desats", mida: new Blob([json]).size,
               nAl: state.alumnes.length, nPi: state.pis.length, json};
  histRev = revisio;
  histUltima = reg.ts;
  if(!await histGuarda(reg)) return false;
  histIndex.unshift(histFitxa(reg));
  const sobren = histIndex.slice(HIST_MAX);
  if(sobren.length){
    histIndex = histIndex.slice(0, HIST_MAX);
    await histEsborra(sobren.map(r => r.ts));
  }
  refrescaDades();
  return true;
}
async function recuperaInstantania(ts){
  const reg = await histLlegeix(ts);
  let d = null;
  try{ d = reg ? JSON.parse(reg.json) : null; }catch(e){}
  if(!d){ avisa("Aquesta instantània ja no es pot llegir",
        "El navegador no l'ha retornada. Fes servir una altra instantània de la llista o una còpia descarregada."); return; }
  if(!await confirma("Recupera aquesta instantània",
        `Es tornarà al contingut de <b>${horaCat(ts)}</b> (${reg.nAl} fitxes i ${reg.nPi} plans) i se substituirà tot el contingut actual (${state.alumnes.length} fitxes i ${state.pis.length} plans). Abans es desa una instantània del contingut d'ara, per si te'n vols tornar.`,
        {confirma:"Recupera-la", perillos:true})) return;
  await instantania("abans de recuperar-ne una altra");
  substitueixDades(d);
  state.currentPi = null;
  desa(); go("dashboard");
  toast(`Recuperat el contingut de ${horaCat(ts)}.`);
}
async function baixaInstantania(ts){
  const reg = await histLlegeix(ts);
  if(!reg){ toast("Aquesta instantània ja no hi és."); return; }
  baixa(`pi-copia-${segellHora(ts)}.json`, reg.json);
  toast("Instantània descarregada.");
}
async function buidaHistorial(){
  if(!histIndex.length) return;
  if(!await confirma("Buida l'historial intern",
        `S'esborraran les ${histIndex.length} instantànies desades en aquest navegador. Ni les dades de treball ni les còpies ja descarregades no es toquen.`,
        {confirma:"Buida'l", perillos:true})) return;
  await histEsborra(histIndex.map(r => r.ts));
  histIndex = [];
  histUltima = 0;
  refrescaDades();
  toast("Historial intern buidat.");
}

/* ----- Rellotge comú -----
   Cada mig minut es mira si toca fer alguna cosa; si no hi ha hagut cap canvi
   no es fa res. En segon pla el navegador espaia aquest temporitzador, i per
   això també es comprova en tornar a la pestanya. */
const TICK_COPIES = 30000;
function tickCopies(){
  if(dadesBuides()) return;
  const ara = Date.now();
  if(revisio !== histRev && ara - histUltima >= HIST_CADA) instantania();
  if(copia.auto && revisio !== copia.rev && ara - copia.ultima >= copia.minuts * 60000) faCopiaAuto();
}
/* Repintar la pantalla de dades mentre s'hi escriu destruiria el camp que té
   el focus —el nom del centre és l'únic camp d'escriptura que hi ha—: si
   s'hi està escrivint, l'estat s'actualitzarà al pròxim repintat normal. Les
   caselles i els desplegables sí que es repinten: si no, el mateix interruptor
   que s'acaba de tocar es quedaria dibuixat com estava. */
function refrescaDades(){
  if(state.view !== "dades") return;
  const a = document.activeElement;
  const escrivint = a && (a.tagName === "TEXTAREA" ||
    (a.tagName === "INPUT" && !/^(checkbox|radio|button)$/.test(a.type)));
  if(escrivint) return;
  renderDades();
}

function renderDades(){
  const nAl = state.alumnes.length, nPi = state.pis.length, nMe = (state.mesuresPropies||[]).length;
  const nEd = comptaEditades();
  const nEs = (state.estrategiesPropies||[]).length + comptaEstrategiesEditades();
  const senseP = state.alumnes.filter(a => !a.perfils || !a.perfils.length).length;
  $("#view-dades").innerHTML = `
  <div class="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">
    ${statCard("Alumnat", nAl)}
    ${statCard("Plans", nPi)}
    ${statCard("Mesures pròpies", nMe)}
    ${statCard("Mesures del catàleg modificades", nEd)}
    ${statCard("Estratègies pròpies o modificades", nEs)}
    ${statCard("Espai ocupat", midaEmmagatzematge())}
  </div>

  <div class="note" style="margin-bottom:18px">
    <b>Les dades viuen només en aquest navegador.</b> No hi ha cap servidor: si es buida la memòria del navegador,
    es canvia d'ordinador o s'utilitza una finestra privada, es perden. Descarrega una còpia de seguretat
    periòdicament i guarda-la en un lloc segur del centre: conté <b>dades personals d'alumnat</b>.
    Aquí sota pots activar la <b>còpia automàtica</b> perquè es descarregui sola cada cert temps.
  </div>

  <div class="card"><div class="card-h"><h2>Centre educatiu</h2></div><div class="card-b">
    <label class="field" style="margin-bottom:0"><span class="lbl">Nom del centre (apareix a la capçalera de tots els documents)</span>
      <input type="text" value="${esc(state.centre)}" placeholder="Institut …" onchange="state.centre=this.value.trim();desa();render();toast('Nom del centre desat.')"></label>
  </div></div>

  <div class="card"><div class="card-h"><h2>Còpia de seguretat completa</h2><span class="tag">${nAl} alumnes · ${nPi} plans</span></div><div class="card-b">
    <p class="small muted" style="margin-top:0">Inclou el nom del centre, els logos de la capçalera, totes les fitxes d'alumnat, tots els plans amb el seu seguiment, les mesures pròpies del centre, les modificacions fetes sobre les mesures del catàleg i el banc d'estratègies metodològiques del centre. És el format recomanat per traslladar-ho tot a un altre ordinador.</p>
    <div style="display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn primary" onclick="exportaTot()">Descarrega la còpia completa</button>
      <button class="btn" onclick="dialegRestaura()">Restaura una còpia</button>
    </div>
  </div></div>

  <div class="card"><div class="card-h"><h2>Còpia automàtica</h2>
    ${copia.auto ? `<span class="tag met"><span class="dot"></span>Activada · cada ${copia.minuts} min</span>` : `<span class="tag">Desactivada</span>`}</div><div class="card-b">
    <p class="small muted" style="margin-top:0">Mentre l'aplicació estigui oberta, descarrega sola la còpia completa cada cert temps, i només quan hi hagi hagut canvis. El fitxer va a la carpeta de baixades del navegador: una pàgina web no pot desar en cap altre lloc del disc.</p>
    <label class="chk" style="border:0;padding:0 0 14px"><input type="checkbox" ${copia.auto?"checked":""} onchange="activaCopiaAuto(this.checked)">
      <span class="txt"><b>Desa una còpia automàticament</b><br><span class="muted small">Els fitxers s'anomenen <span class="mono">pi-copia-auto-…</span> amb la data i l'hora, i es tornen a carregar amb «Restaura una còpia».</span></span></label>
    <div class="row">
      <label class="field"><span class="lbl">Cada quants minuts</span>
        <select ${copia.auto?"":"disabled"} onchange="minutsCopiaAuto(this.value)">
          ${MINUTS_COPIA.map(m => `<option value="${m}" ${copia.minuts===m?"selected":""}>${m} minuts</option>`).join("")}
        </select></label>
      <span></span>
    </div>
    <p class="small" style="margin:12px 0 0">${copia.ultima
      ? `Última còpia automàtica: <b>${horaCat(copia.ultima)}</b>.`
      : "Encara no se n'ha fet cap."} ${copia.auto ? "La pròxima es farà quan hi hagi canvis nous i hagi passat l'interval." : ""}</p>
    <p class="legal" style="margin-top:14px"><b>On va el fitxer.</b> La carpeta la tria el navegador, no l'aplicació: al Chrome i a l'Edge, <span class="mono">Configuració → Baixades → Ubicació</span>; al Firefox, <span class="mono">Configuració → General → Baixades</span>. Cal deixar desactivada l'opció de preguntar on desar cada fitxer, o el navegador demanarà confirmació a cada còpia. La primera vegada també pot demanar permís per baixar diversos fitxers automàticament: s'ha d'acceptar. Si la carpeta de baixades és una carpeta sincronitzada (Drive, OneDrive, Nextcloud), la còpia surt de l'ordinador tota sola. Compte: els fitxers s'acumulen i contenen <b>dades personals d'alumnat</b>; convé revisar-los i esborrar-ne els antics de tant en tant.</p>
  </div></div>

  <div class="card"><div class="card-h"><h2>Historial intern</h2>
    <span class="tag">${histIndex.length ? `${histIndex.length} de ${HIST_MAX}` : "buit"}</span>
    ${histIndex.length ? `<button class="btn sm ghost danger" onclick="buidaHistorial()">Buida l'historial</button>` : ""}</div><div class="card-b">
    <p class="small muted" style="margin-top:0">L'aplicació es guarda ella mateixa les últimes ${HIST_MAX} instantànies del contingut dins d'aquest navegador: cada ${HIST_CADA/60000} minuts si hi ha canvis, i sempre just abans d'esborrar, restaurar o carregar dades. Serveix per desfer un error de seguida, sense haver de buscar cap fitxer. No substitueix la còpia descarregada: si es buida la memòria del navegador o es canvia d'ordinador, l'historial es perd igual que la resta.</p>
    ${histPersistent ? "" : `<div class="note" style="margin-bottom:14px"><b>Historial només d'aquesta sessió.</b> En aquest context el navegador no deixa desar-lo de manera permanent —passa quan l'aplicació s'obre amb doble clic sobre el fitxer, amb una adreça <span class="mono">file://</span>—: les instantànies continuen servint per desfer errors, però es perdran en tancar la pestanya. Per tenir-lo permanent, cal obrir l'aplicació des d'un servidor local. La còpia automàtica de més amunt no en depèn.</div>`}
    ${histIndex.length ? `<div class="scroll-x"><table class="stack">
      <thead><tr><th>Moment</th><th>Contingut</th><th>Motiu</th><th>Mida</th><th></th></tr></thead>
      <tbody>${histIndex.map(r => `<tr>
        <td data-l="Moment">${horaCat(r.ts)}</td>
        <td data-l="Contingut">${r.nAl} fitx${r.nAl===1?"a":"es"} · ${r.nPi} pla${r.nPi===1?"":"ns"}</td>
        <td data-l="Motiu"><span class="muted small">${esc(r.motiu)}</span></td>
        <td data-l="Mida"><span class="mono small">${formataMida(r.mida)}</span></td>
        <td><div class="fila-accions">
          <button class="btn sm" onclick="recuperaInstantania(${r.ts})">Recupera</button>
          <button class="btn sm ghost" onclick="baixaInstantania(${r.ts})">Descarrega</button>
        </div></td></tr>`).join("")}</tbody></table></div>`
      : `<p class="small muted" style="margin-bottom:0">Encara no n'hi ha cap. La primera es desarà uns minuts després del pròxim canvi.</p>`}
  </div></div>

  <div class="card"><div class="card-h"><h2>Alumnat</h2><span class="tag">${nAl}</span></div><div class="card-b">
    <p class="small muted" style="margin-top:0">Descarrega o carrega només les fitxes d'alumnat, sense els plans. El format CSV es pot obrir amb un full de càlcul per preparar altes en bloc a principi de curs.</p>
    ${senseP ? `<div class="note" style="margin-bottom:12px">${senseP} fitxa${senseP===1?"":"es"} sense perfils de necessitats assignats. Els perfils alimenten els suggeriments del banc de mesures.</div>` : ""}
    <div style="display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn" onclick="exportaAlumnes('json')" ${nAl?"":"disabled"}>Descarrega JSON</button>
      <button class="btn" onclick="exportaAlumnes('csv')" ${nAl?"":"disabled"}>Descarrega CSV</button>
      <button class="btn primary" onclick="dialegImportaAlumnes()">Carrega alumnat</button>
    </div>
    <p class="legal" style="margin-top:12px">Columnes del CSV: <span class="mono">alias, etapa, curs, grup, naixement, lloc, adreca, tutorLegal, telefon, correu, tutorLegal2, telefon2, correu2, llengua, altresLlengues, dataEap, perfils</span>. La columna <span class="mono">etapa</span> admet <span class="mono">ESO</span> o <span class="mono">Primària</span>; si no hi és, es dedueix del curs. El telèfon i el correu són els de cada tutor/a legal. Els perfils van separats per punt i coma dins de la mateixa cel·la i han de coincidir amb els de l'aplicació.</p>
  </div></div>

  <div class="card"><div class="card-h"><h2>Mesures pròpies del centre</h2><span class="tag">${nMe}</span></div><div class="card-b">
    <p class="small muted" style="margin-top:0">Les mesures que ha creat el centre al banc. Es poden compartir amb altres docents o altres centres.</p>
    <div style="display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn" onclick="exportaMesures()" ${nMe?"":"disabled"}>Descarrega</button>
      <button class="btn" onclick="importaMesuresDialog()">Carrega</button>
      <button class="btn ghost" onclick="go('banc')">Vés al banc</button>
    </div>
  </div></div>

  <div class="card"><div class="card-h"><h2>Dades d'exemple i esborrat</h2></div><div class="card-b">
    <div style="display:flex;gap:9px;flex-wrap:wrap">
      <button class="btn" onclick="carregaExemple()">Carrega dades d'exemple</button>
      <button class="btn danger" style="margin-left:auto" onclick="esborraTot()">Esborra totes les dades</button>
    </div>
    <p class="legal" style="margin-top:12px">Les dades d'exemple substitueixen el contingut actual. L'esborrat és definitiu i no es pot desfer: descarrega't una còpia abans.</p>
  </div></div>`;
}

