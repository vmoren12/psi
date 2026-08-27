# Banc de mesures i suports

Aquest document explica com està construït el catàleg de mesures i suports de
l'aplicació de plans de suport individualitzat i com ampliar-lo o corregir-lo.

---

## 1. On viuen les dades

| Fitxer | Què és |
|---|---|
| `data/banc-mesures.json` | **Font de veritat.** El catàleg complet, editable a mà. |
| `tools/build.py` | Valida el catàleg i l'incrusta dins de `dist/pi-eso.html`. |
| `data/perfils.json` | Plantilles de mesures per perfil, construïdes sobre aquest catàleg. Vegeu `docs/dades/perfils.md`. |
| `dist/pi-eso.html` | L'aplicació. Conté una còpia generada del catàleg entre els marcadors `BANC-MESURES-INICI` i `BANC-MESURES-FI`. |

L'aplicació és un únic fitxer HTML pensat per obrir-se directament des del disc
(protocol `file://`). Els navegadors bloquegen la lectura de fitxers JSON
externs en aquest context, de manera que el catàleg s'ha d'incrustar dins de
l'HTML. Per això hi ha un pas de construcció.

### Flux de treball

```
1. editeu    data/banc-mesures.json
2. executeu  python -m tools.build
3. obriu     dist/pi-eso.html
```

L'script **valida abans d'escriure**. Si troba cap error no toca l'HTML i us diu
exactament quina mesura i quin camp cal corregir. No editeu mai a mà el bloc
delimitat pels marcadors dins de `dist/pi-eso.html`: la següent construcció el
sobreescriurà.

---

## 2. Estructura d'una mesura

```json
{
 "id": "U-AVA-10",
 "titol": "Rúbrica",
 "desc": "Instrument d'avaluació formativa en forma de taula de doble entrada…",
 "concrecio": "Cada producció avaluable de la matèria es lliura amb la rúbrica…",
 "intensitat": "Universal",
 "bloc": "Avaluació formativa i formadora",
 "tipus": "Avaluació i proves",
 "perfils": [],
 "materies": ["*"],
 "font": "Mesures i suports universals en el centre educatiu (Departament d'Educació, 2023)"
}
```

| Camp | Obligatori | Descripció |
|---|---|---|
| `id` | sí | Identificador únic i estable. **No el canvieu mai** un cop publicat: els plans ja desats hi fan referència. |
| `titol` | sí | Nom curt de la mesura. |
| `desc` | sí | Què és la mesura, en termes generals. És el text que es llegeix al banc. |
| `concrecio` | sí | Redacció concreta, en primera lectura, que s'incorpora al pla quan s'afegeix la mesura. **Cap mesura del catàleg no la pot deixar buida**: és el text que el docent llegirà dins del PI. L'aplicació recorre a `desc` només en mesures pròpies del centre que no en tinguin. |
| `intensitat` | sí | `Universal`, `Addicional` o `Intensiva`. Vegeu l'apartat 3. |
| `bloc` | sí | Categoria del catàleg. Vegeu l'apartat 4. |
| `tipus` | sí | Eix pràctic sobre el qual actua la mesura. Vegeu l'apartat 4. |
| `perfils` | sí | Llista de perfils de necessitats als quals la mesura és especialment pertinent. **Llista buida = mesura genèrica**, aplicable a tothom. Aquests valors alimenten els suggeriments automàtics per a l'alumne/a. No s'ha de confondre amb les plantilles de perfil, que són una selecció argumentada a part: vegeu `docs/dades/perfils.md`. |
| `materies` | sí | `["*"]` per a totes les matèries, o una llista de noms de matèria. |
| `font` | sí | Procedència de la mesura. Es mostra al peu de cada fitxa del banc. |

### Vocabularis tancats

Els valors de `perfils` i `materies` **han de coincidir literalment** amb els que
utilitza l'aplicació:

- `perfils`: la constant `PERFILS` de `dist/pi-eso.html`.
- `materies`: els noms de matèria de l'annex 3 del Decret 175/2022 incrustats a
  `<script id="curriculum-data">`, més `Optativa`, `Projecte`, `Àmbit` i `Tutoria`.

L'script de construcció comprova aquesta correspondència. Un nom de matèria mal
escrit (per exemple `Física i química` en comptes de `Física i Química`) faria
que el filtre per matèria no trobés mai la mesura, i per això es rebutja.

---

## 3. Intensitats

Segons el **Decret 150/2017, de 17 d'octubre**, de l'atenció educativa a l'alumnat
en el marc d'un sistema educatiu inclusiu:

| Intensitat | Article | Què vol dir |
|---|---|---|
| **Universal** | art. 8 | Accions i pràctiques de caràcter educatiu, preventiu i proactiu adreçades a **tot** l'alumnat. Les aplica tot el centre. |
| **Addicional** | art. 9 | Actuacions que ajusten la resposta educativa **de forma flexible i temporal**. Es determinen a partir de la detecció de necessitats i, si escau, d'una avaluació psicopedagògica. |
| **Intensiva** | art. 10–11 | Actuacions **extraordinàries**, adaptades a la singularitat de l'alumnat amb necessitats educatives especials, amb freqüència regular i sense límit temporal. Requereixen l'informe de reconeixement de necessitats específiques de suport educatiu elaborat per l'EAP i comporten l'elaboració d'un PI (art. 12–14). |

