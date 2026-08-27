/* ---------- 9. Editor de PI ---------- */
const PASSOS = [
  ["1","Dades"], ["2","Justificació"], ["3","Professionals"], ["4","Mesures i suports"],
  ["5","Currículum"], ["6","Objectius"], ["7","Horari"], ["8","Conformitat i seguiment"]
];

function nouPi(alumneId){
  if(state.alumnes.length===0){ toast("Primer cal afegir almenys un alumne/a."); go("alumnes"); editaAlumne(); return; }
  if(!alumneId){
    openModal("Nou pla de suport individualitzat", `<div style="padding:20px 22px 26px">
      <label class="field"><span class="lbl">Alumne/a</span><select id="np-al">${state.alumnes.map(a=>`<option value="${a.id}">${esc(a.alias)} · ${esc(a.grup)}</option>`).join("")}</select></label>
      <label class="field"><span class="lbl">Tipus de pla</span><select id="np-tipus">
        <option value="metodologic">Metodològic i d'accés — no modifica els criteris d'avaluació del curs</option>
        <option value="continguts">Curricular — prioritza, adapta o substitueix criteris d'avaluació i sabers</option>
      </select></label>
      <p class="legal">L'alumne/a amb PI s'avalua i es qualifica d'acord amb els criteris d'avaluació establerts al pla, cosa que en cap cas pot suposar una limitació en les seves qualificacions.</p>
      <div style="display:flex;gap:9px;margin-top:16px"><button class="btn primary" onclick="creaPi()">Crea el pla</button><button class="btn ghost" onclick="closeModal()">Cancel·la</button></div></div>`);
    return;
  }
  creaPiAmb(alumneId, "metodologic");
}
function creaPi(){ creaPiAmb($("#np-al").value, $("#np-tipus").value); }
/* Crea el pla i el desa, però no hi navega: qui el crida decideix on va
   l'usuari després (l'editor, o la finestra de proposta de mesures). */
function creaPiObj(alumneId, tipus){
  const a = alumne(alumneId);
  const p = nouPiObj(alumneId);
  p.tipus = tipus;
  p.de.etapa = etapaAlumne(a);
  p.de.curs = cursSol(a.curs);
  p.de.grup = a.grup || "";
  if(a.perfils.includes("Alumne/a nouvingut")) p.just.motius.push(MOTIUS[2]);
  state.pis.push(p); state.currentPi = p.id; state.step = 1;
  desa();
  return p;
}
function creaPiAmb(alumneId, tipus){
  creaPiObj(alumneId, tipus);
  closeModal(); go("pi"); toast("Pla creat. Es desa automàticament.");
}
function obrePi(id){ state.currentPi = id; state.step = 1; go("pi"); }

/* ---------- Codi del pla ----------
   El codi surt al document imprès i és la referència que el centre fa servir
   als seus registres, així que ha de poder seguir la nomenclatura de cada
   centre. Alhora és la clau amb què l'aplicació referencia el pla: en canviar-lo
   cal moure totes les referències alhora i garantir que no se'n repeteixi cap.

   El joc de caràcters és deliberadament tancat: lletres, xifres i els separadors
   habituals d'un codi de registre. En queden fora les cometes, els angles i la
   barra invertida, que són els que podrien trencar el document o els
   controls de la interfície. */
const CODI_PI_MAX = 28;
const CODI_PI_ADMES = /^[\p{L}\p{N} ._\-\/·]+$/u;

function errorCodiPi(codi, propi){
  const c = (codi||"").trim();
  if(!c) return "El codi no pot quedar buit.";
  if(c.length > CODI_PI_MAX) return `El codi no pot passar de ${CODI_PI_MAX} caràcters.`;
  if(!CODI_PI_ADMES.test(c))
    return "El codi només admet lletres, xifres, espais i els signes . _ - / ·";
  if(state.pis.some(x => x.id === c && x.id !== propi))
    return `Ja hi ha un altre pla amb el codi <b>${esc(c)}</b>. Els codis han de ser únics.`;
  return "";
}

/* Mou el pla i tot el que hi apuntava al codi nou. */
function reanomenaPi(vell, nou){
  const p = pi(vell);
  if(!p || vell === nou) return;
  p.id = nou;
  if(state.currentPi === vell) state.currentPi = nou;
  if(state.seguimentPi === vell) state.seguimentPi = nou;
  if(state.docPi === vell) state.docPi = nou;
  if(state.draftValoracions[vell]){
    state.draftValoracions[nou] = state.draftValoracions[vell];
    delete state.draftValoracions[vell];
  }
}

