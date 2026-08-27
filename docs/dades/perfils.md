# Plantilles de mesures per perfil

Aquest document explica com estan construïdes les **propostes de mesures i
suports per perfil de necessitat específica de suport educatiu** de l'aplicació
de plans de suport individualitzat, i com editar-les o ampliar-les.

---

## 1. Què són i què no són

Cada perfil de la llista `PERFILS` de l'aplicació té una **plantilla**: una
selecció de mesures del banc (`data/banc-mesures.json`) especialment pertinents
per a aquell perfil, amb el raonament professional i les fonts que la sostenen.

Des de la fitxa de l'alumne/a (botó **Desa la fitxa i mostra la proposta…**,
just sota dels perfils) o des del pas 4 de l'editor (botó **Proposta segons el
perfil**), l'aplicació ofereix la proposta corresponent i, un cop validada, la
carrega al pla.

Cal tenir clares tres coses:

| La plantilla **és** | La plantilla **no és** |
|---|---|
| Un punt de partida per no començar des de zero | Una prescripció ni un diagnòstic |
| Una selecció argumentada i amb fonts | Un llistat exhaustiu de tot el que es pot fer |
| Editable abans i després de carregar-la | Res que entri al pla sense validació docent |

La decisió sobre quines mesures s'apliquen és sempre de l'equip docent, a partir
de l'avaluació psicopedagògica, del context del centre i de la situació concreta
de l'alumne/a.

### Perfils mixtos

**No hi ha plantilles combinades predefinides.** Quan un alumne/a té més d'un
perfil, la proposta és la **suma** de les mesures de cada plantilla, sense
duplicats. Si una mesura surt a més d'una plantilla:

- se'n mostra una sola fila, amb la llista dels perfils d'on prové;
- si és de **nucli** en qualsevol d'elles, queda com a nucli.

Aquest disseny és deliberat: el nombre de combinacions possibles de setze
perfils és inabastable, i qualsevol combinació predefinida seria menys precisa
que la suma de les parts més el criteri del professional.

---

## 2. On viuen les dades

| Fitxer | Què és |
|---|---|
| `data/perfils.json` | **Font de veritat.** Les plantilles, editables a mà. |
| `tools/build.py` | Valida les plantilles i les incrusta dins de `dist/pi-eso.html`. |
| `dist/pi-eso.html` | L'aplicació. Conté una còpia generada entre els marcadors `PERFILS-INICI` i `PERFILS-FI`. |

Igual que amb el banc de mesures, l'aplicació és un únic fitxer HTML pensat per
obrir-se des del disc (protocol `file://`), i per això les dades s'hi han
d'incrustar.

### Flux de treball

```
1. editeu    data/perfils.json
2. executeu  python -m tools.build
3. obriu     dist/pi-eso.html
```

L'script **valida abans d'escriure**. Si troba cap error no toca l'HTML i us diu
exactament quin perfil i quin camp cal corregir. No editeu mai a mà el bloc
delimitat pels marcadors dins de `dist/pi-eso.html`: la següent construcció el
sobreescriurà.

---

## 3. Estructura del fitxer

```json
{
 "versio": "1.0",
 "base": {
  "titol": "Base universal comuna",
  "resum": "…",
  "evidencia": "…",
  "mesures": [{"id": "U-DUA-01", "prioritat": "nucli"}]
 },
 "perfils": [
  {
   "perfil": "TDAH",
   "nom": "Trastorn per dèficit d'atenció amb o sense hiperactivitat",
   "resum": "…",
   "evidencia": "…",
   "mesures": [
    {"id": "AD01", "prioritat": "nucli"},
    {"id": "U-PER-13", "prioritat": "complementari"}
   ]
  }
 ]
}
```

### El bloc `base`

Mesures universals que sostenen qualsevol PI, sigui quin sigui el perfil. A la
finestra de proposta s'hi poden incloure o treure amb una casella. Responen al
principi del Decret 150/2017 segons el qual les mesures universals són la
primera resposta i les addicionals i intensives només s'hi afegeixen quan les
universals no són suficients.

### Camps de cada plantilla

| Camp | Obligatori | Descripció |
|---|---|---|
| `perfil` | sí | Ha de coincidir **literalment** amb un valor de la llista `PERFILS` de l'aplicació. |
| `nom` | sí | Nom complet del perfil, que es mostra al desplegable explicatiu de la finestra. |
| `resum` | sí | Dues o tres frases sobre quin és l'eix de la resposta educativa. És el que llegeix el docent per entendre per què es proposa això i no una altra cosa. |
| `evidencia` | sí | Fonts que sostenen la selecció: normativa, guies de pràctica clínica, revisions sistemàtiques i meta-anàlisis. Es mostra al peu del desplegable. |
| `mesures` | sí | Llista d'`{id, prioritat}`. |

