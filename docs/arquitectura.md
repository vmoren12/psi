# Arquitectura

## En una frase

Un sol fitxer HTML autònom, escrit com un projecte partit en mòduls i cosit
per un pas de construcció en Python, amb totes les dades de l'usuari al seu
propi navegador. Es distribueix de dues maneres —baixant-lo o obrint-lo a una
adreça— i cap de les dues envia res a cap servidor.

## La restricció que ho explica tot

L'aplicació l'ha de poder fer servir un orientador o una orientadora d'un
centre educatiu **sense demanar permís a ningú**: sense instal·lar res, sense
un servidor del Departament, sense un compte, i sovint sense connexió fiable.
Això vol dir obrir un fitxer des del disc, protocol `file://`.

En aquest context el navegador aplica les regles més estrictes que té:

- els **mòduls ES** (`import` / `export`) estan bloquejats,
- **`fetch()` de fitxers locals** està bloquejat,
- qualsevol càrrega de fitxers del costat es tracta com a origen creuat.

De manera que tot —estils, codi, currículum sencer, catàleg de mesures— ha
d'estar dins d'un únic document. Aquesta és l'arrel de gairebé totes les
decisions que segueixen. Vegeu [`adr/0001-fitxer-unic.md`](adr/0001-fitxer-unic.md).

## Com se separa el que es distribueix del que s'escriu

```
 src/index.html ──┐
 src/styles/*.css ├──►  tools/build.py  ──►  dist/pi-eso.html
 src/app/*.js  ───┤                                  │
 data/*.json   ───┘                                  ▼
                                          es baixa i es fa doble clic
```

`tools/build.py` no minimitza res, no transpila res i no té dependències.
Només concatena en l'ordre que declara i substitueix quatre marques. Les
marques són comentaris vàlids del llenguatge on viuen
(`/* <<<INSERTA: estils>>> */`), de manera que **cada fitxer de `src/` es pot
obrir i llegir tal com és**, sense passar per la construcció.

La construcció és **determinista**: dues execucions de les mateixes fonts
donen un fitxer idèntic byte a byte. És el que permet comprovar per suma de
verificació que un fitxer que corre en un centre correspon a una versió
publicada. Ho comprova
[`tests/test_construccio.py`](../tests/test_construccio.py).

## Els estils

18 fulls a `src/styles/`, concatenats en l'ordre que declara `build.ESTILS`.
L'ordre és la cascada, i per tant és significatiu: primer els testimonis de
color i tipografia (`01-tokens.css`), després la base i l'estructura, després
cada zona de la interfície, i **al final** `18-adaptatiu.css`, que ha de poder
sobreescriure qualsevol regla anterior a pantalla petita.

No hi ha preprocessador. Els testimonis són propietats personalitzades de CSS
i la paleta sencera cap en catorze línies.

## El codi

33 mòduls a `src/app/`, concatenats dins d'**un únic `<script>` clàssic**.
Comparteixen, doncs, **un sol àmbit global**, i això té dues conseqüències que
convé tenir presents abans de tocar res:

1. **L'ordre de `build.APLICACIO` és part del contracte.** Dades i vocabularis
   primer, després l'estat i la infraestructura, després les vistes, i
   `99-arrencada.js` sempre l'últim, perquè és l'únic que toca el DOM en
   carregar.
2. **Cap nom no es pot repetir entre mòduls.** El segon guanyaria en silenci.
   Hi ha una prova que ho impedeix.

La interfície es pinta component cadenes d'HTML i assignant-les a
`innerHTML`, i els esdeveniments van en atributs `onclick` d'aquestes cadenes.
És un estil que cap eina de JavaScript no sap comprovar: si algú canvia el nom
d'una funció que només es crida des d'un atribut, no ho detecta ni el
navegador fins que algú clica. Per això
[`tests/test_aplicacio.py`](../tests/test_aplicacio.py) recull tots els
identificadors invocats des d'atributs `on…=` i comprova que cadascun estigui
declarat. És la xarxa de seguretat que fa que la separació en mòduls sigui
segura.

### Ordre dels mòduls

| Blocs | Què hi ha |
|---|---|
| `01`–`03` | Currículum, banc de mesures, banc d'estratègies i plantilles de perfil: dades i vocabularis. |
| `04`–`08` | Estat, persistència, utilitats, navegació, diàlegs i logotips del centre. |
| `09` | La versió web: manifest, service worker i botó de descàrrega. Amb `file://` no fa res. |
| `10`–`14` | Vistes de tauler, alumnat, banc, explorador del currículum i secció d'estratègies. |
| `20`–`31` | Editor del pla, un mòdul per pas del model oficial. |
| `40`–`62` | Seguiment, generació del document, còpies de seguretat i importació. |
| `99` | Arrencada. |

L'editor del pla és la part gran, i per això és l'única que es parteix per
passos. El pas 5 —adaptació d'elements curriculars— ocupa tres mòduls perquè
és on hi ha la lògica real del projecte: prendre criteris d'avaluació i sabers
d'un nivell anterior, seguir-los entre matèries i saber quan això converteix
el pla en curricular.

## Les dues formes de distribució

El mateix artefacte es reparteix de dues maneres, i la segona és una capa
damunt de la primera, no una variant:

```
                          dist/pi-eso.html
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
      es baixa i s'obre                    tools/pagines.py  +  web/
      amb doble clic                                 │
      (protocol file://)                             ▼
                                              _site/index.html
                                        GitHub Pages · instal·lable
```

