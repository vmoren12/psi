# 0004 · Versionar l'artefacte generat

**Estat:** vigent · **Data:** 2026-08-27

## Context

`dist/pi-eso.html` és un fitxer generat. La pràctica habitual és no versionar
els artefactes: es reconstrueixen, tendeixen a quedar desincronitzats i
embruten les diferències.

Aquí, però, **l'artefacte és el producte**. No és un pas intermedi cap a un
desplegament: és exactament el que una persona ha de poder baixar i obrir. I
aquesta persona no clonarà el dipòsit, no té Python i no ha de saber què és
una construcció.

## Decisió

Versionar `dist/pi-eso.html`, i fer que la integració contínua comprovi a cada
canvi que correspon exactament a `src/` i `data/`:

```bash
python -m tools.build --verifica
```

Si algú toca les fonts i no reconstrueix, la comprovació falla. El fitxer
distribuït no pot quedar-se enrere en silenci.

## Conseqüències

**A favor**

- Es pot baixar directament del dipòsit, sense passar per *Releases* ni per
  cap eina.
- L'historial guarda l'aplicació sencera de cada versió. Es pot recuperar el
  fitxer exacte que un centre feia servir el curs passat.
- Com que la construcció és determinista, es pot comprovar per suma de
  verificació que un fitxer que corre en un centre correspon a una versió
  publicada.

**En contra, i com es mitiga**

- **Les diferències són grans.** Un canvi de tres línies al codi mou tot un
  fitxer d'1,1 MB. Es mitiga en part perquè el catàleg de mesures s'incrusta
  amb **una mesura per línia**, de manera que la diferència del bloc de dades
  sí que és llegible.
- **Conflictes de fusió a `dist/`.** No es resolen mai a mà: es reconstrueix.
  Ho diu [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
- **Cal recordar de reconstruir.** És l'única raó per la qual existeix
  `--verifica`.