async function canviaCodiPi(vell, codi){
  const p = pi(vell);
  if(!p) return;
  const nou = (codi||"").trim();
  if(nou === p.id){ renderPi(); return; }
  const err = errorCodiPi(nou, p.id);
  if(err){
    await avisa("El codi del pla no és vàlid", err);
    renderPi();
    /* El focus torna al camp perquè es pugui corregir sense buscar-lo. */
    setTimeout(() => { const e = $("#pi-codi"); if(e){ e.focus(); e.select(); } }, 20);
    return;
  }
  reanomenaPi(vell, nou);
  desa();
  render();
  refrescaDoc();
  toast(`El pla passa a tenir el codi ${nou}.`);
}
function desaPi(){ desa(); toast("Pla desat en aquest dispositiu."); }
function P(){ return pi(state.currentPi); }
function up(fn){ fn(P()); desa(); }
function upR(fn){ fn(P()); desa(); renderPi(); }

function renderPi(){
  const p = P();
  if(!p){
    $("#view-pi").innerHTML = `<div class="card"><div class="empty"><b>Cap pla obert</b>Obre un pla des del tauler o crea'n un de nou.
      <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn primary" onclick="nouPi()">Crea un PI</button><button class="btn" onclick="go('dashboard')">Vés al tauler</button></div></div></div>`;
    return;
  }
  const a = alumne(p.alumneId);
  const q = qualitat(p), pc = pctQualitat(p);
  const cos = [pas1,pas2,pas3,pas4,pas5,pas6,pas7,pas8][state.step-1](p, a);
  $("#view-pi").innerHTML = `
  <div class="pi-bar" id="pi-bar">
    <div class="pi-ident">
      <span class="alias">${esc(a.alias)}</span>
      <span class="muted small curs-grup">${esc(a.curs)} · ${esc(a.grup)}</span>
      ${tipusTag(p.tipus)} ${estatTag(p.estat)}
      <button type="button" class="btn sm ghost codi-pi" title="Edita el codi del pla" onclick="vesA(1,'codi')">
        <span class="mono small">${esc(p.id)}</span><span class="ic">✎</span></button>
      <div class="pi-accions">
        <select class="btn sm" style="min-height:34px" title="Estat del pla" onchange="upR(p=>p.estat=this.value)">
          ${["esborrany","vigent","seguiment","tancat"].map(e=>`<option value="${e}" ${p.estat===e?"selected":""}>${e[0].toUpperCase()+e.slice(1)}</option>`).join("")}
        </select>
        <button class="btn sm ghost" onclick="tancaPi()">Tanca</button>
      </div>
    </div>
    <div class="stepper">${PASSOS.map((s,i)=>`
      <button aria-current="${state.step===i+1}" class="${state.step>i+1?"done":""}" onclick="state.step=${i+1};renderPi();window.scrollTo({top:0})">
        <span class="n">Pas ${s[0]}</span><span class="t">${s[1]}</span></button>`).join("")}</div>
  </div>
  <div class="wizard">
    <div>${cos}
      <div class="wizard-nav">
        <button class="btn" onclick="state.step=Math.max(1,state.step-1);renderPi();window.scrollTo({top:0})" ${state.step===1?"disabled":""}>Anterior</button>
        <button class="btn primary" onclick="state.step=Math.min(8,state.step+1);renderPi();window.scrollTo({top:0})" ${state.step===8?"disabled":""}>Següent</button>
        <span class="sp"></span>
        <button class="btn" onclick="obreDoc(${jq(p.id)})">Previsualitza el document</button>
      </div>
    </div>
    <aside class="qc">
      <div class="card"><div class="card-h"><h2>Control de qualitat</h2><span class="mono small">${pc}%</span></div>
        <div class="card-b" style="padding:12px 16px">
          <div class="qc-bar" style="margin-bottom:10px"><i style="width:${pc}%"></i></div>
          <ul>${q.map(i=>{
            const accio = i.fitxa ? `editaAlumne('${i.fitxa}')` : `vesA(${i.pas},${jq(i.qc)})`;
            return `<li class="${i.ok?"ok":"no"}"><button type="button" class="qc-go" onclick="${accio}"
              title="Vés-hi per completar-ho"><span class="mark">${i.ok?"✓":"○"}</span><span>${esc(i.t)}</span></button></li>`;
          }).join("")}</ul>
        </div></div>
    </aside>
  </div>`;
  mesuraBarres();
}

/* ----- Barres enganxades de l'editor de PI -----
   La franja del pla se situa just sota la barra superior de l'aplicació i el
   control de qualitat, just sota la franja. Cap de les dues alçades és fixa
   (depenen de l'amplada i del text), de manera que es mesuren i es publiquen
   com a variables CSS en comptes de codificar-les. */
