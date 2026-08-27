# Registre de canvis

El format segueix [Keep a Changelog](https://keepachangelog.com/ca/1.1.0/) i
el projecte usa [versionat semàntic](https://semver.org/lang/ca/).

## [No publicat]

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
