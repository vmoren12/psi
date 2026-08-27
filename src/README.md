# Codi font de l'aplicació

Res del que hi ha aquí s'executa tal com és. `tools/build.py` ho concatena en
l'ordre que declara i n'escriu el resultat a `dist/pi-eso.html`, que és el que
es distribueix. El motiu és a [ADR 0001](../docs/adr/0001-fitxer-unic.md).

```
index.html     estructura del document i les tres marques de construcció
styles/        18 fulls d'estil, concatenats en ordre de cascada
app/           29 mòduls de JavaScript, concatenats en ordre d'execució
```

## Les marques

`index.html` és un document complet amb tres forats:

| Marca | S'hi posa |
|---|---|
| `/* <<<INSERTA: estils>>> */` | El contingut de `styles/`, dins del `<style>`. |
| `<!-- <<<INSERTA: curriculum>>> -->` | Els tres blocs de `data/`, com a `<script type="application/json">`. |
| `/* <<<INSERTA: aplicacio>>> */` | El contingut de `app/`, dins de l'únic `<script>`. |

N'hi ha dues més dins de `app/`: `banc-mesures` i `perfils`, que s'omplen amb
els catàlegs de `data/`.

Totes cinc són comentaris vàlids del llenguatge on viuen, de manera que
qualsevol fitxer d'aquesta carpeta es pot obrir i llegir tal com és.

## Dues coses a tenir presents

**Els mòduls de `app/` comparteixen un sol àmbit global.** Es concatenen dins
d'un únic `<script>` clàssic, no són mòduls ES. Per tant:

- l'ordre de `build.APLICACIO` és part del contracte —dades primer,
  `99-arrencada.js` sempre l'últim—, i
- **cap nom no es pot declarar dues vegades**. El segon guanyaria en silenci.
  Hi ha una prova que ho impedeix.

**Els gestors d'esdeveniments van en atributs `onclick` de cadenes d'HTML.**
Cap eina de JavaScript no sap comprovar-los: si canvieu el nom d'una funció
que només es crida des d'un atribut, no se n'adonarà ningú fins que algú hi
cliqui. `tests/test_aplicacio.py` recull tots els identificadors invocats des
d'atributs `on…=` i comprova que existeixin.

## Si afegiu un fitxer

Afegiu-lo també a la llista corresponent de `tools/build.py`. La construcció
falla si un fitxer de `src/` no hi consta, precisament perquè no se'n pugui
quedar cap fora del document distribuït sense que ningú ho vegi.
