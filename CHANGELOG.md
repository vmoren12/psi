# Registre de canvis

El format segueix [Keep a Changelog](https://keepachangelog.com/ca/1.1.0/) i
el projecte usa [versionat semàntic](https://semver.org/lang/ca/).

## [No publicat]

### Afegit

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
