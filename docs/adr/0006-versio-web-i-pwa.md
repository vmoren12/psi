# 0006 · Publicar l'aplicació a una adreça, i fer-la instal·lable

**Estat:** vigent · **Data:** 2026-08-27

Complementa [0001](0001-fitxer-unic.md), que no queda substituïda: el fitxer
únic segueix sent la forma principal de distribució.

## Context

[0001](0001-fitxer-unic.md) va decidir distribuir l'aplicació com un sol fitxer
HTML que es baixa i s'obre amb doble clic, i va **descartar explícitament** la
progressive web app amb aquest argument:

> Necessita un origen `https://` per instal·lar-se i un service worker; torna a
> exigir allotjament.

L'argument era correcte i continua sent-ho. El que ha canviat és que ara sabem
què costa el pas que hi ha abans d'obrir el fitxer.

«Baixar un HTML i fer-hi doble clic» és senzill per a qui escriu programari i
**no ho és per a bona part del professorat**. El recorregut real té diverses
maneres de fallar, i totes acaben igual:

- el navegador avisa que el fitxer «pot ser perillós» i cal insistir-hi;
- s'obre amb el bloc de notes o amb un editor, i no amb el navegador;
- acaba a *Baixades* i no es torna a trobar;
- se'n perd l'adreça i, per tornar-hi, cal recordar on era el dipòsit;
- no hi ha manera de dir-li a un company «entra aquí» i que ja funcioni.

El resultat és que l'eina no arriba a qui li serviria, per un obstacle que no
té res a veure amb el problema que resol.

La restricció de fons de [0002](0002-dades-al-navegador.md) —cap dada d'alumnat
en un servidor de tercers— **no obliga a no tenir servidor**. Obliga a no
enviar-hi dades. Servir un fitxer estàtic i públic no n'envia cap.

## Decisió

Publicar **exactament el mateix fitxer** a GitHub Pages, i afegir-hi al damunt
una capa de progressive web app.

Concretament:

1. `dist/pi-eso.html` es publica com a `index.html` del lloc. És el mateix
   fitxer byte a byte, no una variant: qui vulgui pot comprovar-ho per suma de
   verificació. També s'hi publica amb el seu nom, perquè el botó de descàrrega
   i els enllaços del README apuntin a l'artefacte de sempre.
2. El manifest, el service worker i les icones d'instal·lació viuen a `web/` i
   **no entren al fitxer únic**. `tools/pagines.py` els combina amb l'aplicació
   per muntar `_site/`.
3. `src/app/09-versio-web.js` és l'únic mòdul que sap tot això. Comprova el
   protocol i, amb `file://`, no fa res. La còpia baixada no conté cap
   referència a fitxers que no tindrà al costat, i una prova ho vigila.
4. La versió publicada té un botó rodó que no fa cap de les dues coses
   directament: **pregunta**. Instal·lar l'aplicació i baixar el fitxer no són
   equivalents —la primera conserva els plans i s'actualitza sola, la segona
   deixa una còpia buida i congelada— i qui hi clica no té per què saber-ho.
   El diàleg posa les dues opcions amb la diferència escrita al costat.

   L'opció d'instal·lar només és un botó real a Chrome, Edge i Android, que
   són els que disparen `beforeinstallprompt`. Es reté aquest convit i es
   dispara des del nostre diàleg, en comptes de deixar que el navegador
   ensenyi la seva barra automàtica, que apareix quan vol i no explica res.
   Safari i Firefox no tenen API equivalent: allà el diàleg mostra la
   instrucció manual, perquè un botó que no fes res seria pitjor que cap.

L'allotjament és **GitHub Pages** i no un proveïdor especialitzat perquè el
codi ja hi és. L'aplicació i el seu codi font queden a la mateixa adreça, cosa
que en un context on es demana a un centre que confiï en una eina no oficial no
és un detall d'implementació sinó part de l'argument.

## Conseqüències

**A favor**

- S'hi entra amb un enllaç. És el que es pot posar en un correu, en una
  presentació de claustre o en una pissarra.
- Instal·lable: el navegador ofereix afegir-la a l'escriptori o a la pantalla
  d'inici, i llavors té icona pròpia, s'obre sense barra d'adreces i **funciona
  sense connexió**, que és el que buscava el fitxer únic sense el pas de
  baixar-lo.
- Sempre actualitzada. La navegació va primer a la xarxa: qui obri l'enllaç
  amb connexió obté sempre la darrera versió publicada, cosa que en una eina
  que porta currículum i normativa a dins importa.
- El service worker guarda també els tipus de lletra, de manera que sense
  connexió les icones i la tipografia no cauen a la reserva del sistema.

**En contra**

- **Hi ha dos magatzems, no un.** `localStorage` va lligat a l'origen: els
  plans de la versió web i els de la còpia baixada són conjunts diferents i no
  es veuen entre ells. Traslladar-los es fa exportant i important la còpia de
  seguretat, com entre dos dispositius. El botó de descàrrega ho diu abans de
  baixar res, precisament perquè és l'error que es farà.
- **L'adreça passa a ser part de les dades.** Canviar de domini més endavant
  deixaria els plans de tothom a l'origen antic. La decisió de si hi ha domini
  propi s'ha de prendre **abans** de dir-li a ningú que entri, no després.
- El proveïdor veu els registres d'accés: adreça IP i agent d'usuari de qui
  obre el lloc, com qualsevol pàgina web. No hi arriba cap dada de cap pla.
  Cal dir-ho a [`privadesa.md`](../privadesa.md) amb aquestes paraules.
- Hi ha una peça mòbil més: un service worker mal desplegat pot servir una
  versió antiga. Es mitiga amb la versió del cau, que és la suma de verificació
  del contingut, i anant primer a la xarxa a les navegacions.
- Algunes xarxes de centre filtren dominis genèrics. Un domini propi ho evita,
  i torna al punt de l'adreça.

## Alternatives descartades

**Netlify, Cloudflare Pages o Vercel.** Funcionarien igual de bé i la seva
capa gratuïta sobra. El que aporten —desplegaments de prova, funcions, formularis,
xarxa de vora— no té cap ús en un únic fitxer estàtic, i el que costen és un
proveïdor més, un compte més i unes condicions d'ús que poden canviar. Amb el
codi ja a GitHub, Pages és menys peces per la mateixa cosa.

**Servir el fitxer des d'un CDN del dipòsit** (jsDelivr, raw.githack). No cal
desplegar res, però jsDelivr serveix l'HTML com a text pla i no el renderitza,
i els serveis de tipus githack no donen cap garantia de continuïtat. Per a una
adreça que s'ha de poder posar en una circular de centre, no.

**Substituir el fitxer únic per la versió web.** És el que fa que l'eina es
pugui fer servir en un centre amb la xarxa filtrada, en una reunió sense
cobertura o d'aquí a deu anys. La versió web hi suma; no la reemplaça.

**Publicar-ho tot des d'un domini propi des del primer dia.** Seria millor, i
és el que caldria fer si es vol domini propi. No es decideix aquí perquè és una
decisió d'organització i de pressupost, no d'arquitectura; el que sí que
s'estableix és que **canviar-la després té cost per als usuaris** i que, per
tant, s'ha de resoldre abans de difondre l'adreça.
