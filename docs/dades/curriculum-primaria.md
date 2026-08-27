# Currículum d'educació primària

Aquest document explica com entra el currículum d'educació primària (annex 2 del
Decret 175/2022) dins de l'aplicació de plans de suport individualitzat, per què
hi és i com actualitzar-lo o corregir-lo.

---

## 1. Per què hi és

Un PI pot haver d'ajustar els criteris d'avaluació d'una matèria a un nivell
inferior, fins i tot als d'una àrea d'educació primària. Fins ara l'aplicació
només portava l'annex 3 (matèries de l'ESO) i el docent havia de transcriure a
mà els criteris de primària al camp de criteris personalitzats.

Amb el currículum de primària incorporat, cada franja de matèria del **pas 5**
té un interruptor **Primària** que hi carrega el currículum de l'àrea anàloga.
A partir d'aquí:

* els criteris, les competències específiques i els sabers de les dues etapes
  **es poden combinar** dins de la mateixa matèria;
* cada element queda identificat amb **l'etapa i el curs** d'on prové, tant a
  l'editor com al document imprès (columna «Etapa i curs»);
* **fer servir qualsevol element d'un nivell inferior converteix el pla en
  curricular**, automàticament, tal com fa qualsevol altra adaptació de
  criteris.

L'aplicació **pregunta sempre al docent** quan hi ha cap dubte:

| Situació | Què fa l'aplicació |
|---|---|
| Correspondència directa (Matemàtiques → Matemàtiques) i l'àrea no s'ha carregat en cap altra matèria del pla | Carrega l'àrea directament i ho avisa amb un missatge. |
| Correspondència parcial (Biologia i Geologia → Coneixement del Medi) | Obre un diàleg amb la nota explicativa i espera la confirmació. |
| Més d'una àrea possible | Obre el diàleg amb totes les opcions. |
| La mateixa àrea ja carregada en una altra matèria del pla (solapament) | Obre el diàleg i avisa a quines matèries ja hi és. |
| La matèria no té àrea anàloga (Cultura Clàssica, Àmbit, Optativa…) | Obre el diàleg perquè el docent triï a mà qualsevol de les 10 àrees. |
| Es vol treure una àrea amb elements ja triats | Demana confirmació abans de treure'ls del pla. |

---

## 2. On viuen les dades

| Fitxer | Què és |
|---|---|
| `referencies/curriculum/curriculum-basica-decret-175-2022.pdf` | El PDF del DOGC amb el Decret 175/2022 sencer (annexos 1 a 7). |
| `tools/extraccio/curriculum_primaria.py` | Extreu l'annex 2 del PDF i escriu el JSON. Només cal executar-lo si es canvia el PDF o si es troba un error d'extracció. |
| `data/curriculum-primaria.json` | **Font de veritat** del currículum de primària. |
| `data/equivalencies-primaria.json` | **Font de veritat** de la correspondència matèria de l'ESO → àrea de primària. S'edita a mà. |
| `tools/build.py` | Valida les dues coses i les incrusta dins de `dist/pi-eso.html`. |
| `docs/dades/curriculum-eso.md` | El mateix, per al currículum de l'ESO (annex 3), que té la seva pròpia parella d'scripts. |
| `dist/pi-eso.html` | L'aplicació. Conté una còpia generada del currículum entre els marcadors `CURRICULUM-PRIMARIA-INICI` i `CURRICULUM-PRIMARIA-FI`. |

Com el banc de mesures, el currículum s'ha d'incrustar dins de l'HTML: l'aplicació
és un únic fitxer pensat per obrir-se des del disc (`file://`) i els navegadors
hi bloquegen la lectura de fitxers JSON externs.

### Flux de treball

```
1. (només si cal reextreure)  python -m tools.extraccio.curriculum_primaria
2. editeu si convé            data/equivalencies-primaria.json
3. executeu                   python -m tools.build
4. obriu                      dist/pi-eso.html
```

Els dos scripts **validen abans d'escriure**: si troben cap error no toquen
res i diuen exactament què cal corregir. No editeu mai a mà el bloc delimitat
pels marcadors dins de `dist/pi-eso.html`: la construcció següent el sobreescriurà.

---

## 3. Estructura de `curriculum-primaria.json`

És la mateixa forma que ja tenia el currículum de l'ESO dins de l'aplicació, de
manera que la interfície pinta les dues etapes amb el mateix codi.

```json
{
 "font": "Decret 175/2022 …, annex 2",
 "etapa": "Primària",
 "cicles": ["1r i 2n", "3r i 4t", "5è i 6è"],
 "arees": [
  {"nom": "Matemàtiques",
   "cursos": "1r a 6è de primària",
   "etapa": "Primària",
   "ce": [
    {"n": 1,
     "desc": "Traduir problemes i interpretar situacions quotidianes …",
     "grups": [
      {"curs": "1r i 2n", "items": [{"c": "1.1", "t": "Iniciar-se en la interpretació …"}]}
     ]}
   ],
   "sabers": [
    {"curs": "1r i 2n",
     "temes": [{"tema": "Sentit numèric · Comptatge", "items": [{"t": "Ús d'estratègies …"}]}]}
   ]},
  {"nom": "Llengua Castellana i Literatura", "ref": "Llengua Catalana i Literatura", "etapa": "Primària"}
 ]
}
```

