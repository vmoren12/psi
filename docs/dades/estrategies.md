# Banc d'estratègies metodològiques

Aquest document explica com està construït el **banc de frases breus** que
encapçala els resultats del banc de mesures i com ampliar-lo o corregir-lo.

---

## 1. Què és i per què va a part del catàleg de mesures

El catàleg de `data/banc-mesures.json` és normatiu: cada mesura porta
intensitat (Decret 150/2017), bloc, eix i font, i la seva concreció és un
paràgraf redactat per entrar al document del pla.

Aquest banc és una altra cosa. Són **frases curtes i directes** d'ús comú a
l'aula —«Donar instruccions clares, curtes i d'una sola idea cada vegada», «Ús
de l'agenda amb seguiment diari per part del tutor/a»— que **no provenen de cap
norma**: surten de la pràctica docent i de l'evidència sobre què funciona amb
cada perfil de necessitats. Són el que se sol necessitar per començar a
escriure, abans d'arribar al llenguatge del decret.

| El banc d'estratègies **és** | El banc d'estratègies **no és** |
|---|---|
| Frases breus per posar en marxa la redacció | Una llista de mesures amb cobertura normativa |
| Pràctica docent i evidència | Un text que es pugui citar davant d'una inspecció |
| Editable sencer pel centre | Un vocabulari tancat |

Per aquest motiu les dues coses van a fitxers diferents, es validen amb regles
diferents i es mostren en seccions separades.

---

## 2. On viuen les dades

| Fitxer | Què és |
|---|---|
| `data/estrategies.json` | **Font de veritat.** El banc complet, editable a mà. |
| `tools/build.py` | Valida el banc i l'incrusta dins de `dist/pi-eso.html`. |
| `src/app/02-banc-mesures.js` | Hi rep el bloc generat, entre els marcadors `ESTRATEGIES-INICI` i `ESTRATEGIES-FI`. |
| `src/app/14-estrategies.js` | La secció del banc, l'editor i el pas al pla. |

### Flux de treball

```
1. editeu    data/estrategies.json
2. executeu  python -m tools.build
3. obriu     dist/pi-eso.html
```

Com amb el catàleg de mesures, la construcció **valida abans d'escriure**: si
troba cap error no toca l'HTML i diu quina frase i quin camp cal corregir.

---

## 3. Estructura d'una estratègia

```json
{
 "id": "E-CON-01",
 "text": "Donar instruccions clares, curtes i d'una sola idea cada vegada",
 "categoria": "Instruccions i consignes",
 "perfils": ["TDAH", "Discapacitat intel·lectual", "TEL/TDL", "Alumne/a nouvingut"]
}
```

| Camp | Obligatori | Descripció |
|---|---|---|
| `id` | sí | Identificador únic i estable. **No el canvieu mai** un cop publicat: els plans ja desats hi fan referència. Forma `E-XXX-nn`, on `XXX` és el codi de la categoria. |
| `text` | sí | La frase. **Màxim 110 caràcters**, i és el text que entra al pla tal com és. |
| `categoria` | sí | Una de les declarades a `vocabulari.categories`. Vegeu l'apartat 4. |
| `perfils` | sí | Perfils als quals la frase és especialment pertinent. **Llista buida = surt sempre.** Han de coincidir literalment amb la constant `PERFILS` de `src/app/01-referencies.js`. |

El límit de 110 caràcters no és estètic. Aquest banc serveix per llegir-ne
moltes d'una ullada; una frase que necessita explicació és una mesura, i el seu
lloc és `banc-mesures.json`. La construcció rebutja les que el superen.

---

## 4. Categories

L'ordre d'aquesta llista és l'ordre en què surten al banc i al selector de
categoria.

| Categoria | Codi |
|---|---|
| Atenció i concentració | `ATE` |
| Instruccions i consignes | `CON` |
| Planificació i organització | `PLA` |
| Gestió del temps i ritme de treball | `TEM` |
| Lectura i comprensió de textos | `LEC` |
| Escriptura i expressió escrita | `ESC` |
| Matemàtiques i raonament | `MAT` |
| Llengua i comunicació | `LLE` |
| Estratègies d'aprenentatge i memòria | `APR` |
| Autonomia i autoregulació | `AUT` |
| Regulació emocional | `EMO` |
| Conducta i convivència | `CNV` |
| Relació amb els iguals i treball en equip | `SOC` |
| Motivació i implicació | `MOT` |
| Avaluació i proves | `AVA` |
| Aula, entorn i materials | `ENT` |
| Coordinació amb la família | `FAM` |

Una categoria declarada i sense cap frase surt al selector i no filtra res: hi
ha una prova que ho impedeix. A aquestes s'hi suma, només dins de l'aplicació,
**Estratègies pròpies del centre**, que és on van les que escriu el centre.

---

## 5. Com entra una estratègia al pla

En afegir-la des del banc, la frase entra a l'apartat 5 del document com una
mesura més: el text de la frase fa de títol i de redacció, amb intensitat
**Universal** i eix **Metodologia**, que és el que és una estratègia d'aula.
Des del pas 4 es pot canviar tot —la redacció, la matèria, la intensitat i
l'eix— com amb qualsevol altra mesura del pla.

---

## 6. Estratègies pròpies i modificacions del centre

Un centre pot ampliar i corregir el banc **sense tocar cap fitxer**, des de la
mateixa aplicació:

- **Nova estratègia** escriu una frase pròpia, amb identificador `CE-…`. Va a
  la categoria *Estratègies pròpies del centre* si no se n'hi tria cap altra.
- **Edita** damunt d'una frase del banc en desa només **els camps canviats**
  (a `state.estrategiesEdit`), de manera que el banc d'aquest fitxer es pot
  tornar a construir sense perdre res del que hagi fet el centre i qualsevol
  frase es pot tornar a l'original en un clic.
- Tot plegat s'inclou a la còpia de seguretat general i al fitxer
  `mesures-del-centre.json` dels botons **Exporta** i **Importa** del banc.

És el mateix criteri que s'aplica al catàleg de mesures, i per la mateixa raó:
el que publica el projecte ha de poder-se actualitzar sense trepitjar la feina
d'un centre.

---

## 7. Com afegir una estratègia al banc comú

1. Obriu `data/estrategies.json`.
2. Copieu una entrada de la mateixa categoria i modifiqueu-la.
3. Assigneu-li un `id` nou i únic amb el codi de categoria de l'apartat 4.
4. Escriviu la frase **breu i en to d'acció**, tal com es diria a un claustre.
   Ha de dir què es fa, no per què es fa.
5. Marqueu `perfils` només si la frase és especialment pertinent per a algun
   perfil; si val per a tothom, deixeu la llista buida.
6. Executeu `python -m tools.build` i comproveu-ne la sortida.

---

## 8. Fonts

Aquest banc **no cita normativa**, i és intencionat: el seu contingut és
pràctica docent d'aula, recollida de l'ús habitual als centres i de la
literatura sobre atenció a la diversitat. El que sí que té cobertura normativa
és el catàleg de mesures (`docs/dades/banc-mesures.md`), que és on cal anar
quan el pla necessiti sostenir-se en el Decret 150/2017.
