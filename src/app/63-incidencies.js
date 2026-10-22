/* ---------- Notifica un problema o suggereix una millora ----------
   El botó de la barra lateral (i, a pantalla petita, el de la capçalera)
   obre els formularis d'incidències del dipòsit del projecte a GitHub, en
   una pestanya nova. Hi ha un formulari per a cada cas, els mateixos de
   .github/ISSUE_TEMPLATE/: un error de funcionament, una proposta de millora
   o una errada en el text del currículum o del banc de mesures. Cada
   incidència nova arriba com a notificació a qui manté el dipòsit.

   L'aplicació no envia res: és un enllaç, i qui l'obre ho escriu i ho envia
   des de GitHub. L'única cosa que s'hi posa d'entrada, al formulari d'errors,
   és el navegador i la versió de l'aplicació, que es veuen i es poden
   esborrar abans d'enviar-lo. Cap dada de l'alumnat no surt d'aquí. */

const URL_INCIDENCIES = "https://github.com/vmoren12/psi/issues/new";
const FORMULARIS_INCIDENCIA = {
  error:     "error-de-funcionament.yml",
  millora:   "millora.yml",
  contingut: "errada-de-contingut.yml"
};

async function obreIncidencia(){
  const tria = await obreDlg("Notifica un problema o fes un suggeriment",
    `<p>S'obrirà un formulari del projecte a GitHub, en una pestanya nova. Cal tenir-hi un compte, que és gratuït. Ho rebrà directament qui manté l'aplicació.</p>
    <div class="note alert"><b>No hi escriguis mai dades de l'alumnat</b> (noms, informes, diagnòstics) ni hi adjuntis còpies de seguretat amb plans reals.</div>
    <button class="tria" type="button" onclick="tancaDlg('error')">
      <span class="tria-t">Alguna cosa no funciona</span>
      <span class="tria-d">Un botó que no respon, un document que surt malament, dades que no es desen…</span>
    </button>
    <button class="tria" type="button" onclick="tancaDlg('millora')">
      <span class="tria-t">Proposa una millora</span>
      <span class="tria-d">Una funció nova, un canvi en un pas de l'editor, una mesura o una frase que hi falta.</span>
    </button>
    <button class="tria" type="button" onclick="tancaDlg('contingut')">
      <span class="tria-t">Hi ha una errada en un text</span>
      <span class="tria-d">En un criteri o un saber del currículum, o en una mesura del banc.</span>
    </button>`,
    [{text:"Cancel·la", classe:"ghost", valor:null}]);
  if(!FORMULARIS_INCIDENCIA[tria]) return;
  const q = new URLSearchParams({template: FORMULARIS_INCIDENCIA[tria]});
  if(tria === "error"){
    q.set("navegador", navegadorResum());
    q.set("versio", [versioApp(), location.protocol === "file:" ? "fitxer obert des del disc" : "versió web"].filter(Boolean).join(" · "));
  }
  /* Sense «noopener» a la crida, que faria tornar sempre null i no deixaria
     saber si s'ha bloquejat: el vincle amb aquesta pestanya es talla a mà. */
  const w = window.open(URL_INCIDENCIES + "?" + q.toString(), "_blank");
  if(w) w.opener = null;
  else avisa("No s'ha pogut obrir la pestanya",
    `El navegador ha bloquejat la pestanya nova. Obre aquesta adreça: <span class="mono">${esc(URL_INCIDENCIES)}</span>`);
}

/* Versió de l'aplicació, la que es llegeix al peu de la barra lateral. */
function versioApp(){
  const m = /v\d+(?:\.\d+)+/.exec((document.querySelector(".rail-foot") || {}).textContent || "");
  return m ? m[0] : "";
}

/* «Firefox 130 · Windows», com demana el formulari d'errors. */
function navegadorResum(){
  const ua = navigator.userAgent || "";
  const nav = [[/Edg\/(\d+)/, "Edge"], [/OPR\/(\d+)/, "Opera"], [/Firefox\/(\d+)/, "Firefox"],
               [/Chrome\/(\d+)/, "Chrome"], [/Version\/(\d+).*Safari/, "Safari"]]
    .map(([re, nom]) => { const m = re.exec(ua); return m ? nom + " " + m[1] : ""; }).find(Boolean) || "";
  const so = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android"
           : /iPhone|iPad/.test(ua) ? "iOS" : /CrOS/.test(ua) ? "ChromeOS"
           : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return [nav, so].filter(Boolean).join(" · ");
}
