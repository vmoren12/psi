/* ---------- 4. Navegació ---------- */
const TITOLS = {
  dashboard:["Tauler","Estat dels plans de suport individualitzat del centre"],
  alumnes:["Alumnat","Fitxes i perfils de necessitats específiques de suport educatiu"],
  pi:["Editor de PI","Assistent en vuit passos segons el model del Departament"],
  seguiment:["Seguiment","Valoració trimestral i acords de continuïtat"],
  banc:["Banc de mesures i suports","Catàleg consultable per intensitat, bloc, perfil i matèria"],
  curriculum:["Currículum","Decret 175/2022 · competències, criteris d'avaluació i sabers"],
  dades:["Dades i còpies","Còpies de seguretat, alta i baixa d'alumnat i esborrat de dades"]
};
function go(v){
  state.view = v;
  document.querySelectorAll(".view").forEach(s => s.classList.remove("on"));
  $("#view-"+v).classList.add("on");
  document.querySelectorAll("#nav button").forEach(b => b.setAttribute("aria-current", String(b.dataset.view===v)));
  $("#vtitle").textContent = TITOLS[v][0];
  $("#vsub").textContent = TITOLS[v][1];
  render();
  window.scrollTo({top:0, behavior:"instant"});
}
function render(){
  $("#c-pis").textContent = state.pis.length;
  $("#c-al").textContent = state.alumnes.length;
  $("#c-ad").textContent = MESURES().length;
  ({dashboard:renderDashboard, alumnes:renderAlumnes, pi:renderPi, seguiment:renderSeguiment,
    banc:renderBanc, curriculum:renderCurriculum, dades:renderDades}[state.view])();
  renderActions();
}
function renderActions(){
  const a = $("#vactions");
  if(state.view==="dashboard")
    a.innerHTML = `<button class="btn" onclick="go('dades')">Còpies de seguretat</button><button class="btn primary" onclick="nouPi()">Crea un PI</button>`;
  else if(state.view==="alumnes")
    a.innerHTML = `<button class="btn" onclick="go('dades')">Importa i exporta</button><button class="btn primary" onclick="editaAlumne()">Afegeix alumne/a</button>`;
  else if(state.view==="dades")
    a.innerHTML = `<button class="btn primary" onclick="exportaTot()">Descarrega la còpia</button>`;
  else if(state.view==="pi" && state.currentPi)
    a.innerHTML = `<button class="btn" onclick="obreDoc(${jq(state.currentPi)})">Document</button><button class="btn primary" onclick="desaPi()">Desa</button>`;
  else if(state.view==="banc" && state.currentPi)
    a.innerHTML = `<span class="tag met">PI obert: ${esc(alumne(pi(state.currentPi).alumneId).alias)}</span>`;
  else a.innerHTML = "";
}
/* Finestra d'on s'ha arribat a la d'ara, si és que s'hi ha de poder tornar.
   Tancar no és tornar: qui obre la proposta des de la fitxa d'un alumne/a no
   vol acabar a la llista, vol la fitxa que tenia oberta. Les finestres que no
   vénen d'enlloc no ensenyen el botó. */
let tornaDeModal = null;
function tornaModal(){
  const f = tornaDeModal;
  closeModal();
  if(f) f();
}
function openModal(title, html, ample, imprimible, torna){
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  $("#modal .modal-inner").classList.toggle("wide", !!ample);
  tornaDeModal = typeof torna === "function" ? torna : null;
  $("#modal-back").style.display = tornaDeModal ? "" : "none";
  /* Imprimir només té sentit per al document del PI: la resta de finestres
     (fitxes, diàlegs, banc, resums) no porten botó d'impressió. */
  $("#modal-print").style.display = imprimible ? "" : "none";
  $("#modal-caps").style.display = imprimible ? "" : "none";
  $("#modal").classList.add("on");
  document.body.style.overflow = "hidden";
}
/* Capçalera i peu que hi posa el navegador en imprimir (data, URL i número de
   pàgina). Per defecte no s'imprimeixen: el marge de pàgina és zero i el marge
   del full el fa el padding del document. Qui prefereixi la numeració
   automàtica ho pot tornar a activar, però llavors hi tornen data i URL. */
const KEY_CAPS = "pi-eso-capsalera";
function capsaleraNavegador(on){
  try{ localStorage.setItem(KEY_CAPS, on ? "1" : "0"); }catch(e){}
  const c = $("#cap-nav"); if(c) c.checked = !!on;
  $("#print-page").textContent = on
    ? "@media print{@page{margin:14mm}.doc{padding:0;--m-dalt:0mm;--m-cap:0mm;--m-baix:0mm}}"
    : "@media print{@page{margin:0}.doc{padding:0 15mm;--m-dalt:20mm;--m-cap:8mm;--m-baix:14mm}}";
}
function closeModal(){
  tornaDeModal = null;
  $("#modal").classList.remove("on");
  document.body.style.overflow = "";
  if(state.bm && state.bm.obert){ state.bm.obert = false; if(state.view==="pi") renderPi(); }
}

