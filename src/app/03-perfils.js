/* ---------- 1 quater. Plantilles de mesures per perfil ----------
   Cada perfil de necessitat específica de suport educatiu té una proposta de
   partida de mesures i suports, validada amb la normativa del Departament i la
   literatura professional de referència que se cita a cada plantilla.

   Les plantilles NO són combinacions tancades: quan un alumne/a té més d'un
   perfil, la proposta és la SUMA de les mesures de cada plantilla, sense
   duplicats. No hi ha, doncs, plantilles «mixtes» predefinides.

   Dins de cada plantilla:
     · «nucli»          — mesures que es proposen marcades per defecte;
     · «complementari»  — mesures pertinents que es mostren desmarcades.

   La proposta sempre és editable abans i després de carregar-la: cap mesura
   entra al pla sense que el professional la validi.

   Aquest bloc el genera dades/construeix-perfils.py a partir de
   dades/perfils.json, entre els marcadors PERFILS-INICI / PERFILS-FI.
   No l'editeu a mà: la següent construcció el sobreescriurà. */
/* <<<INSERTA: perfils>>> */

function plantillaPerfil(nom){ return PERFIL_PLANTILLES.find(x => x.perfil === nom); }

/* Suma de les plantilles dels perfils indicats, sense duplicats. Una mesura
   que és de nucli en qualsevol de les plantilles queda com a nucli; també
   s'hi guarda de quins perfils prové, per poder-ho justificar a la finestra. */
function combinaPerfils(perfils, ambBase){
  const out = [], idx = {};
  const posa = (m, origen) => {
    const b = mesura(m.id);
    if(!b) return;                       /* mesura retirada del catàleg */
    let e = idx[m.id];
    if(!e){ e = idx[m.id] = {id:m.id, mesura:b, prioritat:m.prioritat, origens:[]}; out.push(e); }
    if(m.prioritat === "nucli") e.prioritat = "nucli";
    if(!e.origens.includes(origen)) e.origens.push(origen);
  };
  if(ambBase && PERFIL_BASE.mesures)
    PERFIL_BASE.mesures.forEach(m => posa(m, PERFIL_BASE.titol || "Base universal"));
  (perfils || []).forEach(nom => {
    const pl = plantillaPerfil(nom);
    if(pl) pl.mesures.forEach(m => posa(m, nom));
  });
  /* Ordre de lectura: primer les universals, després addicionals i intensives. */
  const ordre = i => INTENSITATS.indexOf(i);
  out.sort((x, y) => (ordre(x.mesura.intensitat) - ordre(y.mesura.intensitat))
                  || (BLOCS_MESURA.indexOf(x.mesura.bloc) - BLOCS_MESURA.indexOf(y.mesura.bloc))
                  || x.id.localeCompare(y.id));
  return out;
}


