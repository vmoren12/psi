/* =========================================================
   PI · Pla de suport individualitzat (educació bàsica)
   Currículum: Decret 175/2022, de 27 de setembre (annexos 2, 3 i 4)
   Model documental: Departament d'Educació, "Model del pla de
   suport individualitzat (educació bàsica)"

   L'etapa de cada pla surt de la fitxa de l'alumne/a i decideix quin
   currículum es carrega: les àrees de l'annex 2 a primària i les matèries
   de l'annex 3 a l'ESO. Tota la resta —camps, apartats, mesures, objectius,
   seguiment i document— és idèntica a les dues etapes.
   ========================================================= */

/* ---------- 1. Dades de referència ---------- */

const CURRICULUM = JSON.parse(document.getElementById("curriculum-data").textContent);
const CURR_MAP = {};
CURRICULUM.forEach(m => CURR_MAP[m.nom] = m);
function mat(nom){
  let m = CURR_MAP[nom];
  if(!m) return null;
  if(m.ref) { const b = CURR_MAP[m.ref]; return {nom:m.nom, cursos:b.cursos, tipus:b.tipus, ce:b.ce, sabers:b.sabers}; }
  return m;
}
const MATERIES = CURRICULUM.map(m => m.nom);

/* ---------- 1 bis. Currículum d'educació primària (annex 2) ----------
   Un PI pot haver d'ajustar els criteris d'avaluació a un nivell inferior,
   fins i tot als d'una àrea d'educació primària. Cada matèria del pas 5 pot
   carregar el currículum de l'àrea anàloga de primària i combinar-hi
   elements de les dues etapes. Fer servir qualsevol element de primària
   converteix el pla en curricular (article 25 del Decret 175/2022).

   Les àrees de primària s'identifiquen amb el prefix "Primària · " perquè
   una mateixa matèria pugui portar criteris de les dues etapes sense que
   els codis (1.1, 1.2…) es trepitgin. */
const CURR_PRIM = JSON.parse(document.getElementById("curriculum-primaria-data").textContent);
const EQUIV_PRIM = JSON.parse(document.getElementById("equivalencies-primaria-data").textContent);
const PRIM_MAP = {};
CURR_PRIM.arees.forEach(a => PRIM_MAP[a.nom] = a);
const AREES_PRIM = CURR_PRIM.arees.map(a => a.nom).sort();
const PREF_PRIM = "Primària · ";
const esPrim = id => String(id).indexOf(PREF_PRIM) === 0;
const areaPrim = id => String(id).slice(PREF_PRIM.length);
const idPrim = nom => PREF_PRIM + nom;
const etapaDe = id => esPrim(id) ? "Primària" : "ESO";
/* Matèries o àrees que es poden triar al pas 4 segons l'etapa del pla. */
const matsEtapa = p => esPlaPrim(p) ? AREES_PRIM : MATERIES;
/* Font curricular pròpia d'una matèria del pla: l'àrea de primària quan el
   pla és de primària i la matèria de l'ESO quan és d'ESO. */
const fontBase = (p, nom) => esPlaPrim(p) ? idPrim(nom) : nom;
/* Una font és d'un nivell inferior quan pertany a una etapa anterior a la del
   pla. A primària no n'hi ha cap: el nivell inferior hi és sempre un cicle
   anterior de la mateixa àrea. */
const esInferior = (p, font) => esPrim(font) && !esPlaPrim(p);

/* Resol una font d'elements curriculars: una matèria de l'ESO (annex 3) o
   una àrea de primària (annex 2). Retorna null si no existeix, de manera
   que un pla desat amb dades antigues no trenqui l'aplicació. */
function unitat(id){
  if(!esPrim(id)) return mat(id);
  const a = PRIM_MAP[areaPrim(id)];
  if(!a) return null;
  if(a.ref){
    const b = PRIM_MAP[a.ref];
    if(!b) return null;
    return {nom:a.nom, cursos:b.cursos, ce:b.ce, sabers:b.sabers, etapa:"Primària", ref:a.ref};
  }
  return a;
}
/* Àrees de primària proposades per a una matèria de l'ESO. */
function equivalentsPrim(materia){ return EQUIV_PRIM[materia] || []; }

/* Matèries del model oficial (secció 5) que no són del currículum d'annex 3 */
const EXTRA_FILES = ["Optativa","Projecte","Àmbit","Tutoria"];