> **Important.** «Intensiva» no vol dir «molt personalitzada». Una mesura és
> intensiva quan mobilitza els recursos extraordinaris del sistema: SIEI, SIAL,
> AIS, UEC, personal d'atenció educativa, centres d'educació especial o CEEPSIR.
> Una adaptació d'aula, per molt individualitzada que sigui, és universal o
> addicional. Classificar-la com a intensiva és un error normatiu i inflaria
> indegudament el perfil de necessitats de l'alumne/a.

---

## 4. Blocs i eixos

**Blocs** — segueixen la taxonomia oficial de les mesures i suports universals
(*Mesures i suports universals en el centre educatiu*, Departament d'Educació,
2023), ampliada amb els blocs pràctics d'aula:

1. Disseny universal per a l'aprenentatge
2. Personalització dels aprenentatges
3. Organització flexible del centre
4. Avaluació formativa i formadora
5. Orientació educativa i acció tutorial
6. Accés, entorn i mobilitat
7. Materials i accés a la informació
8. Avaluació i proves
9. Gestió del temps i les tasques
10. Benestar emocional i conducta
11. Suports addicionals del centre
12. Suports intensius

L'ordre d'aquesta llista és l'ordre en què es mostren els blocs al banc.

**Eixos (`tipus`)** — sobre què actua la mesura: Metodologia · Organització i
agrupament · Espai i entorn · Materials i accés · Presentació de la informació ·
Expressió i producció · Avaluació i proves · Gestió del temps · Deures i tasques ·
Acompanyament emocional · Convivència i conducta · Orientació i tutoria ·
Llengua i comunicació · Recursos i professionals.

Per afegir un bloc o un eix nou cal declarar-lo **tant** a `vocabulari` dins del
JSON **com** a les constants `BLOCS_MESURA` / `TIPUS_MESURA` de `dist/pi-eso.html`.

---

## 5. Contingut actual del catàleg

**114 mesures**: 69 universals, 38 addicionals i 7 intensives.

| Origen | Mesures |
|---|---|
| Les 51 fitxes de *Mesures i suports universals en el centre educatiu* (Departament d'Educació, 2023), més els apartats de programació d'aula, situacions d'aprenentatge, retroacció, metacognició, formes flexibles de treball i espais de l'entorn | 61 |
| Adaptacions d'aula d'ús habitual en la pràctica docent, per perfil de necessitat | 38 |
| Taula de mesures i suports **addicionals** del Departament (Decret 150/2017, art. 9) | 8 |
| Taula de mesures i suports **intensius** del Departament (Decret 150/2017, art. 10–11) | 7 |

### Prefixos dels identificadors

| Prefix | Origen |
|---|---|
| `U-DUA-` | Disseny universal per a l'aprenentatge |
| `U-PER-` | Personalització dels aprenentatges |
| `U-ORG-` | Organització flexible del centre |
| `U-AVA-` | Avaluació formativa i formadora |
| `U-TUT-` | Orientació educativa i acció tutorial |
| `AD` + número | Adaptacions d'aula per perfil |
| `AD-DEP-` | Mesures addicionals del Departament |
| `IN-DEP-` | Mesures intensives del Departament |
| `CM-` | Mesures pròpies del centre, creades des de la mateixa aplicació |

---

## 6. Mesures pròpies del centre

Un centre pot ampliar el banc **sense tocar cap fitxer**, des de la mateixa
aplicació: *Banc* → **Nova mesura del centre**.

- Es desen a l'emmagatzematge local del navegador, amb identificador `CM-…`.
- Apareixen al banc dins del bloc **Mesures pròpies del centre**.
- S'inclouen a la còpia de seguretat general.
- Es poden **exportar** i **importar** com a fitxer JSON independent
  (`mesures-del-centre.json`) per compartir-les entre docents o entre centres.

Aquesta via és la recomanada per a mesures locals i concretes. Reserveu
`banc-mesures.json` per al catàleg normatiu comú.

---

## 7. Com afegir una mesura al catàleg comú

1. Obriu `data/banc-mesures.json`.
2. Copieu una entrada existent del mateix bloc i modifiqueu-la.
3. Assigneu-li un `id` nou i únic seguint els prefixos de l'apartat 5.
4. Ompliu `desc` (què és) i `concrecio` (com es redacta al PI). Les dues són
   obligatòries i l'script les rebutja buides. La `concrecio`
   és el que més ajuda el docent: escriviu-la com si ja fos dins del pla, en
   tercera persona i amb el detall operatiu suficient perquè es pugui aplicar
   i avaluar.
5. Trieu la `intensitat` amb el criteri de l'apartat 3.
6. Indiqueu `perfils` només si la mesura és especialment pertinent per a algun
   perfil concret; si serveix per a tothom, deixeu la llista buida.
7. Executeu `python -m tools.build` i comproveu-ne la sortida.
8. Si la mesura hauria de formar part de la proposta d'algun perfil, afegiu-la
   també a la plantilla corresponent de `data/perfils.json` i executeu
   `python -m tools.build`. Vegeu `docs/dades/perfils.md`.

---

## 8. Fonts

- **Decret 150/2017**, de 17 d'octubre, de l'atenció educativa a l'alumnat en el
  marc d'un sistema educatiu inclusiu.
- **Decret 175/2022**, de 27 de setembre, d'ordenació dels ensenyaments de
  l'educació bàsica (annexos 3 i 4).
- Departament d'Educació, *Mesures i suports universals en el centre educatiu.
  Orientacions per als centres en la planificació de mesures i suports
  universals*, 1a edició, setembre de 2023.
- Departament d'Educació, taules de *Mesures i suports universals*, *Mesures i
  suports addicionals* i *Mesures i suports intensius*.
- Departament d'Educació, *Model del pla de suport individualitzat (educació
  bàsica: educació secundària obligatòria)*.
