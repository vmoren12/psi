/* ---------- Edició del document a la previsualització ----------
   El document es genera a partir del pla, però abans d'imprimir-lo sovint cal
   retocar-ne un text, treure'n un apartat o afegir-hi un matís que no té lloc
   a cap pas. En mode d'edició, el cos del document és editable directament i
   cada apartat porta un botó per eliminar-lo.

   El resultat es desa al pla (p.docEdit) i, a partir d'aquí, el document és
   el text editat: els canvis que es facin després als passos del pla ja no hi
   arriben fins que es descarten les edicions. La franja d'eines ho recorda
   sempre, perquè ningú no imprimeixi una versió antiga sense saber-ho.

   Tot el que és eina (botons, avisos) porta la classe doc-eina i no s'imprimeix
   ni es desa. */
let docEditant = false;
let desaDocTimer = null;

/* Franja d'eines del document: no s'imprimeix. */
function einesDoc(p){
  const ed = p.docEdit && p.docEdit.html;
  return `<div class="doc-tools no-print">
    <span class="eyebrow">Edició del document</span>
    ${docEditant
      ? `<button class="btn sm primary" onclick="commutaEdicioDoc(false)">Acaba l'edició</button>`
      : `<button class="btn sm" onclick="commutaEdicioDoc(true)">Edita el document</button>`}
    ${ed ? `<button class="btn sm ghost danger" onclick="descartaEdicioDoc()">Descarta les edicions</button>` : ""}
    <span class="legal" style="flex-basis:100%;margin:0">${docEditant
      ? "Clica qualsevol text per canviar-lo. Amb el botó <b>×</b> de cada apartat l'elimines sencer. Els canvis es desen sols."
      : ed
        ? `<b>Aquest document té edicions fetes a mà</b> (${dataCat(p.docEdit.data)}). Els canvis que facis ara als passos del pla o al seguiment <b>no s'hi reflecteixen</b> fins que descartis les edicions.`
        : "Pots retocar qualsevol text del document, o eliminar-ne apartats, abans d'imprimir-lo. Les edicions es desen amb el pla."}</span>
  </div>`;
}

/* Activa o desactiva l'edició sobre el document que hi ha pintat ara. */
function aplicaEdicioDoc(){
  const cos = $("#doc-cos");
  if(!cos) return;
  if(!docEditant){ cos.removeAttribute("contenteditable"); return; }
  cos.setAttribute("contenteditable", "true");
  cos.setAttribute("spellcheck", "true");
  cos.querySelectorAll(":scope > section").forEach(s => {
    if(s.querySelector(":scope > .doc-treu")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "doc-treu doc-eina no-print";
    b.contentEditable = "false";
    b.title = "Elimina aquest apartat del document";
    b.setAttribute("aria-label", b.title);
    b.textContent = "×";
    b.onclick = () => treuApartatDoc(s);
    s.insertBefore(b, s.firstChild);
  });
  cos.oninput = () => { cos.dataset.tocat = "1"; clearTimeout(desaDocTimer); desaDocTimer = setTimeout(desaEdicioDoc, 400); };
}

function commutaEdicioDoc(on){
  if(!on){ clearTimeout(desaDocTimer); desaEdicioDoc(true); }
  docEditant = !!on;
  refrescaDoc();
  if(on) toast("Mode d'edició: clica qualsevol text del document per canviar-lo.");
  else toast("Edició acabada.");
}

/* Desa el cos del document tal com és ara, sense les eines. Si no s'hi ha
   tocat res, no es desa res: el document continua viu. */
function desaEdicioDoc(nomesSiCanvia){
  const p = pi(state.docPi), cos = $("#doc-cos");
  if(!p || !cos || (nomesSiCanvia && !cos.dataset.tocat && !(p.docEdit && p.docEdit.html))) return;
  const c = cos.cloneNode(true);
  c.querySelectorAll(".doc-eina").forEach(x => x.remove());
  p.docEdit = {html: c.innerHTML, data: avui()};
  cos.dataset.tocat = "1";
  desa();
}

async function treuApartatDoc(s){
  const h = s.querySelector("h2");
  const ok = await confirma("Elimina l'apartat",
    `Es traurà del document l'apartat <b>${esc(h ? h.textContent : "")}</b>. El pla no canvia: si més endavant descartes les edicions, hi tornarà.`,
    {confirma:"Elimina'l", perillos:true});
  if(!ok) return;
  s.remove();
  desaEdicioDoc();
  refrescaDoc();
}

async function descartaEdicioDoc(){
  const p = pi(state.docPi);
  if(!p || !p.docEdit) return;
  const ok = await confirma("Descarta les edicions",
    "El document tornarà a generar-se a partir del pla i es perdran tots els canvis fets a mà a la previsualització, inclosos els apartats eliminats.",
    {confirma:"Descarta-les", perillos:true});
  if(!ok) return;
  p.docEdit = null;
  docEditant = false;
  desa();
  refrescaDoc();
  toast("Edicions descartades. El document torna a reflectir el pla.");
}

/* Commuta la graella de mesures de l'apartat 5 entre la completa i la que
   només en porta els títols. */
function commutaMesuresSimples(){
  const p = pi(state.docPi);
  if(!p) return;
  if(p.docEdit && p.docEdit.html){
    toast("El document té edicions fetes a mà: descarta-les per poder canviar la graella.");
    return;
  }
  p.docMesuresSimples = !p.docMesuresSimples;
  desa();
  refrescaDoc();
}

/* El text desat torna a entrar al document amb innerHTML. Pot venir d'una
   còpia de seguretat importada, així que abans se'n treu tot el que podria
   executar codi: elements actius, gestors d'esdeveniments i enllaços
   javascript:. */
function netejaHtmlDoc(html){
  const t = document.createElement("template");
  t.innerHTML = String(html || "");
  t.content.querySelectorAll("script,style,iframe,frame,object,embed,link,meta,base,form,input,button,textarea,select,svg,math")
    .forEach(x => x.remove());
  t.content.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(at => {
      const n = at.name.toLowerCase(), v = at.value.replace(/\s+/g, "").toLowerCase();
      if(n.startsWith("on") || n === "contenteditable" || n === "srcdoc") el.removeAttribute(at.name);
      else if((n === "href" || n === "src" || n === "action" || n === "formaction" || n.endsWith(":href"))
              && (v.startsWith("javascript:") || v.startsWith("vbscript:")
                  || (v.startsWith("data:") && !v.startsWith("data:image/")))) el.removeAttribute(at.name);
    });
  });
  return t.innerHTML;
}
