# Com contribuir

Gràcies per voler ajudar. Aquest projecte el fa servir gent que redacta plans
de suport individualitzat per a alumnat real, i qualsevol millora hi arriba
directament.

## Què ajuda més

L'aportació més valuosa **no és codi**. És contingut:

1. **Errades al banc de mesures**: una concreció mal redactada, una intensitat
   equivocada, una font que no correspon.
2. **Errades al currículum**: text de criteris o sabers que no coincideix amb
   el DOGC. L'extracció dels PDF oficials és difícil (vegeu
   [`docs/dades/curriculum-eso.md`](docs/dades/curriculum-eso.md)) i pot
   haver-hi caràcters mal llegits.
3. **Mesures que falten**, amb la font oficial d'on surten.
4. **Com funciona a la pràctica**: on el flux de vuit passos no encaixa amb la
   manera de treballar del vostre centre.

Per a tot això n'hi ha prou amb [obrir una incidència](../../issues/new/choose).
No cal saber programar ni clonar res.

## Posar-se en marxa

Cal **Python 3.9 o superior**. Res més.

```bash
git clone <adreça-del-dipòsit>
cd PIs

python -m pip install -r requirements-dev.txt   # només per provar i revisar

python -m tools.build      # genera dist/pi-eso.html
python -m pytest           # la suite sencera (~90 proves, menys d'un segon)
python -m ruff check .     # estil del codi de Python
```

Per veure l'aplicació, obriu `dist/pi-eso.html` amb el navegador. No cal
servidor: aquest és tot el sentit del projecte.

Els documents PDF de `referencies/` **no cal baixar-los**. Només fan falta per
tornar a extreure el currículum, cosa que passa quan canvia la normativa.

## On va cada cosa

| Si voleu canviar… | Editeu… |
|---|---|
| El text d'una mesura o afegir-ne | `data/banc-mesures.json` |
| Quines mesures proposa un perfil | `data/perfils.json` |
| El currículum de l'ESO o de primària | `data/curriculum-*.json` |
| L'aspecte | `src/styles/*.css` |
| El comportament | `src/app/*.js` |
| L'estructura del document | `src/index.html` |

**Mai** `dist/pi-eso.html`. És un fitxer generat, i qualsevol canvi que hi
feu desapareixerà a la propera construcció.

Cada conjunt de dades té la seva guia a [`docs/dades/`](docs/dades/): expliquen
què vol dir cada camp, com es numeren els identificadors i què comprova el
validador.

## El cicle de treball

```
1. editeu           src/ o data/
2. construïu        python -m tools.build
3. proveu           python -m pytest
4. obriu            dist/pi-eso.html   i comproveu-ho al navegador
5. incloeu dist/pi-eso.html al mateix canvi
```

El pas 5 no és opcional. `dist/` està versionat a propòsit (vegeu
[ADR 0004](docs/adr/0004-dist-versionat.md)) i la integració contínua
comprova que correspongui a les fonts. Si us l'oblideu, el canvi no passa.

**Si teniu un conflicte de fusió a `dist/pi-eso.html`, no el resolgueu a mà.**
Preneu qualsevol de les dues versions, fusioneu `src/` i `data/`, i torneu a
construir:

```bash
git checkout --ours dist/pi-eso.html
python -m tools.build
git add dist/pi-eso.html
```

## Estil

**JavaScript.** Escriviu-lo com el que ja hi ha. Concretament:

- Es concatena tot dins d'**un sol àmbit global**: cap nom no es pot repetir
  entre mòduls, i hi ha una prova que ho comprova.
- Sense mòduls ES, sense transpilació, sense dependències. El que escriviu és
  el que corre al navegador.
- Els noms de funcions, variables i comentaris **són en català**, com la resta
  del projecte.
- Els comentaris expliquen **per què**, no què. El codi ja diu què fa; el que
  no es pot deduir llegint-lo és la restricció normativa o d'ús que hi ha
  darrere d'una decisió. Mireu els que hi ha: és el nivell que s'hi espera.
- Cada mòdul comença amb un comentari de capçalera que diu de què va. Hi ha
  una prova que ho comprova.
- Si un mòdul passa de 700 línies, partiu-lo i afegiu-lo a `build.APLICACIO`.

**Python.** `ruff check .` amb la configuració de `pyproject.toml`. Línies de
fins a 100 caràcters. Docstrings en català que expliquin per què existeix cada
peça.

**Dades.** JSON amb sagnat de dos espais, en UTF-8 i sense BOM. Cada mesura ha
de dir de quin document oficial surt al camp `font`.

## Accessibilitat i impressió

Dues coses que és fàcil trencar sense adonar-se'n:

- **L'aplicació s'ha de poder fer servir amb teclat i amb lector de pantalla.**
  Tot control necessita nom accessible; les icones són decoratives i el
  significat sempre ha de ser al text o a l'`aria-label`.
- **El document imprès és la sortida real de l'eina.** Si toqueu els estils,
  comproveu la vista prèvia d'impressió: els marges, els salts de pàgina i les
  taules del pas 5 són delicats.

## Abans d'enviar el canvi

- [ ] `python -m tools.build` executat i `dist/pi-eso.html` inclòs
- [ ] `python -m pytest` en verd
- [ ] `python -m ruff check .` en verd
- [ ] Provat obrint `dist/pi-eso.html` **des del disc**, no des d'un servidor
- [ ] Si toca els estils: comprovada la vista prèvia d'impressió
- [ ] Si toca les dades: afegida o revisada la `font` de cada entrada nova

## Llicència de les aportacions

En contribuir accepteu que la vostra aportació es publiqui sota la mateixa
llicència del projecte, [Creative Commons Reconeixement 4.0
Internacional](LICENSE) (`CC-BY-4.0`).
