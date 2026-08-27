/* ---------- Diàlegs propis ----------
   Substitueixen alert(), confirm() i prompt() del navegador: retornen una
   promesa i es pinten amb l'estil de l'aplicació. Viuen a #dlg, fora de
   #modal, per poder-s'hi sobreposar (restaurar una còpia, esborrar una fitxa
   des de la seva pròpia finestra…). El cos admet HTML: qui el crida ja
   escapa el que ve de l'usuari. */
let dlgResol = null;
function tancaDlg(v){
  const f = dlgResol; dlgResol = null;
  $("#dlg").classList.remove("on");
  if(!$("#modal").classList.contains("on")) document.body.style.overflow = "";
  if(f) f(v);
}
function obreDlg(titol, cos, botons, seleccionaText){
  if(dlgResol) tancaDlg(null);      /* mai no n'hi ha dos alhora */
  return new Promise(resolve => {
    dlgResol = resolve;
    $("#dlg-title").textContent = titol;
    $("#dlg-body").innerHTML = cos;
    $("#dlg-foot").innerHTML = botons.map((b,i) =>
      `<button class="btn ${b.classe||""}" data-i="${i}">${esc(b.text)}</button>`).join("");
    [...document.querySelectorAll("#dlg-foot button")].forEach((b,i) =>
      b.onclick = () => { const r = botons[i].valor; tancaDlg(typeof r === "function" ? r() : r); });
    $("#dlg").classList.add("on");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      /* El focus va a l'acció principal, que és l'última… tret que sigui
         destructiva: llavors va a «Cancel·la», perquè una pulsació d'Intro
         per inèrcia no esborri res. Escape sempre cancel·la. */
      const perillos = botons.some(b => (b.classe||"").split(" ").includes("danger"));
      const c = $("#dlg-input") || $(perillos ? "#dlg-foot button" : "#dlg-foot button:last-child");
      if(c){ c.focus(); if(seleccionaText && c.select) c.select(); }
    }, 20);
  });
}
/* Avís simple: equival a alert(). */
function avisa(titol, html){
  return obreDlg(titol, `<p>${html}</p>`, [{text:"D'acord", classe:"primary", valor:true}]);
}
/* Confirmació: equival a confirm(). Resol a true o false. */
function confirma(titol, html, o){
  o = o || {};
  return obreDlg(titol, `<p>${html}</p>`, [
    {text:o.cancella || "Cancel·la", classe:"ghost", valor:false},
    {text:o.confirma || "Continua", classe:o.perillos ? "danger" : "primary", valor:true}
  ]);
}
/* Confirmació d'esborrat amb el detall del que es perdrà. Com confirma(), però
   el cos porta una llista, que no pot anar dins d'un <p>. Resol a true o false. */
function confirmaEsborrat(titol, intro, punts, o){
  o = o || {};
  return obreDlg(titol,
    `<p>${intro}</p>
     ${punts && punts.length ? `<ul>${punts.map(x=>`<li>${x}</li>`).join("")}</ul>` : ""}
     ${o.peu ? `<p class="legal">${o.peu}</p>` : ""}`,
    [{text:o.cancella || "Cancel·la", classe:"ghost", valor:false},
     {text:o.confirma || "Elimina", classe:"danger", valor:true}]);
}
/* Entrada de text: equival a prompt(). Resol al text o a null si es cancel·la. */
function demana(titol, etiqueta, valor, marcador){
  return obreDlg(titol,
    `<label class="field" style="margin-bottom:2px"><span class="lbl">${esc(etiqueta)}</span>
      <input type="text" id="dlg-input" value="${esc(valor || "")}" placeholder="${esc(marcador || "")}"
        onkeydown="if(event.key==='Enter'){event.preventDefault();tancaDlg(this.value.trim())}"></label>`,
    [{text:"Cancel·la", classe:"ghost", valor:null},
     {text:"Desa", classe:"primary", valor:() => { const i = $("#dlg-input"); return i ? i.value.trim() : null; }}],
    true);
}