const COMP_TRANSVERSALS = [
 {id:"CT1", nom:"Competència ciutadana", desc:"Implicar-se en la comunitat per garantir i defensar el lliure exercici dels drets econòmics, socials i culturals, promovent la defensa de la dignitat de les persones en un context de sostenibilitat ambiental, econòmica i social. Es desplega en la consciència cívica, la consciència global i sostenibilitat i el tractament globalitzat de problemes complexos."},
 {id:"CT2", nom:"Competència emprenedora", desc:"Procés social i dinàmic en què les persones identifiquen oportunitats per innovar i actuar transformant les idees en projectes en un context real. Es desplega en la iniciativa i el projecte, el pensament crític, el pensament creatiu i la gestió de la informació i la comunicació."},
 {id:"CT3", nom:"Competència personal, social i d'aprendre a aprendre", desc:"Implicar-se de manera activa, autònoma i permanent en l'aprenentatge. Es desplega en l'autoregulació de l'aprenentatge, l'autoconeixement i l'autoestima, el benestar emocional, i la col·laboració i el treball en equip."},
 {id:"CT4", nom:"Competència digital", desc:"Ús segur, saludable, sostenible, crític i responsable de les tecnologies digitals per a l'aprenentatge, el treball i la participació en la societat. Inclou l'alfabetització en informació i dades, la comunicació i col·laboració, la creació de continguts, la seguretat i la resolució de problemes."}
];

const PERFILS = ["TEA","TDAH","Dislèxia","Discalcúlia","Discapacitat intel·lectual","Altes capacitats","Trastorns de conducta","TEL/TDL","Discapacitat visual","Discapacitat auditiva","Discapacitat motriu","Incorporació tardana","Alumne/a nouvingut","Situació socioeconòmica desfavorida","Salut mental","Malaltia prolongada"];

/* Secció 3 del model — motius de justificació */
const MOTIUS = [
 "Informe de reconeixement de necessitats específiques de suport educatiu",
 "Avaluació psicopedagògica",
 "Resultat de l'avaluació inicial de l'alumne/a nouvingut",
 "Avaluació de l'alumne/a d'origen estranger que ja no assisteix a l'aula d'acollida però que rep suport a l'aula ordinària",
 "Avaluació de l'alumne/a d'origen estranger amb necessitats educatives derivades de la incorporació tardana al sistema educatiu",
 "Decisió de la comissió d'atenció educativa inclusiva (CAEI)",
 "Altres"
];

/* Secció 4 del model — professionals i serveis */
const PROFESSIONALS = [
 "Tutor/a (responsable de coordinar l'elaboració del PI)",
 "Tutor/a d'aula d'acollida",
 "Suport intensiu educació inclusiva (SIEI)",
 "Aula integral de suport (AIS)",
 "Unitat d'escolarització compartida (UEC)",
 "Especialista d'orientació educativa del centre",
 "Mestre/a de pedagogia terapèutica",
 "Assessor/a de llengua i cohesió social (LIC)",
 "Altres professionals (educador/a, TIS, monitors d'educació inclusiva…)",
 "Equip d'assessorament psicopedagògic (EAP) / treballador/a social",
 "Serveis socials",
 "Centre de salut mental infantil i juvenil (CSMIJ)",
 "CREDA / CREDV / fisioterapeuta…",
 "Suports externs (centres de psicopedagogia, reforç escolar, pla educatiu d'entorn…)",
 "Activitats extraescolars",
 "Beques/Ajuts",
 "Altres serveis"
];

const TRIMESTRES = ["1r trimestre","2n trimestre","3r trimestre"];
const CURSOS = ["1r ESO","2n ESO","3r ESO","4t ESO"];
const CURSOS_PRIM = ["1r Primària","2n Primària","3r Primària","4t Primària","5è Primària","6è Primària"];

/* ---------- 1 ter. Etapa del pla ----------
   L'aplicació serveix per fer plans de suport individualitzat de l'ESO i
   d'educació primària. L'etapa surt de la fitxa de l'alumne/a (camp «Etapa»
   de les dades escolars) i decideix, per si sola, quin currículum es carrega:
   les matèries de l'annex 3 a l'ESO i les àrees de l'annex 2 a primària. Tota
   la resta del pla —camps, apartats, mesures, objectius i document— és la
   mateixa a les dues etapes.

   Un pla de primària no carrega mai el currículum de secundària: no hi ha cap
   nivell superior a ajustar. Un pla d'ESO, en canvi, pot portar el currículum
   de primària a cada matèria, que és el cas d'ajust a un nivell inferior. */
const ETAPES = ["ESO","Primària"];
const cursosEtapa = e => e === "Primària" ? CURSOS_PRIM : CURSOS;
/* Etapa d'una fitxa d'alumne/a. Les fitxes desades abans d'aquesta opció no
   tenen el camp: se'ls dedueix del curs i, si no diu res, són d'ESO. */
const etapaAlumne = a => (a && a.etapa) ? a.etapa
  : (/prim/i.test(String((a && a.curs) || "")) ? "Primària" : "ESO");
const esPlaPrim = p => !!p && ((p.de || {}).etapa === "Primària");
const etapaPla = p => esPlaPrim(p) ? "Primària" : "ESO";
/* Curs solt, sense l'etapa: "2n ESO" i "2n Primària" es desen com a "2n". */
const cursSol = c => String(c == null ? "" : c).replace(/\s*(ESO|Primària)\s*$/i, "").trim();
const ESCALA = ["No iniciat","En procés","Assolit amb suport","Assolit"];
const DIES = ["Dilluns","Dimarts","Dimecres","Dijous","Divendres"];
const ACCIONS_CURR = ["Prioritzar","Adaptar","Substituir per un criteri de nivell anterior","Ampliar o aprofundir","Mantenir sense canvis"];
const ESCOLARITZACIO = ["Regular","Irregular","Sense escolarització prèvia"];