### Prioritats

| Valor | Efecte a la finestra |
|---|---|
| `nucli` | La mesura arriba **marcada**. És el conjunt que es proposa d'entrada. |
| `complementari` | La mesura es mostra **desmarcada**. És pertinent, però depèn del cas. |

Cada plantilla ha de tenir com a mínim una mesura de `nucli`; altrament la
proposta arribaria buida i l'script ho rebutja.

**Els suports intensius mai no arriben marcats**, encara que la plantilla els
posi com a nucli: l'aplicació els desmarca sempre perquè requereixen l'informe
de reconeixement de necessitats específiques de suport educatiu elaborat per
l'EAP i la resolució corresponent (Decret 150/2017, articles 10 i 11).

---

## 4. Com tria la destinació de cada mesura

Per defecte tota mesura es proposa com a **transversal** («Totes les matèries
del PI»). L'excepció: si al banc la mesura està limitada a matèries concretes
(camp `materies`) i **només una** d'aquestes és al pla, es proposa directament
per a aquella matèria. Per exemple, *Puntuació separada de procediment i càlcul*
val per a Matemàtiques, Física i Química i Tecnologia; si al pla només hi ha
Matemàtiques, s'hi assigna sola.

El docent pot canviar la destinació de cada fila abans de carregar-la, i també
després, des de la mateixa fitxa de la mesura al pas 4.

---

## 5. Criteris seguits en la selecció

Les plantilles s'han construït amb aquests criteris:

1. **Prioritat a les mesures universals.** Una plantilla que comencés per les
   addicionals invertiria la lògica del Decret 150/2017.
2. **Mesures d'aula abans que mesures de recurs.** Es prioritza el que el
   professorat pot aplicar dins de l'aula ordinària; els suports que depenen de
   recursos externs o de resolució administrativa hi consten com a
   complementaris.
3. **Accés separat de nivell d'exigència.** Les mesures d'accés (format,
   temps, canal de resposta) no rebaixen els criteris d'avaluació. Quan cal
   ajustar el nivell, això es fa al pas 5 i converteix el pla en curricular.
4. **Nombre contingut.** Entre cinc i nou mesures de nucli per perfil. Un pla
   amb trenta mesures no s'aplica; un pla amb sis, sí.
5. **Fonts explícites.** Cada plantilla cita normativa i literatura de
   referència (guies NICE, revisions del What Works Clearinghouse i de l'IES,
   meta-anàlisis publicades i documents del Departament d'Educació), de manera
   que la proposta es pugui discutir professionalment i no s'hagi d'acceptar
   per autoritat.

---

## 6. Com editar o ampliar una plantilla

1. Obriu `data/perfils.json`.
2. Localitzeu el perfil i afegiu o traieu entrades de `mesures`. Els `id` han
   d'existir a `data/banc-mesures.json`.
3. Si la mesura que voleu no és al banc, afegiu-la-hi primer seguint
   `docs/dades/banc-mesures.md` i executeu `python -m tools.build`.
4. Ajusteu `resum` i `evidencia` si el canvi afecta el raonament.
5. Executeu `python -m tools.build` i comproveu-ne la sortida.

L'script avisa (sense aturar-se) de dues coses útils per al manteniment:

- perfils de l'aplicació que encara no tenen plantilla;
- mesures del banc que no surten a cap plantilla. Algunes hi són legítimament
  (mesures d'organització de centre que no depenen del perfil), però la llista
  ajuda a detectar oblits.

### Afegir un perfil nou

Cal fer-ho en dos llocs, per ordre:

1. Afegiu el perfil a la constant `PERFILS` de `dist/pi-eso.html`.
2. Afegiu-hi la plantilla a `data/perfils.json` i executeu l'script.

Sense el primer pas, l'script rebutja la plantilla perquè el perfil no existeix
a l'aplicació.

---

## 7. Fonts

Les fonts concretes de cada plantilla consten al camp `evidencia` del perfil
corresponent. El marc normatiu comú és:

- **Decret 150/2017**, de 17 d'octubre, de l'atenció educativa a l'alumnat en el
  marc d'un sistema educatiu inclusiu.
- **Decret 175/2022**, de 27 de setembre, d'ordenació dels ensenyaments de
  l'educació bàsica.
- Departament d'Educació, *Mesures i suports universals en el centre educatiu*
  (1a edició, setembre de 2023) i taules de mesures i suports universals,
  addicionals i intensius.
- CAST (2018), *Universal Design for Learning Guidelines*, versió 2.2.
