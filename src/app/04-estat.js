/* ---------- 2. Estat i persistència ---------- */

const KEY = "pi-eso-v1";
const uid = p => p + Math.random().toString(36).slice(2,8).toUpperCase();

function nouPiObj(alumneId){
  return {
    id: uid("PI-"), alumneId, estat:"esborrany", tipus:"metodologic",
    curs: cursActual(),
    de: {etapa:"ESO", curs:"", grup:"", tutor:"", dataArribada:"", dataSistema:"", dataCentre:"",
         escolaritzacio:"", centresAnteriors:"", repeticions:"", mesuresPrevies:"", altres:""},
    just: {motius:[], caeiProposta:"", caeiMotiu:"", altresMotiu:"", text:"",
           fortaleses:"", dificultats:"", interessos:""},
    prof: {},
    /* adaptacions[] conté les mesures i suports triats del banc o escrits
       pel centre; mesures{} conté la concreció en text lliure per matèria. */
    materies: [], mesures: {}, curr: {}, transv: [],
    horari: {}, franges: ["8.00 – 9.00","9.00 – 10.00","10.00 – 11.00","11.30 – 12.30","12.30 – 13.30","15.00 – 16.00"],
    adaptacions: [], objectius: [],
    /* Si els objectius mesurables surten a l'apartat 5 del document del PI.
       Es decideix al pas 6 i, per defecte, hi surten. */
    docObjectius: true,
    /* Graella de mesures del document amb només els títols, i document
       editat a mà a la previsualització ({html, data}) o null si no n'hi ha. */
    docMesuresSimples: false, docEdit: null,
    dataInici: avui(), proximaRevisio: "",
    conformitat: {lloc:"", data:"", familia:false, acordsFamilia:"", tutorSig:"", director:""},
    reunionsFamilia: [], reunionsProf: [], continuitat: [],
    seguiments: []
  };
}

/* Els plans desats amb versions anteriors poden no tenir tots els camps.
   migraPi() els completa sense perdre res del que ja hi havia. */
function migraPi(p){
  const base = nouPiObj(p.alumneId);
  /* p.de substituiria el bloc sencer: es fusiona per no perdre els camps que
     s'hi han anat afegint (l'etapa, sense anar més lluny). */
  const de = Object.assign({}, base.de, p.de || {});
  /* Igual que p.de: el bloc de conformitat es fusiona perquè els camps que
     s'hi han anat afegint (els acords amb la família) no faltin. */
  const conf = Object.assign({}, base.conformitat, p.conformitat || {});
  const o = Object.assign(base, p);
  o.de = de;
  o.conformitat = conf;
  if(!o.de.etapa) o.de.etapa = "ESO";
  o.mesures = o.mesures || {};
  /* Els plans desats abans d'aquesta opció duien els objectius al document
     sempre: aquest és el valor amb què s'obren. */
  if(o.docObjectius === undefined) o.docObjectius = true;
  o.adaptacions = (o.adaptacions || []).map(x => Object.assign({
    id: uid("A"), adId:"", titol:"", text:"", materia:"Totes les matèries del PI",
    tipus: TIPUS_MESURA[0], intensitat:"Universal", bloc:"", concrecio:""
  }, x));
  Object.keys(o.curr || {}).forEach(k => currDe(o, k));
  /* Instruments i evidències: d'un camp de text sol a una llista. */
  (o.objectius || []).forEach(x => {
    llistaObj(x, "instrument"); llistaObj(x, "evidencia");
    delete x.instrument; delete x.evidencia;
  });
  return o;
}

function avui(){ return new Date().toISOString().slice(0,10); }
function cursActual(){
  const d = new Date(), y = d.getFullYear();
  return d.getMonth() >= 7 ? `${y}-${y+1}` : `${y-1}-${y}`;
}

