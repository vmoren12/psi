# Privadesa i protecció de dades

Un pla de suport individualitzat conté dades personals d'un menor i, sovint,
dades de categoria especial: diagnòstics, informes psicopedagògics,
circumstàncies familiars. Aquest document explica què fa l'aplicació amb
aquestes dades i què no en fa.

> Aquest text descriu el comportament tècnic de l'eina. **No és
> assessorament jurídic** ni substitueix el criteri del centre ni el del seu
> delegat o delegada de protecció de dades.

## Què fa l'aplicació

**Res surt del dispositiu.** Tot es desa a l'emmagatzematge local del
navegador on s'obre el fitxer:

| On | Què |
|---|---|
| `localStorage` | Alumnat, plans, seguiments, mesures pròpies del centre i preferències. |
| `IndexedDB` | Fins a 10 instantànies internes recents, per poder desfer un error. |
| La carpeta de baixades | Només si activeu la còpia automàtica, i sempre al vostre disc. |

No hi ha compte d'usuari. No hi ha analítica, telemetria, galetes de seguiment
ni informes d'errors. L'aplicació **no conté cap crida de xarxa amb dades** —ni
`fetch`, ni `XMLHttpRequest`, ni `sendBeacon`, ni WebSocket— i la suite de
proves ho comprova a cada canvi
([`tests/test_aplicacio.py`](../tests/test_aplicacio.py)).

L'única cosa que el document baixa d'Internet són els **tipus de lletra de
Google Fonts**. Això fa una petició als servidors de Google amb l'adreça IP i
l'agent d'usuari del navegador, sense cap dada de l'aplicació. Si obriu el
fitxer sense connexió, o si el vostre navegador ho bloqueja, l'aplicació
funciona igual amb els tipus de lletra del sistema.

## La versió web

L'aplicació també es publica a una adreça
(<https://vmoren12.github.io/psi/>), i des d'allà es pot instal·lar com a
aplicació del dispositiu. Això **no canvia on van les dades**, però convé
saber exactament què hi ha de diferent.

**El servidor entrega l'aplicació i prou.** El que hi ha publicat és una
pàgina estàtica, pública i igual per a tothom: el mateix `pi-eso.html` que es
baixa del dipòsit, byte a byte. No hi ha base de dades, ni sessió, ni res que
pugui rebre un pla. Els plans continuen vivint al `localStorage` i a
l'`IndexedDB` del navegador, que no viatgen enlloc.

**El que sí que canvia** és el que canvia en visitar qualsevol pàgina web: el
proveïdor de l'allotjament —GitHub, Inc.— veu l'**adreça IP i l'agent
d'usuari** de qui hi entra, als seus registres d'accés. Són dades de connexió
del professional que obre l'eina, no de cap alumne. Qui prefereixi no
generar-les té la còpia baixada, que no en genera cap.

**El service worker** és el que permet tornar a obrir l'aplicació sense
connexió. Guarda al navegador dues coses: l'aplicació i els tipus de lletra.
No té accés a `localStorage` ni a `IndexedDB`, no origina cap petició pròpia i
no envia res enlloc; una prova ho comprova
([`tests/test_versio_web.py`](../tests/test_versio_web.py)).

**Els dos magatzems són independents.** L'emmagatzematge del navegador va
lligat a l'origen: els plans fets a l'adreça web i els fets a la còpia baixada
són conjunts diferents i no es veuen entre ells, igual que no es veuen entre
dos ordinadors. Per traslladar-los, exporteu i importeu la còpia de seguretat.

## Què vol dir això per a un centre

Com que les dades no s'envien enlloc, **no hi ha cap tercer que les tracti**:
no cal encàrrec de tractament amb el desenvolupador ni amb cap proveïdor
d'allotjament. El responsable del tractament és el centre, i l'aplicació és,
a efectes pràctics, un full de càlcul local.

Això no elimina les obligacions del centre. Continuen aplicant-se:

- El **dispositiu** on s'obre l'aplicació ha d'estar xifrat i protegit amb
  contrasenya, com qualsevol equip que tracti dades d'alumnat.
- Les **còpies de seguretat** que exporteu són fitxers JSON en clar amb dades
  personals: tracteu-los com tractaríeu un informe imprès.
- Si compartiu el fitxer `pi-eso.html` entre companys, **compartiu
  l'aplicació, no les dades**: cada navegador té el seu propi
  emmagatzematge. Un pla no viatja amb el fitxer.
- Els **documents impresos o en PDF** que en surten són documentació
  acadèmica del centre i segueixen la política de conservació que li
  correspongui.

## Els riscos reals

El risc d'aquesta arquitectura no és la fuita, és la **pèrdua**:

- **Buidar les dades del navegador esborra els plans.** «Esborrar galetes i
  dades de llocs», el mode de navegació privada, un perfil de navegador que es
  reinicia o una eina de neteja del centre poden fer-ho sense avisar.
- **Cada navegador i cada dispositiu tenen dades diferents.** El que veieu a
  l'ordinador del despatx no hi és al portàtil de casa.
- Alguns navegadors **descarten l'emmagatzematge local** de llocs `file://`
  quan queden sense espai.

Per això l'aplicació insisteix amb les còpies de seguretat, ofereix còpia
automàtica a la carpeta de baixades i manté un historial intern
d'instantànies. **Feu còpies i deseu-les on desareu la resta de documentació
del centre.**

## Compartir dades entre professionals

La manera prevista és **exportar i importar la còpia de seguretat**, no
compartir el fitxer HTML. La còpia és un JSON: si l'heu d'enviar, feu-ho pels
canals que el centre faci servir per a documentació amb dades personals, no
per correu personal ni per missatgeria.

## Informar d'un problema de seguretat

Vegeu [`SECURITY.md`](../SECURITY.md).
