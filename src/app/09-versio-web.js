/* ---------- 9. La versió web ----------
   Aquest és l'únic mòdul que sap que l'aplicació, a més de baixar-se, també
   es publica a una adreça. Obert des del disc (`file://`) no fa absolutament
   res: el fitxer únic continua sent autònom i no referencia cap recurs del
   costat. Vegeu docs/adr/0006-versio-web-i-pwa.md.

   Servit per http(s) fa tres coses:

     1. Enllaça el manifest i la icona d'inici, que viuen a `web/` i només
        existeixen al lloc publicat. S'injecten des d'aquí i no des de
        `src/index.html` precisament perquè el document baixat no ha de portar
        cap referència a fitxers que no tindrà al costat: obert des d'un llapis
        de memòria donaria errors de consola i faria dubtar de si funciona.
     2. Registra el service worker, que és el que permet instal·lar
        l'aplicació i tornar-la a obrir sense connexió.
     3. Ofereix les dues maneres d'endur-se-la: instal·lar-la com a aplicació
        del dispositiu o baixar el fitxer únic de sempre.

   Res d'això toca les dades: el service worker només guarda l'aplicació i els
   tipus de lletra, i els plans continuen vivint només al navegador. */

const SERVIT_PER_WEB = location.protocol === "http:" || location.protocol === "https:";

/* El convit d'instal·lació que disparen Chrome, Edge i Android quan
   l'aplicació compleix els criteris. Es reté en comptes de deixar-lo passar
   perquè la barra automàtica del navegador apareix quan vol i no explica res;
   així el mateix convit es dispara des del nostre diàleg, on al costat hi ha
   l'altra opció i la diferència entre totes dues escrita.

   Safari i Firefox no el disparen mai: no hi ha API equivalent, i allà la
   instal·lació només es pot explicar. Val més dir com es fa que ensenyar un
   botó que no faria res. */
let convitInstal = null;

/* Quan l'aplicació ja corre instal·lada, el convit no torna a arribar i
   oferir-la seria absurd. `standalone` és el que fa servir iOS. */
const jaInstalLada = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

/* iPhone, iPad i els Mac amb pantalla tàctil, que Safari declara com a
   MacIntel. Només serveix per triar quina instrucció es mostra. */
const esDispositiuApple = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/* Els recursos de la versió web, amb ruta relativa al document. Així el lloc
   funciona igual a l'arrel d'un domini propi que dins d'un subdirectori de
   github.io, i no cal tocar res si l'adreça canvia. */
function enllacaRecursosWeb(){
  const posa = (rel, href) => {
    const l = document.createElement("link");
    l.rel = rel;
    l.href = href;
    document.head.appendChild(l);
  };
  posa("manifest", "manifest.webmanifest");
  /* iOS no llegeix les icones del manifest quan es fa «Afegeix a la pantalla
     d'inici»: li cal aquesta, i opaca. */
  posa("apple-touch-icon", "icona-180.png");
}

/* ----- El diàleg de tria -----
   Les dues opcions no són equivalents i la diferència no és evident: una deixa
   una aplicació que s'actualitza sola i conserva els plans, i l'altra deixa un
   fitxer independent i buit. Per això cada opció porta la seva explicació al
   costat i no només un nom. */
function opcioInstal(){
  if(jaInstalLada()) return "";
  if(convitInstal){
    return `<button class="tria" type="button" onclick="tancaDlg('instal')">
      <span class="tria-t">Instal·la l'aplicació <span class="tag met">Recomanat</span></span>
      <span class="tria-d">Queda amb icona pròpia al dispositiu, s'obre sense barra d'adreces,
      funciona sense connexió i s'actualitza sola. <b>Els plans que ja tens es conserven.</b></span>
    </button>`;
  }
  /* Sense convit no hi ha res a clicar: només es pot dir com es fa a mà. */
  const com = esDispositiuApple()
    ? "A Safari, botó de compartir → <b>Afegeix a la pantalla d'inici</b>."
    : "Chrome i Edge l'ofereixen des de la barra d'adreces o del menú del navegador. "
      + "A Safari del Mac, <b>Arxiu → Afegeix al Dock</b>.";
  return `<div class="note info">Aquest navegador no permet instal·lar-la des d'aquí. ${com}</div>`;
}

function opcioDescarrega(){
  return `<button class="tria" type="button" onclick="tancaDlg('fitxer')">
    <span class="tria-t">Descarrega el fitxer</span>
    <span class="tria-d">Un sol HTML que s'obre amb doble clic, per a un llapis de memòria, el correu
    o una xarxa de centre que filtri dominis. Funciona sense connexió i no s'actualitza mai.
    <b>Es baixa buit</b>: els plans d'aquesta pestanya no hi van, perquè cada còpia desa les dades
    pel seu compte. Per traslladar-los, exporta la còpia des de «Dades i còpies».</span>
  </button>`;
}

async function obtenAplicacio(){
  const tria = await obreDlg("Com vols fer servir el PI?",
    opcioInstal() + opcioDescarrega(),
    [{text: "Cancel·la", classe: "ghost", valor: null}]);
  if(tria === "instal") return instalAplicacio();
  if(tria === "fitxer") return baixaFitxerUnic();
}

/* El convit només es pot fer servir un cop, i s'ha de disparar des del gest de
   la persona: per això es crida aquí mateix, en resoldre's el diàleg, i no
   més tard. Si es tanca sense instal·lar, el navegador ja el tornarà a
   disparar quan li sembli i el tornarem a retenir. */
async function instalAplicacio(){
  const convit = convitInstal;
  convitInstal = null;
  if(!convit) return;
  convit.prompt();
  const resposta = await convit.userChoice;
  if(resposta && resposta.outcome === "accepted") toast("S'està instal·lant l'aplicació");
}

function baixaFitxerUnic(){
  /* L'enllaç s'insereix al document abans de clicar-lo: Safari no fa cas del
     clic sobre un element que no hi és, i aquest botó l'han de poder fer
     servir des d'un iPad. */
  const a = document.createElement("a");
  a.href = "pi-eso.html";
  a.download = "pi-eso.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("S'està baixant pi-eso.html");
}

function arrencaVersioWeb(){
  if(!SERVIT_PER_WEB) return;
  enllacaRecursosWeb();
  const b = $("#baixa-app");
  if(b) b.hidden = false;

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();          /* la barra automàtica no; el convit el fem nosaltres */
    convitInstal = e;
  });
  window.addEventListener("appinstalled", () => {
    convitInstal = null;
    toast("Aplicació instal·lada");
  });

  /* El registre va després de la càrrega perquè no competeixi per l'amplada
     de banda amb el document, que és el que la persona està esperant. Si el
     navegador no en té, o si el lloc no se serveix per https, no passa res:
     l'aplicació funciona igual, només que sense mode sense connexió ni
     possibilitat d'instal·lar-la. */
  if(!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
