# Currículum d'educació secundària obligatòria

Aquest document explica d'on surt el currículum de l'ESO (annex 3 del Decret
175/2022) que porta l'aplicació de plans de suport individualitzat, com
actualitzar-lo i per què es va haver de tornar a extreure del PDF oficial.

---

## 1. On viuen les dades

| Fitxer | Què és |
|---|---|
| `referencies/curriculum/Annex_3_Secundaria.pdf` | El PDF del DOGC amb l'annex 3 (matèries de l'ESO). És la font oficial. |
| `tools/extraccio/curriculum_eso.py` | Repara les fonts del PDF, en llegeix el text i escriu el JSON. Només cal executar-lo si canvia el PDF o si es troba un error d'extracció. |
| `data/annex3-glifs.json` | Taula de glifs generada un sol cop a partir de les fonts Arial del sistema. Permet repetir l'extracció en una màquina sense l'Arial instal·lada. |
| `data/curriculum-eso.json` | **Font de veritat** del currículum de l'ESO. |
| `tools/build.py` | Valida el JSON i l'incrusta dins de `dist/pi-eso.html`. |
| `dist/pi-eso.html` | L'aplicació. Conté una còpia generada del currículum entre els marcadors `CURRICULUM-ESO-INICI` i `CURRICULUM-ESO-FI`. |

Com el currículum de primària i el banc de mesures, el currículum de l'ESO s'ha
d'incrustar dins de l'HTML: l'aplicació és un únic fitxer pensat per obrir-se des
del disc (`file://`) i els navegadors hi bloquegen la lectura de fitxers JSON
externs.

### Flux de treball

```
1. (només si cal reextreure)  python -m tools.extraccio.curriculum_eso
2. executeu                   python -m tools.build
3. obriu                      dist/pi-eso.html
```

Tots dos scripts **validen abans d'escriure**: si troben cap error no toquen res
i diuen exactament què cal corregir. No editeu mai a mà el bloc delimitat pels
marcadors dins de `dist/pi-eso.html`: la construcció següent el sobreescriurà.

---

## 2. Estructura de `curriculum-eso.json`

```json
{
 "font": "Decret 175/2022 …, annex 3",
 "etapa": "ESO",
 "materies": [
  {"nom": "Física i Química",
   "cursos": "1r a 3r i 4t",
   "tipus": "comuna",
   "ce": [
    {"n": 1,
     "desc": "Interpretar fenòmens de la naturalesa, predient i argumentant-ne …",
     "grups": [
      {"curs": "1r, 2n i 3r", "items": [{"c": "1.1", "t": "Analitzar conceptes …"}]},
      {"curs": "4t", "items": [{"c": "1.1", "t": "Analitzar conceptes …"}]}
     ]}
   ],
   "sabers": [
    {"curs": "Primer, segon i tercer curs",
     "temes": [{"tema": "La matèria", "items": [{"t": "Aplicació del model cinètic …"}]}]}
   ]},
  {"nom": "Aranès i Literatura a l’Aran", "ref": "Llengua Catalana i Literatura"}
 ]
}
```

* Dins de `dist/pi-eso.html` s'hi incrusta només la llista `materies`, que és la forma
  que espera el codi de l'aplicació a `#curriculum-data`.
* `ref` marca les matèries que comparteixen currículum amb una altra: l'annex 3
  presenta Aranès i Literatura a l'Aran, Llengua Castellana i Literatura i
  Llengua Catalana i Literatura amb un text únic.
* `cursos` i `tipus` (`comuna`, `optativa`, `opció 4t`) no surten del text de
  l'annex: descriuen on es cursa la matèria i estan escrits a mà dins de
  l'script, a la taula `MATERIES`.
* `curs` de cada grup de criteris és l'etiqueta de la columna del decret
  (`1r i 2n`, `1r, 2n i 3r`, `4t`, `Expressió Artística (4t)`…). Les matèries
  d'un sol bloc, que el decret publica sense taula, porten l'etiqueta que hi ha
  a la mateixa taula `MATERIES`.

Contingut actual: **25 matèries** (23 amb text propi), **143 competències
específiques**, **654 criteris d'avaluació** i **1.080 sabers**.

