# Registre de canvis

El format segueix [Keep a Changelog](https://keepachangelog.com/ca/1.1.0/) i
el projecte usa [versionat semàntic](https://semver.org/lang/ca/).

## [No publicat]

### Afegit

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
