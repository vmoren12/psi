/* ============================================================================
   BANC DE MESURES I SUPORTS
   ----------------------------------------------------------------------------
   La font de dades d'aquest catàleg és el fitxer  dades/banc-mesures.json,
   documentat a  dades/BANC-MESURES.md.

   Per afegir, corregir o eliminar mesures:
     1. editeu  dades/banc-mesures.json
     2. executeu  python dades/construeix-banc.py
   L'script valida el catàleg i reescriu el bloc delimitat pels marcadors
   BANC-MESURES-INICI / BANC-MESURES-FI. No l'editeu a mà.

   Cada centre pot afegir, a més, mesures pròpies des de la mateixa aplicació
   (Banc de mesures > Mesura pròpia del centre); es desen al navegador i es
   poden exportar i importar en format JSON.

   El centre també pot editar les mesures d'aquest catàleg (botó «Edita» de
   cada fitxa del banc): el text, les etiquetes de perfil, la intensitat, el
   bloc, l'eix i les matèries. Aquestes modificacions NO es desen aquí sinó a
   state.mesuresEdit, com un joc de camps sobreposats sobre la mesura oficial,
   de manera que:
     · el catàleg d'aquest fitxer segueix essent el del Departament i es pot
       tornar a construir sense perdre res del que hagi fet el centre;
     · qualsevol mesura es pot restaurar al text oficial en un clic.
   ============================================================================ */

/* Intensitats segons el Decret 150/2017, de 17 d'octubre, de l'atenció educativa
   a l'alumnat en el marc d'un sistema educatiu inclusiu:
     · Universal  (art. 8)       adreçada a tot l'alumnat, l'aplica tot el centre.
     · Addicional (art. 9)       ajusta la resposta de forma flexible i temporal.
     · Intensiva  (art. 10 i 11) extraordinària, sense límit temporal; requereix
                                l'informe de reconeixement de necessitats
                                específiques de suport educatiu de l'EAP i
                                comporta l'elaboració d'un PI. */
const INTENSITATS = ["Universal","Addicional","Intensiva"];

/* Nom en plural de cada intensitat, tal com l'usa el Departament als títols
   («mesures i suports universals», «addicionals», «intensius»). */
const INTENSITAT_PLURAL = {Universal:"universals", Addicional:"addicionals", Intensiva:"intensius"};
const INTENSITAT_INFO = {
 "Universal":  {tag:"met",   nota:"Accions i pràctiques de caràcter educatiu, preventiu i proactiu adreçades a tot l'alumnat. Decret 150/2017, article 8."},
 "Addicional": {tag:"warn",  nota:"Actuacions que ajusten la resposta educativa de forma flexible i temporal. Es determinen a partir de la detecció de necessitats i, si escau, d'una avaluació psicopedagògica. Decret 150/2017, article 9."},
 "Intensiva":  {tag:"alert", nota:"Actuacions extraordinàries adaptades a la singularitat de l'alumnat amb necessitats educatives especials, amb freqüència regular i sense límit temporal. Requereixen l'informe de reconeixement de necessitats específiques de suport educatiu elaborat per l'EAP i comporten l'elaboració d'aquest PI. Decret 150/2017, articles 10 i 11."}
};

/* Blocs: taxonomia oficial de les mesures i suports universals
   (Mesures i suports universals en el centre educatiu, Departament d'Educació, 2023)
   ampliada amb els blocs pràctics d'accés, materials, avaluació i benestar. */
const BLOCS_MESURA = ["Disseny universal per a l'aprenentatge","Personalització dels aprenentatges","Organització flexible del centre","Avaluació formativa i formadora","Orientació educativa i acció tutorial","Accés, entorn i mobilitat","Materials i accés a la informació","Avaluació i proves","Gestió del temps i les tasques","Benestar emocional i conducta","Suports addicionals del centre","Suports intensius"];

/* Eix pràctic: sobre què actua la mesura dins de l'aula o del centre. */
const TIPUS_MESURA = ["Metodologia","Organització i agrupament","Espai i entorn","Materials i accés","Presentació de la informació","Expressió i producció","Avaluació i proves","Gestió del temps","Deures i tasques","Acompanyament emocional","Convivència i conducta","Orientació i tutoria","Llengua i comunicació","Recursos i professionals"];

/* <<<INSERTA: banc-mesures>>> */

/* Catàleg efectiu = catàleg del Departament (amb les modificacions que hi
   hagi fet el centre) + mesures pròpies del centre.

   state.mesuresEdit és {id de la mesura: camps modificats}. Només s'hi desa
   allò que el centre ha canviat, mai la mesura sencera: així, si el catàleg
   del Departament s'actualitza, la resta de camps segueixen el catàleg nou i
   el botó «Restaura l'original» torna la mesura al text oficial. */
const CAMPS_MESURA = ["titol","desc","concrecio","intensitat","bloc","tipus","perfils","materies","font"];
function MESURES(){
  const ed = state.mesuresEdit || {};
  return MESURES_BASE.map(m => {
    const e = ed[m.id];
    return e ? Object.assign({}, m, e, {editada:true}) : m;
  }).concat(state.mesuresPropies || []);
}
/* Mesura original del catàleg, sense les modificacions del centre. */
function mesuraOriginal(id){ return MESURES_BASE.find(x => x.id === id); }
function esEditada(id){ return !!(state.mesuresEdit || {})[id]; }
function comptaEditades(){ return Object.keys(state.mesuresEdit || {}).length; }
/* Matèries pel filtre del banc: les que el catàleg fa servir per etiquetar les
   mesures, no les del currículum. Així la llista val a les dues etapes i no
   ofereix mai una matèria que no filtraria res. */
function MATERIES_BANC(){
  const v = new Set();
  MESURES().forEach(b => (b.materies||[]).forEach(m => { if(m && m !== "*") v.add(m); }));
  return [...v].sort();
}
function mesura(id){ return MESURES().find(x => x.id === id); }