* `ref` marca les àrees que comparteixen currículum amb una altra (les àrees
  lingüístiques de l'annex 2 comparteixen text), igual que a l'annex 3.
* `curs` de cada grup de criteris és el **cicle** (`1r i 2n`, `3r i 4t`,
  `5è i 6è`). Educació en Valors Cívics i Ètics fa servir `5è o 6è` i Segona
  Llengua Estrangera, `tota l'etapa`, perquè així ho estableix el decret.

Contingut actual: **10 àrees** (8 amb text propi), **61 competències
específiques**, **418 criteris d'avaluació** i **958 sabers**.

---

## 4. Estructura de `equivalencies-primaria.json`

```json
"Biologia i Geologia": [
 {"area": "Coneixement del Medi Natural, Social i Cultural",
  "relacio": "parcial",
  "nota": "A primària els sabers de biologia i geologia són dins el bloc de cultura científica…"}
]
```

| Camp | Obligatori | Descripció |
|---|---|---|
| `area` | sí | Nom exacte d'una àrea de `curriculum-primaria.json`. |
| `relacio` | sí | `directa` (la matèria és la continuïtat de la mateixa àrea) o `parcial` (l'àrea només en cobreix una part). |
| `nota` | sí si és `parcial` | Explicació que es mostra al docent al diàleg de confirmació. |

Les matèries que no hi consten no tenen àrea anàloga: el docent hi pot carregar
igualment qualsevol àrea triant-la a mà. Una matèria pot tenir-ne més d'una
(Robòtica i Programació proposa Coneixement del Medi i Matemàtiques); en aquest
cas l'aplicació sempre pregunta.

---

## 5. Com es desa dins d'un pla

Dins de cada matèria del pla (`p.curr[matèria]`):

| Camp | Què hi ha |
|---|---|
| `prim` | Àrees de primària carregades en aquesta matèria, per nom. |
| `criteris` | Claus `font\|codi\|curs`. La font és el nom de la matèria (ESO) o `Primària · <àrea>`. |
| `adapt`, `accions` | Mapes indexats per la mateixa clau de criteri. |
| `adaptCE` | Competències adaptades: la clau és el número (`"3"`) a l'ESO i `Primària · <àrea>#3` a primària. |
| `sabers` | Text dels sabers triats, de qualsevol etapa. |
| `etapa` | Text lliure de la casella «Etapa i curs del criteri d'avaluació». L'aplicació en proposa el valor a partir del que s'ha triat. |

El prefix `Primària · ` a la font és el que evita que els codis d'avaluació de
les dues etapes (tots dos comencen per `1.1`) es trepitgin.

**Compatibilitat.** Les claus de l'ESO no han canviat i el camp `prim` s'afegeix
buit als plans desats amb versions anteriors (`currDe()`, cridada des de
`migraPi()`). Els plans antics es carreguen i s'exporten sense cap pas
addicional.

---

## 6. Sobre l'extracció del PDF

`extreu-curriculum-primaria.py` no fa una lectura de text pla, perquè el PDF del
DOGC té dues trampes:

1. **Els encapçalaments en negreta són il·legibles.** El subconjunt d'Arial
   negreta incrustat al PDF té la taula ToUnicode incompleta i el text surt com
   ara `traYps` en lloc de `través`. Per a aquesta font, `gid = codi ASCII − 29`,
   i la resta de glifs es resolen amb la taula `GLIFS`.

   `extreu-curriculum-eso.py` resol el mateix problema d'una altra manera, més
   general: reconstrueix la taula ToUnicode sencera a partir de l'Arial del
   sistema. El currículum de primària s'ha comprovat contra
   `referencies/curriculum/Annex_2_Primaria.pdf` llegit amb aquest segon mètode i les 61
   descripcions de competències i els 418 criteris hi coincideixen.
2. **Els criteris d'avaluació van en tres columnes** (una per cicle) que
   qualsevol extracció de text pla barreja. L'script reconstrueix les línies a
   partir de les coordenades de cada caràcter i assigna cada cel·la a la seva
   columna amb les línies verticals de la taula.

L'script avisa (no falla) si detecta codis fora de seqüència, competències sense
criteris, criteris que semblen tallats o blocs de sabers repetits. Actualment no
en dona cap.

---

## 7. Base normativa

* Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de l'educació
  bàsica (DOGC núm. 8762, 29.9.2022): annex 2 (àrees d'educació primària),
  annex 3 (matèries d'ESO) i annex 4 (competències transversals).
* Article 25 del mateix decret: l'alumnat amb PI s'avalua d'acord amb els
  criteris que s'hi estableixen, cosa que en cap cas pot suposar una limitació
  en les seves qualificacions.
* Decret 150/2017, de 17 d'octubre, de l'atenció educativa a l'alumnat en el
  marc d'un sistema educatiu inclusiu.