const state = {
  view: "dashboard",
  centre: "",
  alumnes: [],
  pis: [],
  currentPi: null,
  step: 1,
  filters: {q:"", etapa:"", curs:"", grup:"", tipus:"", estat:""},
  alFilters: {q:"", curs:"", grup:"", perfil:"", tipus:"", estat:""},
  /* El seguiment s'obre pels plans que hi ha en marxa; els altres estats
     segueixen essent consultables canviant el filtre. */
  segFilters: {q:"", curs:"", grup:"", estat:"actius", objectius:""},
  mesuresPropies: [],
  /* Modificacions que el centre ha fet sobre mesures del catàleg oficial:
     {id: {camp: valor}}. Es desen amb la resta de dades i van a la còpia. */
  mesuresEdit: {},
  /* Banc d'estratègies metodològiques: les frases pròpies del centre i les
     modificacions que hagi fet sobre les del banc, amb el mateix criteri que
     les mesures. */
  estrategiesPropies: [],
  estrategiesEdit: {},
  /* Secció d'estratègies dels dos bancs: categoria triada i si està desplegada. */
  estr: {cat:"", obert:true},
  bankFilters: {q:"", perfil:"", materia:"", tipus:"", bloc:"", intensitat:""},
  bm: {obert:false, q:"", perfil:"", materia:"", bloc:"", intensitat:"", desti:"", afegides:0},
  currFilters: {etapa:"eso", materia:"", q:"", tocat:false},
  openMat: {},
  /* Quins currículums té oberts la franja de cada matèria del pas 5 i cap on
     ha d'entrar el panell que s'acaba d'obrir. */
  vistaCurr: {},
  vistaAnim: {},
  openSab: {},
  /* Criteri des del qual s'ha obert la finestra de sabers: {nom, key}. */
  sb: null,
  tc: {materia:"", nivell:""},
  sg: {obj:"", camp:"instrument", idx:0, q:""},
  /* Finestra del banc de frases de conducta observable del pas 6. */
  bc: {obj:"", mode:"ambits", q:"", materia:"", nomesTriat:false},
  pp: {alumne:"", pi:"", perfils:[], base:true, tria:{}, desti:{}, fitxa:false},
  openAdapt: {},
  /* El camp «Altres perfils» del pas 2 s'obre a demanda. */
  perfAltres: false,
  seguimentPi: null,
  logos: [],
  docPi: null,
  draftValoracions: {}
};

/* Comptador de canvis. Avança a cada desada i és el senyal que fan servir la
   còpia automàtica i l'historial intern per no repetir mai un fitxer idèntic
   a l'anterior: cadascun recorda amb quin número va fer la seva última còpia. */
let revisio = 0;

function desa(){
  try{
    localStorage.setItem(KEY, JSON.stringify({centre:state.centre, logos:state.logos, alumnes:state.alumnes, pis:state.pis, mesuresPropies:state.mesuresPropies, mesuresEdit:state.mesuresEdit, estrategiesPropies:state.estrategiesPropies, estrategiesEdit:state.estrategiesEdit}));
    revisio++;
    return true;
  }catch(e){ toast("No s'han pogut desar les dades en aquest navegador."); return false; }
}
function carrega(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return false;
    const d = JSON.parse(raw);
    state.centre = d.centre || "";
    state.logos = Array.isArray(d.logos) ? d.logos.slice(0, LOGOS_MAX) : [];
    state.alumnes = d.alumnes || [];
    state.mesuresPropies = d.mesuresPropies || [];
    state.mesuresEdit = netejaEdicions(d.mesuresEdit);
    state.estrategiesPropies = d.estrategiesPropies || [];
    state.estrategiesEdit = netejaEdicionsEstr(d.estrategiesEdit);
    state.pis = (d.pis || []).map(p => migraPi(p));
    return true;
  }catch(e){ return false; }
}

/* Les edicions que arriben del navegador o d'una còpia es validen: només
   s'accepten identificadors del catàleg oficial i camps coneguts. Una mesura
   que hagi desaparegut del catàleg deixa de tenir edició. */
function netejaEdicions(o){
  const out = {};
  if(!o || typeof o !== "object") return out;
  Object.keys(o).forEach(id => {
    if(!mesuraOriginal(id)) return;
    const e = o[id] || {}, n = {};
    CAMPS_MESURA.forEach(c => {
      if(e[c] === undefined) return;
      if(c === "perfils" || c === "materies") n[c] = Array.isArray(e[c]) ? e[c].slice() : [];
      else n[c] = String(e[c]);
    });
    if(Object.keys(n).length) out[id] = n;
  });
  return out;
}