function mesuraBarres(){
  const arrel = document.documentElement;
  pintaAvis();
  const t = $(".topbar");
  if(t) arrel.style.setProperty("--topbar-h", t.offsetHeight + "px");
  const b = $("#pi-bar");
  /* Es mesura sempre desplegada, que és quan és més alta: així el panell de
     control de qualitat no li queda mai a sota, i quan la franja es compacta
     només hi guanya una mica d'aire. */
  if(b){
    const era = b.classList.contains("enganxada");
    if(era) b.classList.remove("enganxada");
    arrel.style.setProperty("--pibar-h", b.offsetHeight + "px");
    if(era) b.classList.add("enganxada");
  } else arrel.style.setProperty("--pibar-h", "0px");
  /* Un frame de marge: qui pinta sovint desplaça la pàgina tot seguit
     (go(), els botons dels passos) i el mode compacte depèn d'on s'ha
     quedat el desplaçament, no d'on era abans. */
  marcaBarraPi();
  requestAnimationFrame(marcaBarraPi);
}
/* La franja passa a mode compacte quan toca la barra superior i s'hi continua
   baixant: els passos hi queden com a etiquetes «Pas N» i deixen lloc al
   contingut. Es torna a desplegar tan bon punt es puja, sense haver d'arribar
   fins a dalt de tot: qui puja sol anar a buscar els passos.

   Es mira el recorregut seguit en una mateixa direcció, no cada esdeveniment
   solt: així un dit o una rodeta imprecisos no la fan parpellejar. Cap amunt
   n'hi ha prou amb un gest mínim, i cap avall se'n demana un de decidit,
   perquè en cas de dubte val més ensenyar els passos que amagar-los. */
const PUJA_BARRA = 5;    /* píxels seguits cap amunt que la despleguen */
const BAIXA_BARRA = 20;  /* píxels seguits cap avall que la compacten */
let ultimaYBarra = -1;   /* on era el desplaçament a l'última comprovació */
let recorregutBarra = 0; /* píxels seguits en la mateixa direcció */
let barraOcupada = false;

/* Canviar l'alçada de la franja mou tot el que té a sota, i el navegador ho
   compensa desplaçant la pàgina pel seu compte. Aquest desplaçament no és el
   gest de ningú: si es comptessin, la franja es tornaria a canviar tot sola i no
   pararia mai. Per això es deixa passar un frame i es torna a prendre la
   referència abans de decidir res més. */
function commutaBarra(b, compacta){
  if(b.classList.contains("enganxada") === compacta) return;
  b.classList.toggle("enganxada", compacta);
  recorregutBarra = 0;
  barraOcupada = true;
  const allibera = () => {
    ultimaYBarra = Math.max(0, window.scrollY || window.pageYOffset || 0);
    barraOcupada = false;
  };
  requestAnimationFrame(allibera);
  setTimeout(allibera, 300);   /* xarxa per si la pestanya no pinta (segon pla) */
}
function marcaBarraPi(){
  const b = $("#pi-bar"); if(!b || barraOcupada) return;
  const t = $(".topbar");
  const lim = (t ? t.offsetHeight : 92) + 1;
  const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
  const pas = ultimaYBarra < 0 ? 0 : y - ultimaYBarra;
  ultimaYBarra = y;
  if(pas > 0) recorregutBarra = recorregutBarra > 0 ? recorregutBarra + pas : pas;
  else if(pas < 0) recorregutBarra = recorregutBarra < 0 ? recorregutBarra + pas : pas;
  /* Mentre la franja és al seu lloc, sense tocar la barra superior, sempre va
     desplegada: no hi ha res a guanyar amagant els passos. */
  if(b.getBoundingClientRect().top > lim){ recorregutBarra = 0; commutaBarra(b, false); return; }
  if(recorregutBarra <= -PUJA_BARRA) commutaBarra(b, false);
  else if(recorregutBarra >= BAIXA_BARRA) commutaBarra(b, true);
}
window.addEventListener("scroll", marcaBarraPi, {passive:true});
window.addEventListener("resize", mesuraBarres);

/* Tanca el pla obert. Des de l'editor es torna al tauler; des d'una altra
   vista (el banc, per exemple) s'hi continua, només que ja sense pla obert. */
function tancaPi(quedat){
  state.currentPi = null;
  if(quedat){ render(); toast("Pla tancat. Les mesures que triïs ja no aniran a cap pla."); }
  else go("dashboard");
}

/* Salta al pas indicat i fa parpellejar la secció que cal completar. */
function vesA(pas, marca){
  if(pas && state.step !== pas){ state.step = pas; renderPi(); }
  /* Un frame de marge perquè el pas acabat de pintar ja sigui al DOM. */
  requestAnimationFrame(() => {
    const el = marca ? $(`#view-pi [data-qc="${marca}"]`) : null;
    if(!el){ window.scrollTo({top:0, behavior:"smooth"}); return; }
    /* Els desplegables tancats s'obren perquè el destí sigui visible. */
    const det = el.closest("details");
    if(det && !det.open) det.open = true;
    /* Primer el senyal visual i després el desplaçament: si el navegador no
       admet scrollIntoView amb opcions, el parpelleig s'ha de veure igualment. */
    el.classList.remove("qc-flash");
    void el.offsetWidth;               // reinicia l'animació si es torna a clicar
    el.classList.add("qc-flash");
    setTimeout(() => el.classList.remove("qc-flash"), 2400);
    try{ el.scrollIntoView({block:"center", behavior:"smooth"}); }
    catch(e){ try{ el.scrollIntoView(); }catch(e2){} }
  });
}