`_site/index.html` **és** `dist/pi-eso.html`, byte a byte; `tools/pagines.py`
no el toca. El que hi afegeix són les peces que un fitxer únic no pot portar a
dins perquè el navegador les exigeix com a fitxers separats: el manifest, el
service worker i les icones d'instal·lació, que viuen a `web/`.

La frontera entre les dues formes la manté un sol mòdul,
`src/app/09-versio-web.js`. Comprova el protocol i, amb `file://`, no fa
absolutament res: **el document baixat no conté cap referència a fitxers que
no tindrà al costat**. Per això els enllaços al manifest i a la icona d'inici
s'injecten en temps d'execució en comptes d'anar a `src/index.html`; si hi
anessin, la còpia oberta des d'un llapis de memòria buscaria fitxers
inexistents i ompliria la consola d'errors.

[`tests/test_versio_web.py`](../tests/test_versio_web.py) vigila aquesta
frontera als dos sentits: que el fitxer únic no referenciï res del servidor, i
que el service worker no enviï res enlloc.

La publicació la fa
[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) a cada canvi a
`main`, i s'atura si `dist/` no correspon a les fonts: l'adreça pública i el
fitxer del dipòsit no poden divergir. Vegeu
[`adr/0006-versio-web-i-pwa.md`](adr/0006-versio-web-i-pwa.md).

## Les dades

`data/` és la font de veritat. Res del que hi ha a `dist/` s'edita a mà.

| Fitxer | Origen |
|---|---|
| `curriculum-eso.json` | Extret de l'annex 3 del Decret 175/2022. |
| `curriculum-primaria.json` | Extret de l'annex 2 del Decret 175/2022. |
| `equivalencies-primaria.json` | Escrit a mà: matèria d'ESO → àrea de primària. |
| `banc-mesures.json` | Escrit a mà a partir del Decret 150/2017 i les taules del Departament. |
| `estrategies.json` | Escrit a mà: frases breus de pràctica docent per perfil, sense cobertura normativa. |
| `perfils.json` | Escrit a mà: quines mesures proposa cada perfil. |
| `annex3-glifs.json` | Taula de glifs reconstruïda; permet repetir l'extracció sense les fonts Arial. |

L'extracció dels PDF del DOGC **no és trivial**: les fonts hi van incrustades
com a subconjunts amb una taula `ToUnicode` incompleta, i el text surt
corromput de maneres discretes («rebutMar» per «rebutjar»). Els extractors de
`tools/extraccio/` reconstrueixen la taula sencera i verifiquen les entrades
que el PDF sí que porta abans de llegir res. Vegeu
[`docs/dades/curriculum-eso.md`](dades/curriculum-eso.md).

Res d'això s'executa a la construcció habitual: els extractors només es fan
servir quan canvia la normativa.

## La validació

`tools/valida.py` és una biblioteca de comprovacions sobre `data/`, sense
efectes secundaris: cada funció retorna una llista d'errors i no escriu res.
La fan servir tant la construcció (que s'atura si en troba cap) com les proves.

No són comprovacions cosmètiques. El que hi ha a `data/` acaba, literalment,
dins d'un document que un centre signa i lliura a una família: una mesura
sense concreció, un criteri amb el codi fora de seqüència o un perfil que
remet a una mesura inexistent són text equivocat en un document oficial.

Un detall que val la pena: el vocabulari de perfils viu al **codi**
(`src/app/01-referencies.js`), no a `data/`, perquè cada perfil també canvia
la interfície. El validador el llegeix d'allà amb una expressió regular en
comptes de mantenir-ne una còpia, precisament perquè les dues llistes no
puguin divergir en silenci.

## L'estat i la persistència

| Clau | Què hi ha |
|---|---|
| `pi-eso-v1` | Alumnat, plans, seguiments i mesures pròpies del centre. |
| `pi-eso-ui` | Preferències d'aquest navegador (requadres plegats, avís amagat). |
| `pi-eso-capsalera` | Si la impressió ha de portar la capçalera del navegador. |
| `pi-eso-copia` | Configuració de la còpia automàtica. |
| `pi-eso-historial` (IndexedDB) | Fins a 10 instantànies internes recents. |

Les preferències d'interfície es guarden **separades** de les dades del
centre a propòsit: no han d'anar a la còpia de seguretat ni viatjar amb els
plans d'un dispositiu a un altre.

Els objectes de pla porten número de versió i passen per `migraPi()` en
carregar-se, de manera que un pla desat amb una versió anterior de
l'aplicació segueix obrint-se.

## Què no fa l'aplicació

No fa cap petició de xarxa amb dades. No hi ha `fetch`, ni `XMLHttpRequest`,
ni `sendBeacon`, ni WebSocket, i hi ha una prova que ho impedeix. L'única cosa
que el document baixa d'Internet són els tipus de lletra de Google, que estan
pensats per fallar de manera benigna: sense connexió, el navegador cau a la
font del sistema i l'aplicació segueix sent utilitzable.

A la versió publicada el service worker sí que veu passar les peticions, però
no en pot originar cap de nova: només respon amb el que ja s'ha baixat, i el
que guarda és l'aplicació i els tipus de lletra. No té accés a `localStorage`
ni a `IndexedDB`, que és on són els plans.

Vegeu [`privadesa.md`](privadesa.md) i
[`adr/0002-dades-al-navegador.md`](adr/0002-dades-al-navegador.md).