/* Mateixa neteja per a les frases del banc d'estratègies: només s'accepten
   identificadors del banc i camps coneguts. */
function netejaEdicionsEstr(o){
  const out = {};
  if(!o || typeof o !== "object") return out;
  Object.keys(o).forEach(id => {
    if(!estrategiaOriginal(id)) return;
    const e = o[id] || {}, n = {};
    CAMPS_ESTRATEGIA.forEach(c => {
      if(e[c] === undefined) return;
      if(c === "perfils") n[c] = Array.isArray(e[c]) ? e[c].slice() : [];
      else n[c] = String(e[c]);
    });
    if(Object.keys(n).length) out[id] = n;
  });
  return out;
}

/* ---------- Preferències d'interfície d'aquest navegador ----------
   No són dades del centre (no van a la còpia de seguretat): només recorden
   com vol veure l'aplicació qui la fa servir en aquest dispositiu. */
const KEY_UI = "pi-eso-ui";
const ui = {notesPas5: {}, avisAmagat: false};
function carregaUI(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY_UI) || "{}");
    ui.notesPas5 = (d && typeof d.notesPas5 === "object" && d.notesPas5) || {};
    ui.avisAmagat = !!(d && d.avisAmagat);
  }catch(e){ ui.notesPas5 = {}; ui.avisAmagat = false; }
}
function desaUI(){
  try{ localStorage.setItem(KEY_UI, JSON.stringify({notesPas5: ui.notesPas5, avisAmagat: ui.avisAmagat})); }catch(e){}
}

/* ----- Avís permanent sobre l'ús de l'aplicació -----
   Amagar-lo és una comoditat, no una renúncia: el botó rodó de la dreta hi és
   sempre i el torna a obrir. L'alçada que ocupa es publica com a --avis-h
   perquè res no li quedi a sota. */
function mostraAvis(on){
  ui.avisAmagat = !on;
  desaUI();
  pintaAvis();
}
function pintaAvis(){
  const a = $("#avis"), b = $("#avis-obre");
  const amagat = !!ui.avisAmagat;
  if(a) a.classList.toggle("fora", amagat);
  if(b) b.classList.toggle("on", amagat);
  document.documentElement.style.setProperty("--avis-h",
    (a && !amagat) ? a.offsetHeight + "px" : "0px");
}

