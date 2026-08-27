# 0002 · Desar les dades només al navegador

**Estat:** vigent · **Data:** 2026-08-27

## Context

Un pla de suport individualitzat conté dades personals d'un menor i, sovint,
dades de categoria especial: diagnòstics, informes psicopedagògics,
circumstàncies familiars. Qualsevol lloc on aquestes dades es desin fora del
centre converteix qui les hi ha posat en encarregat del tractament, amb tot el
que això comporta.

Un projecte d'ús propi, publicat lliurement per una sola persona, no pot
sostenir aquesta posició. I un centre no pot fer servir una eina que l'hi
obligui sense un contracte.

## Decisió

Les dades es desen **exclusivament** al dispositiu que les genera:

- `localStorage` per a l'alumnat, els plans, els seguiments i les mesures
  pròpies del centre;
- `IndexedDB` per a un historial curt d'instantànies internes;
- la carpeta de baixades de l'usuari per a les còpies de seguretat.

L'aplicació no conté cap crida de xarxa amb dades. Això no és una promesa:
és una prova que atura la integració contínua si algú n'hi introdueix una
(`tests/test_aplicacio.py::test_les_dades_es_desen_nomes_al_navegador`).

## Conseqüències

**A favor**

- El centre és l'únic responsable i no li cal cap encàrrec de tractament.
- No hi ha superfície d'atac remota: no hi ha servidor a comprometre ni base
  de dades a filtrar.
- L'aplicació funciona sense connexió, que és quan sovint es fa servir.

**En contra, i com es mitiga**

El risc deixa de ser la fuita i passa a ser la **pèrdua**. Buidar les dades
del navegador esborra els plans, i pot passar sense avisar: una neteja de
galetes, una eina de manteniment del centre, un perfil que es reinicia.

Per això l'aplicació:

- avisa a la barra lateral que les dades són només d'aquest dispositiu;
- ofereix còpia de seguretat completa, restauració i fusió;
- ofereix còpia automàtica periòdica a la carpeta de baixades;
- manté un historial intern de fins a 10 instantànies, per desfer un error.

La segona conseqüència és que **les dades no se sincronitzen**: el que hi ha a
l'ordinador del despatx no hi és al portàtil de casa. La manera prevista de
moure-les és exportar i importar la còpia, no compartir el fitxer HTML.

Vegeu [`docs/privadesa.md`](../privadesa.md).

## Alternatives descartades

**Base de dades al núvol** (Firebase, Supabase i companyia). Resol la
sincronització i introdueix exactament el problema que l'eina evita.

**Xifratge amb contrasenya de l'usuari.** Afegeix una manera nova de perdre-ho
tot —oblidar la contrasenya— sense protegir contra res que la protecció del
dispositiu no cobreixi millor. La recomanació és xifrar el disc, que és el que
el centre ja hauria de fer.

**File System Access API**, per treballar contra un fitxer de la xarxa del
centre. És interessant i es podria afegir més endavant, però només funciona en
navegadors basats en Chromium i no amb el protocol `file://`.