---

## 3. Sobre l'extracció del PDF

### El problema de les fonts

El PDF del DOGC incrusta les Arial com a subconjunts `Identity-H` amb una taula
`/ToUnicode` **incompleta**: de l'Arial negreta només hi ha 42 glifs mapats. Quan
un extractor troba un glif que no hi és, escriu el número de glif en comptes de
la lletra. El resultat és text que sembla correcte però que porta errors molt
discrets:

| Al PDF hi diu | Una extracció ingènua en treu | Glif |
|---|---|---|
| `fent ús` | `fent ~s` | 126 = ú |
| `rebutjar` | `rebutMar` | 77 = j |
| `d’evidències` | `dµevidències` | 181 = comes |
| `psicològica` | `psicolzgica` | 122 = ò |
| `i/o` | `i` + caràcter de control | 18 = / |

Com que els números de glif dels subconjunts coincideixen amb els de l'Arial
completa, `tools/extraccio/curriculum_eso.py` reconstrueix la taula sencera a partir de la
font del sistema (`arial.ttf`, `arialbd.ttf`, `ariali.ttf`), **comprova que les
42 entrades que el PDF sí que porta coincideixen amb les reconstruïdes** i, només
si quadren, reescriu el `/ToUnicode` en memòria i llegeix el text. La taula
resultant es desa a `data/annex3-glifs.json`.

### Les taules de criteris

Els criteris d'avaluació van en taules d'una o dues columnes (una per bloc de
cursos) que continuen a la pàgina següent sense repetir la capçalera. L'script
les detecta **només per les línies dibuixades** (`find_tables(strategy=
"lines_strict")`): amb la detecció per alineació de text, els paràgrafs
explicatius d'Educació Física i d'Educació Plàstica es prenien per taules i
n'entrava prosa al currículum.

Catorze matèries (Filosofia, Economia Bàsica, Tecnologia…) publiquen els criteris
sense taula, com a text seguit. Allà el bloc s'acaba en el primer paràgraf nou
que no comença amb el codi del criteri.

### Altres trampes del decret

* **Talls de ratlla amb guionet.** `reflexionant-|ne` s'uneix sense espai.
* **Pics separats del text.** A l'apartat de sabers, el pic (`-` o `●`) i el text
  sovint són dos fragments diferents a la mateixa alçada; es llegeixen d'esquerra
  a dreta.
* **Dos nivells de blocs.** Els encapçalaments que només agrupen altres
  encapçalaments (Formació i Orientació, Ciències Socials) es concatenen amb
  ` · `, igual que a primària.
* **Codis escrits de dues maneres.** Els criteris solen anar com a `9.2`, però
  Matemàtiques CE9 en numera un com a `9.3.`; el lector accepta les dues formes.
* **Errates del DOGC que es conserven.** Física i Química titula la competència 6
  «Criteris avaluació», Biologia i Geologia 1.3 diu «possible solucions» i vuit
  criteris no acaben en punt. L'script avisa d'aquests casos però no els toca:
  el text ha de ser el que diu el decret.

L'script avisa (no falla) si una competència queda sense descripció o sense
criteris, si els codis surten fora de seqüència o si un criteri sembla tallat.
Actualment només dona els vuit avisos de criteris sense punt final.

---

## 4. Com es desa dins d'un pla

Igual que a primària (vegeu `CURRICULUM-PRIMARIA.md`, secció 5). Les claus dels
criteris són `matèria|codi|curs`: **no depenen del text**, de manera que els
plans desats abans d'aquesta reextracció conserven els criteris triats encara que
el text del criteri hagi canviat. Els sabers, en canvi, es desen pel text: els
sabers triats d'una matèria on el text s'hagi corregit s'han de tornar a marcar.

---

## 5. Base normativa

* Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació
  bàsica (DOGC núm. 8762, 29.9.2022), annex 3: matèries d'educació secundària
  obligatòria.
* Article 25 del mateix decret: l'alumnat amb PI s'avalua d'acord amb els
  criteris que s'hi estableixen, cosa que en cap cas pot suposar una limitació en
  les seves qualificacions.