function exemple(){
  state.centre = "Institut d'exemple";
  state.alumnes = [
    {id:"AL1", alias:"M. R.", grup:"2n A", etapa:"ESO", curs:"2n ESO", perfils:["TDAH","Dislèxia"], naixement:"2011-04-18", lloc:"Sabadell", adreca:"", telefon:"", tutorLegal:"", llengua:"Català", altresLlengues:"Castellà, anglès", eap:true, dataEap:"2025-10-14"},
    {id:"AL2", alias:"J. S.", grup:"1r C", etapa:"ESO", curs:"1r ESO", perfils:["Discapacitat intel·lectual","TEL/TDL"], naixement:"2012-09-02", lloc:"Terrassa", adreca:"", telefon:"", tutorLegal:"", llengua:"Castellà", altresLlengues:"Català", eap:true, dataEap:"2025-09-02"},
    {id:"AL3", alias:"A. K.", grup:"2n B", etapa:"ESO", curs:"2n ESO", perfils:["Alumne/a nouvingut","Incorporació tardana"], naixement:"2011-01-30", lloc:"Casablanca", adreca:"", telefon:"", tutorLegal:"", llengua:"Àrab", altresLlengues:"Francès", eap:false, dataEap:""},
    {id:"AL4", alias:"L. B.", grup:"4t B", etapa:"Primària", curs:"4t Primària", perfils:["Dislèxia"], naixement:"2016-06-05", lloc:"Girona", adreca:"", telefon:"", tutorLegal:"", llengua:"Català", altresLlengues:"Castellà", eap:true, dataEap:"2025-11-20"}
  ];
  const p = nouPiObj("AL1");
  Object.assign(p, {
    id:"PI-0001", estat:"vigent", tipus:"metodologic",
    de:{curs:"2n", grup:"2n A", tutor:"Tutoria de 2n A", dataArribada:"", dataSistema:"", dataCentre:"2023-09-12", escolaritzacio:"Regular", centresAnteriors:"Escola pública de primària", repeticions:"Cap", mesuresPrevies:"Suport universal a l'aula ordinària i mesures addicionals de lectura a 6è de primària.", altres:""},
    just:{motius:["Avaluació psicopedagògica"], caeiProposta:"", caeiMotiu:"", altresMotiu:"", 
      text:"L'avaluació psicopedagògica identifica un trastorn de l'aprenentatge de la lectoescriptura amb dèficit d'atenció associat. Cal ajustar el format dels materials, el temps de les proves i la càrrega de tasques.",
      fortaleses:"Molt bona comprensió oral i raonament matemàtic. Participa quan la tasca és curta i té un final visible.",
      dificultats:"Lectura lenta i amb errors que li fan perdre el sentit global. Es desorganitza en tasques de més de 15 minuts i no acaba les proves escrites.",
      interessos:"Videojocs de construcció, bàsquet i mecànica de bicicletes."},
    prof:{"0":{on:true,detall:"Tutoria de 2n A"}, "5":{on:true,detall:"Departament d'orientació"}, "9":{on:true,detall:"EAP · informe de 14/10/2025"}},
    materies:["Llengua Catalana i Literatura","Matemàtiques","Llengua Estrangera"],
    mesures:{"Llengua Catalana i Literatura":"Materials en format accessible, lectura prèvia dels enunciats i temps addicional a les proves (mesures addicionals).",
             "Matemàtiques":"Fragmentació de les tasques, prova en dos blocs i no penalització de l'ortografia (mesures addicionals).",
             "Llengua Estrangera":"Consigna oral verificada i suport visual del vocabulari (mesures universals)."},
    proximaRevisio:"2026-03-20", dataInici:"2025-10-06",
    conformitat:{lloc:"Sabadell", data:"2025-10-10", familia:true,
      acordsFamilia:"La família revisa l'agenda cada dia i signa el full de lectura setmanal. El centre avisa amb una setmana d'antelació de les dates de les proves. Es manté el seguiment extern de lectura els dimarts a la tarda.",
      tutorSig:"Tutoria de 2n A", director:""},
    adaptacions:[
      itemMesura(mesura("U-DUA-02"), "Totes les matèries del PI"),
      itemMesura(mesura("AD11"), "Totes les matèries del PI"),
      itemMesura(mesura("AD14"), "Totes les matèries del PI"),
      itemMesura(mesura("U-AVA-07"), "Matemàtiques"),
      itemMesura(mesura("AD02"), "Matemàtiques"),
      itemMesura(mesura("AD13"), "Llengua Catalana i Literatura")
    ],
    objectius:[
      {id:"OB1", materia:"Llengua Catalana i Literatura", conducta:"identificar la idea principal d'un text expositiu de 200 paraules i escriure-la en una frase", suport:"amb el text en format accessible i subratllat guiat", context:"a l'aula ordinària", valor:"4", unitat:"de cada 5 textos", trimestre:"2n trimestre", instruments:["Registre de lectura setmanal","Rúbrica de comprensió lectora"], evidencies:["Full de lectura amb la frase resum","Recull trimestral de resums al portafoli"]},
      {id:"OB2", materia:"Matemàtiques", conducta:"completar la totalitat dels ítems d'una prova escrita dins del temps previst", suport:"amb la prova dividida en dos blocs i temps addicional", context:"en proves escrites", valor:"100", unitat:"% dels ítems iniciats", trimestre:"2n trimestre", instruments:["Proves d'unitat"], evidencies:["Prova corregida amb registre del temps"]}
    ],
    reunionsFamilia:[{id:uid("R"), data:"2025-10-10", agents:"Tutoria, família i alumne/a", temes:"Presentació de la proposta de PI i de les mesures previstes.", acords:"La família accepta el PI. Es revisarà al desembre."}],
    seguiments:[{id:"SG1", data:"2025-12-16", trimestre:"1r trimestre", valoracions:{OB1:"En procés", OB2:"Assolit amb suport"}, observacions:"La divisió de la prova en dos blocs ha funcionat molt bé a Matemàtiques. A lectura encara depèn del subratllat guiat.", decisio:"Continuïtat", autor:"Tutoria de 2n A"}]
  });
  state.pis = [p];
  desa();
}