/* Suggeriments per als camps «Instrument d'avaluació» i «Evidència» del pas 6.
   No són una llista tancada: el camp continua sent de text lliure. */
const INSTRUMENTS_SUGG = [
  {g:"Observació sistemàtica", items:[
    "Observació directa a l'aula amb registre anecdòtic",
    "Full de registre d'observació sistemàtica",
    "Graella de recollida de dades per sessió",
    "Llista de control d'assoliment (checklist)",
    "Registre de participació a l'aula",
    "Registre d'ús dels suports i les adaptacions",
    "Full de control d'assistència i puntualitat"]},
  {g:"Rúbriques i escales", items:[
    "Rúbrica analítica per nivells d'assoliment",
    "Rúbrica holística de la tasca competencial",
    "Rúbrica compartida i comentada amb l'alumne/a",
    "Escala de valoració tipus Likert",
    "Diana d'avaluació",
    "Base d'orientació de la tasca",
    "Escala de valoració de l'autonomia personal"]},
  {g:"Proves i tasques", items:[
    "Prova escrita amb format accessible (tipografia, espaiat i temps ampliat)",
    "Prova escrita dividida en parts i lliurada per blocs",
    "Prova oral o entrevista d'avaluació",
    "Prova pràctica o de simulació",
    "Prova de resposta breu amb suport visual",
    "Tasca competencial amb graella de correcció",
    "Full de seguiment del pla de treball individual",
    "Prova estandarditzada de referència (mesura inicial i final)"]},
  {g:"Producció i seguiment de l'alumne/a", items:[
    "Carpeta d'aprenentatge (portafolis)",
    "Portafolis digital",
    "Diari d'aprenentatge de l'alumne/a",
    "Anàlisi de les produccions de l'alumne/a",
    "Registre de lectura",
    "Recompte d'errors i encerts en una mostra de tasques",
    "Cronometratge del temps d'execució de la tasca"]},
  {g:"Autoavaluació i mirada compartida", items:[
    "Autoavaluació amb rúbrica",
    "Coavaluació entre iguals",
    "Full de feedback dialogat amb l'alumne/a",
    "Entrevista de seguiment amb la família",
    "Qüestionari de percepció de l'alumne/a",
    "Informe del professional de suport (SIEI, vetlladora, educador/a)",
    "Acta de la reunió de seguiment del PI"]},
  {g:"Conducta i regulació", items:[
    "Full de registre de conducta (freqüència, durada i intensitat)",
    "Registre ABC (antecedent, conducta, conseqüència)",
    "Full de seguiment de l'agenda i dels encàrrecs",
    "Registre d'autoregulació emocional"]}
];
const EVIDENCIES_SUGG = [
  {g:"Produccions escrites", items:[
    "Text escrit per l'alumne/a",
    "Full de lectura amb la frase resum",
    "Resum o síntesi d'un text expositiu",
    "Esquema o mapa conceptual elaborat",
    "Full de resolució de problemes amb el procés visible",
    "Quadern de la matèria",
    "Dossier de la unitat didàctica",
    "Prova escrita corregida i comentada"]},
  {g:"Produccions orals i audiovisuals", items:[
    "Enregistrament d'àudio de la lectura",
    "Enregistrament de vídeo de l'exposició oral",
    "Producció oral gravada amb el guió de suport",
    "Presentació digital de l'alumne/a"]},
  {g:"Productes i materials", items:[
    "Producte final del projecte",
    "Maqueta, prototip o construcció",
    "Dibuix, il·lustració o esquema gràfic",
    "Full de càlcul o taula de dades",
    "Fotografia de la tasca acabada",
    "Captura de pantalla de l'activitat digital"]},
  {g:"Instruments emplenats", items:[
    "Rúbrica emplenada pel docent",
    "Rúbrica d'autoavaluació emplenada per l'alumne/a",
    "Graella d'observació emplenada",
    "Llista de control emplenada",
    "Registre setmanal signat pel docent",
    "Full de la base d'orientació aplicada",
    "Full d'autoregulació (planificació i revisió de la tasca)",
    "Registre de conducta emplenat"]},
  {g:"Recull i seguiment", items:[
    "Portafolis amb la selecció de treballs del trimestre",
    "Diari d'aprenentatge de l'alumne/a",
    "Comparativa de dues produccions (inici i final del trimestre)",
    "Recull de correccions comentades (feedback escrit)",
    "Full de compromís signat per l'alumne/a",
    "Full de seguiment de l'agenda",
    "Acta de la reunió amb la família",
    "Informe trimestral del professional de suport"]}
];

