# Registre de canvis

El format segueix [Keep a Changelog](https://keepachangelog.com/ca/1.1.0/) i
el projecte usa [versionat semàntic](https://semver.org/lang/ca/).

## [No publicat]

### Afegit

- **Edició del document a la previsualització.** Amb **Edita el document** es
  pot retocar qualsevol text directament sobre el document. Les edicions es
  desen **per apartats**: només queden fixos els apartats retocats a mà, i la
  resta continua reflectint el pla. La franja d'edició llista els apartats
  retocats, amb un botó per restaurar-ne cadascun, i un per descartar-ho tot.
  El text desat es neteja d'elements actius abans de tornar-lo a pintar.
- **Numeració consecutiva dels apartats del document**: cada apartat porta el
  seu número (els objectius, per exemple, passen a ser un apartat numerat propi
  en lloc d'un «5.» repetit) i la numeració es refà sola quan se n'elimina o
  se n'hi afegeix algun. L'annex no es numera.
- **Graella de mesures simplificada** a l'apartat 5 del document: un botó hi
  deixa només els títols de les mesures, agrupats sota un petit títol per
  intensitat (universals, addicionals, intensius), i un altre torna a la
  redacció completa. El botó surt sempre just a sota del títol de l'apartat 5, també
  mentre s'edita, i no s'imprimeix; en un document editat a mà només es refà la
  graella i es respecten la resta d'edicions.
- **Taula d'objectius del document reorganitzada**: columnes Matèria,
  **Trimestre**, Objectiu, Instrument i evidència i **Avaluació**. Les files
  s'ordenen per matèria i trimestre, i les caselles repetides de matèria i de
  trimestre es fusionen i queden centrades verticalment. La matèria i el trimestre surten dels camps de
  l'objectiu del pas 6, encara que estigui redactat en text lliure. La columna
  Avaluació només porta el grau d'assoliment: el de la darrera valoració
  registrada en un seguiment del mateix trimestre que l'objectiu o, si no n'hi
  ha, el de la darrera de totes. Es refà sempre a partir del seguiment, també
  si l'apartat s'ha retocat a mà. L'annex ja no repeteix les valoracions: hi
  queden la decisió i les observacions de cada seguiment. Si els objectius no
  surten al document, l'annex les manté com fins ara.
- **Parts del document ocultes a la impressió**: cada apartat, cada fila i
  cada capçalera de columna de les taules (dades, justificació, mesures,
  propostes per matèria, objectius, horari, reunions i continuïtat), cada
  casella fusionada (que amaga tot el grup de files que abraça) i el requadre
  del segell del centre porten una icona d'ull que els amaga del document
  imprès. Els apartats ja no s'eliminen: s'amaguen, i els que s'havien
  eliminat abans passen a estar amagats. Els apartats amagats no es numeren, i
  **Torna a imprimir-ho tot** ho torna a mostrar tot d'un cop. A la pantalla es continua
  veient, apagada, amb l'avís «No s'imprimirà»; a la impressió desapareix i les
  caselles fusionades es recalculen. No compta com a edició: l'apartat
  continua reflectint el pla. Si s'imprimeix enmig d'una edició, abans es desen
  els canvis perquè la còpia impresa els reculli.
- **Seguiment per trimestres**: a la fitxa de valoració, els objectius
  s'agrupen pel trimestre que tenen assignat al pas 6, amb la matèria de
  cadascun, i es destaca el grup del trimestre que s'està valorant. Només es
  poden valorar els objectius del trimestre triat (i els que no en tenen cap
  d'assignat); els dels altres trimestres es veuen, apagats, sense poder-los
  marcar. Si el trimestre triat no té objectius, un avís ho indica al
  començament. L'històric indica el trimestre de cada objectiu valorat.
- **Text lliure de l'objectiu** al pas 6: si s'escriu, substitueix la frase
  construïda amb els camps al document, al seguiment i al control de qualitat.
- **Neteja totes les mesures** al pas 4, amb confirmació. Es mantenen les
  matèries i els textos de concreció.

- **Banc d'estratègies metodològiques**, al capdamunt dels resultats del banc
  de mesures i de la finestra que s'obre des del pas 4. Són **131 frases breus
  i directes** —«Donar instruccions clares, curtes i d'una sola idea cada
  vegada», «Ús de l'agenda amb seguiment diari per part del tutor/a»—
  repartides en **17 categories** (atenció, instruccions, planificació, temps,
  lectura, escriptura, matemàtiques, llengua, estratègies d'aprenentatge,
  autonomia, regulació emocional, conducta, relació amb els iguals, motivació,
  avaluació, entorn i família) i etiquetades pels perfils de necessitats als
  quals responen.

  Va en un **annex a part** i no barrejat amb el catàleg perquè són dues coses
  diferents: una mesura del Decret 150/2017 té intensitat, bloc i font
  normativa, i una estratègia d'aquí és pràctica docent sense norma al darrere.
  És el que se sol necessitar per començar a redactar.

  L'annex ocupa una caixa pròpia d'unes deu frases, **amb desplaçament propi**,
  de manera que el catàleg de mesures continuï a la vista just a sota. Es pot
  deixar reduït a la seva capçalera amb el botó **Oculta**.

  **Tot és editable**: qualsevol frase es pot reescriure o reetiquetar, el
  centre pot afegir-ne de pròpies i sempre se'n pot recuperar la del banc. Les
  modificacions i les frases pròpies es desen al navegador, van a la còpia de
  seguretat i s'exporten amb el fitxer del banc del centre, amb el mateix
  criteri que ja tenien les mesures. Font a `data/estrategies.json`; vegeu
  [`docs/dades/estrategies.md`](docs/dades/estrategies.md).

- **Banc de frases per a la conducta observable**, al pas 6. Cada objectiu té
  un botó **Banc de frases…** que obre una finestra amb dues entrades:

  - **Per àmbits**: 80 frases ja redactades en la forma que demana la frase de
    l'objectiu, agrupades en dotze àmbits —personal i social, regulació
    emocional, relació amb els iguals, lingüístic (lectura, escriptura i
    oralitat), matemàtic, cientificotecnològic, social i humanístic, artístic,
    educació física i digital.
  - **Des del currículum**: el currículum sencer de la matèria, competència per
    competència i criteri per criteri. **S'hi pot entrar encara que al pas 5 no
    s'hagi triat res**, i es pot canviar de matèria per mirar-ne una altra. El
    que sí que s'hagi triat al pas 5 surt destacat amb l'etiqueta «Triat al
    pas 5», i es pot deixar només això amb un filtre.

  En tots dos casos el text no s'insereix i prou: la casella de dalt de la
  finestra el deixa **adaptar** abans de tancar-la, que és el que sol caldre
  amb un criteri del decret, escrit per al grup i no per a un alumne/a concret.
  Si el criteri ja es va adaptar al pas 5, és el text adaptat el que s'ofereix.

- **«Acords amb la família»** al pas 8, dins de la conformitat: un camp obert
  per als compromisos generals que s'acorden amb la família, diferent dels
  acords de cada reunió de l'apartat 7. Surt a l'apartat 6 del document.

### Canviat

- La franja de passos de l'editor de PI **ja no s'encongeix** en desplaçar-se
  cap avall: es manté sempre desplegada, amb el nom de cada pas, i només hi
  apareix una ombra quan queda enganxada a dalt.
- Carregar la proposta de mesures segons el perfil **ja no obre el pas 4**:
  des de la fitxa de l'alumne/a s'hi torna amb un avís de les mesures
  carregades, i des de qualsevol altre lloc es queda on era.

- **Peu de la barra lateral**, ara amb l'autoria, la llicència, la versió i una
  sola línia sobre les dades.

- **L'aplicació es publica a una adreça web**: <https://vmoren12.github.io/psi/>.
  És exactament el mateix `dist/pi-eso.html`, byte a byte, servit per GitHub
  Pages. La descàrrega del fitxer únic continua igual: la versió web hi suma i
  no la substitueix. Vegeu
  [ADR 0006](docs/adr/0006-versio-web-i-pwa.md).

- **Es pot instal·lar com a aplicació del dispositiu** (progressive web app).
  Amb el manifest, les icones i el service worker de `web/`, el navegador
  ofereix afegir-la a l'escriptori o a la pantalla d'inici; a partir d'aquí té
  icona pròpia, s'obre sense barra d'adreces i funciona sense connexió. El
  service worker guarda l'aplicació i els tipus de lletra, i **no toca cap dada
  de l'alumnat**.

- **Botó per endur-se l'aplicació**, a baix a la dreta, just a sobre del botó
  de l'avís. No descarrega directament: obre un diàleg amb les dues opcions
  —instal·lar-la o baixar el fitxer— i la diferència explicada al costat de
  cadascuna, inclòs el que costa més d'endevinar: que el fitxer **es baixa
  buit**, perquè cada còpia desa les dades pel seu compte.

  L'opció d'instal·lar és un botó real a Chrome, Edge i Android; a Safari i
  Firefox, que no tenen l'API, el diàleg mostra la instrucció manual, i si
  l'aplicació ja corre instal·lada no surt.

- `tools/pagines.py`, que munta el lloc publicat a `_site/` a partir de `dist/`
  i de `web/`, i `tools/icones.py`, que genera les icones d'instal·lació (cal
  Pillow; no s'executa ni a la construcció ni a la integració contínua).

- Feina de GitHub Actions `.github/workflows/pages.yml`, que publica a cada
  canvi a `main` i s'atura si `dist/` no correspon a les fonts.

- 18 comprovacions noves a `tests/test_versio_web.py`: que el fitxer únic no
  referenciï cap recurs del servidor, que el service worker no enviï dades
  enlloc i només guardi el seu origen i els tipus de lletra, que l'opció
  d'instal·lar no surti si el navegador no la pot complir, que les icones facin
  la mida que declara el manifest i que el lloc publicat serveixi l'aplicació
  byte a byte.

### Canviat

- **Reorganització del dipòsit.** L'aplicació passa de ser un únic
  `pi-eso.html` editat a mà a un projecte amb el codi partit a `src/` (18
  fulls d'estil i 29 mòduls de JavaScript), les dades a `data/` i un pas de
  construcció que en genera `dist/pi-eso.html`.

  El fitxer distribuït és **idèntic byte a byte** al que hi havia abans: la
  reorganització no canvia cap comportament de l'aplicació.

- Els quatre scripts `dades/construeix-*.py`, que injectaven cada bloc de
  dades per separat dins de l'HTML, se substitueixen per `tools/build.py`
  (construcció completa) i `tools/valida.py` (validació reutilitzable). Les
  comprovacions que feien es conserven totes.

- Els extractors dels PDF oficials passen a `tools/extraccio/` i les seves
  ordres a `python -m tools.extraccio.curriculum_eso` i
  `python -m tools.extraccio.curriculum_primaria`.

- Els documents oficials de referència es reuneixen a `referencies/`, amb les
  sumes SHA-256 amb què es va fer l'extracció. Deixen d'estar versionats: no
  els cobreix la llicència del projecte i només calen per tornar a extreure el
  currículum.

### Afegit

- Suite de proves (`pytest`) amb 89 comprovacions: determinisme de la
  construcció, correspondència de `dist/` amb les fonts, absència de recursos
  externs i de crides de xarxa, integritat dels gestors `onclick`, i
  coherència de totes les dades.
- Integració contínua a GitHub Actions.
- Documentació: [arquitectura](docs/arquitectura.md),
  [privadesa](docs/privadesa.md), [decisions de disseny](docs/adr/) i guies de
  manteniment de cada conjunt de dades a [`docs/dades/`](docs/dades/).
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` i `LICENSE`.

### Notes

- Vuit mesures del banc amb identificador curt (`AD01`, `AD03`, `AD08`,
  `AD10`, `AD11`, `AD13`, `AD15`, `AD36`) tenen intensitat *Universal* tot i
  el prefix `AD`. És una numeració anterior a la convenció actual i el prefix
  hi és correlatiu, no descriptiu. **No es renumeren**: aquests
  identificadors poden constar a plans ja desats en dispositius de centres.
  La convenció s'aplica als identificadors nous i la comprovació automàtica
  els exclou explícitament.

---

## Versions anteriors

L'aplicació es va desenvolupar abans d'aquesta reorganització sense un
registre de canvis formal. Aquest fitxer comença aquí.
