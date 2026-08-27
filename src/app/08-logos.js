/* ---------- Logos i segells del centre ----------
   Fins a tres imatges que s'imprimeixen en una sola fila a la capçalera de
   tots els documents. Es desen com a data URI dins de l'emmagatzematge del
   navegador, igual que la resta de dades, i per això les de mapa de bits es
   redueixen abans de desar-les. Els SVG són vectorials i es guarden tal qual,
   amb un límit de mida perquè no omplin l'emmagatzematge. */
const LOGOS_MAX = 3;
const LOGO_ALCADA = 240;          /* píxels d'alçada màxima de les imatges de mapa de bits */
const LOGO_PES_MAX = 400 * 1024;  /* límit del data URI d'un SVG */
function triaLogos(){
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/png,image/jpeg,image/svg+xml,image/webp,image/gif";
  inp.multiple = true;
  inp.onchange = () => afegeixLogos([...inp.files]);
  inp.click();
}
function preparaLogo(f){
  return new Promise((resolve, reject) => {
    if(!/^image\//.test(f.type||"")) return reject(new Error("no sembla una imatge"));
    const r = new FileReader();
    r.onerror = () => reject(new Error("no s'ha pogut llegir el fitxer"));
    r.onload = () => {
      const src = String(r.result);
      if(f.type === "image/svg+xml"){
        if(src.length > LOGO_PES_MAX) reject(new Error("l'SVG pesa massa"));
        else resolve(src);
        return;
      }
      const im = new Image();
      im.onerror = () => reject(new Error("el format no es reconeix"));
      im.onload = () => {
        const k = Math.min(1, LOGO_ALCADA / (im.naturalHeight || LOGO_ALCADA));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round((im.naturalWidth||1) * k));
        c.height = Math.max(1, Math.round((im.naturalHeight||1) * k));
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        try{ resolve(c.toDataURL("image/png")); }
        catch(e){ reject(new Error("no s'ha pogut processar")); }
      };
      im.src = src;
    };
    r.readAsDataURL(f);
  });
}
async function afegeixLogos(fitxers){
  state.logos = state.logos || [];
  const lliures = LOGOS_MAX - state.logos.length;
  if(lliures <= 0){ toast(`Ja hi ha ${LOGOS_MAX} imatges a la capçalera.`); return; }
  if(fitxers.length > lliures) toast(`Només hi caben ${lliures} imatge${lliures===1?"":"s"} més.`);
  const abans = state.logos.slice();
  const noves = [];
  for(const f of fitxers.slice(0, lliures)){
    try{
      const l = {id:uid("LG"), nom:f.name, src: await preparaLogo(f), totes:false};
      state.logos.push(l); noves.push(l);
    }catch(e){ toast(`«${f.name}»: ${e.message}.`); }
  }
  const posades = noves.length;
  if(!posades) return;
  /* Si no hi caben a l'emmagatzematge del navegador, es desfà l'operació
     sencera: val més quedar-se sense logo que perdre les dades del PI. */
  if(!desa()){
    state.logos = abans; desa();
    avisa("No hi ha prou espai", "Les imatges no caben a l'emmagatzematge d'aquest navegador. Prova-ho amb fitxers més petits o descarrega una còpia de seguretat i allibera espai.");
    return;
  }
  refrescaDoc();
  const totes = await confirma(posades===1 ? "On ha de sortir la imatge?" : "On han de sortir les imatges?",
    posades===1
      ? "Pots posar-la només a la capçalera de la <b>primera pàgina</b> o repetir-la com a <b>capçalera de totes</b> les pàgines del document."
      : "Pots posar-les només a la capçalera de la <b>primera pàgina</b> o repetir-les com a <b>capçalera de totes</b> les pàgines del document.",
    {cancella:"Només a la primera", confirma:"A totes les pàgines"});
  if(totes){ noves.forEach(l => l.totes = true); desa(); }
  refrescaDoc();
  toast(`${posades} imatge${posades===1?"":"s"} a la capçalera` + (totes ? " de totes les pàgines." : " de la primera pàgina."));
}
function treuLogo(id){
  state.logos = (state.logos||[]).filter(l => l.id !== id);
  desa(); refrescaDoc();
  toast("Imatge treta de la capçalera.");
}
/* Controls de les imatges dins de la previsualització: no s'imprimeixen. */
function einesLogos(){
  const l = state.logos || [];
  return `<div class="doc-tools no-print">
    <span class="eyebrow">Logos i segells del centre</span>
    ${l.map(x=>`<span class="logo-chip"><img src="${esc(x.src)}" alt="${esc(x.nom||"")}">
      <button class="btn sm ghost pag" aria-pressed="${!!x.totes}" onclick="commutaLogo('${x.id}')"
        title="Canvia on surt ${esc(x.nom||"la imatge")}">${x.totes ? "Totes les pàgines" : "Només pàgina 1"}</button>
      <button class="btn sm ghost treu" title="Treu ${esc(x.nom||"la imatge")}" onclick="treuLogo('${x.id}')">×</button></span>`).join("")}
    ${l.length < LOGOS_MAX
      ? `<button class="btn sm" onclick="triaLogos()">Afegeix una imatge</button>`
      : `<span class="muted small">Màxim de ${LOGOS_MAX} imatges.</span>`}
    <span class="legal" style="flex-basis:100%;margin:0">PNG, JPG, SVG o WEBP. Es desen en aquest navegador, dins de la còpia de seguretat, i surten a la capçalera de tots els documents del centre. Amb el botó de cada imatge tries si surt <b>només a la primera pàgina</b> o com a <b>capçalera de totes</b>; si en combines les dues opcions, la primera pàgina en mostra dues files.</span>
  </div>`;
}
/* Commuta si una imatge surt només al primer full o a la capçalera de tots. */
function commutaLogo(id){
  const l = (state.logos||[]).find(x => x.id === id);
  if(!l) return;
  l.totes = !l.totes;
  desa(); refrescaDoc();
  toast(l.totes ? `«${l.nom}» sortirà a la capçalera de totes les pàgines.`
                : `«${l.nom}» només sortirà a la primera pàgina.`);
}

