# PI · Pla de suport individualitzat

Eina d'elaboració, seguiment i impressió de **plans de suport individualitzat
(PI)** per a l'educació bàsica a Catalunya —primària i ESO—, amb el currículum
del **Decret 175/2022** integrat i un banc de mesures i suports basat en el
**Decret 150/2017**.

L'aplicació és **un sol fitxer HTML**. Es baixa, es fa doble clic i funciona:
sense instal·lació, sense servidor, sense connexió i sense compte d'usuari.
**Les dades de l'alumnat no surten mai del dispositiu.**

> [!IMPORTANT]
> Aquesta **no és una aplicació oficial** del Departament d'Educació de la
> Generalitat de Catalunya. És una eina d'ajuda a la redacció: el currículum i
> el catàleg de mesures s'hi incorporen a efectes de consulta i poden contenir
> errors o estar desactualitzats. Reviseu sempre el contingut de cada pla
> abans de validar-lo, compartir-lo o imprimir-lo, i contrasteu-lo amb la
> normativa vigent i amb els criteris del vostre centre.

---

## Com fer-la servir

1. Baixeu **[`dist/pi-eso.html`](dist/pi-eso.html)** (botó dret → *Desa
   l'enllaç com a…*), o preneu-lo de la darrera versió publicada a *Releases*.
2. Obriu-lo amb qualsevol navegador modern (Firefox, Chrome, Edge, Safari).
3. Ja està. No cal res més.

El fitxer es pot desar en un llapis de memòria, enviar per correu o deixar en
una carpeta compartida del centre. Cada còpia és independent.

### Què hi ha a dins

| | |
|---|---|
| **Tauler** | Estat de tots els plans, alertes de seguiment pendent i indicadors de qualitat. |
| **Alumnat** | Fitxes de l'alumnat, perfils de necessitat específica i importació/exportació en CSV. |
| **Editor** | Els vuit passos del model oficial, del full d'identitat a la conformitat de la família. |
| **Seguiment** | Valoració trimestral dels objectius amb escala d'assoliment i historial. |
| **Banc de mesures** | 114 mesures i suports dels tres nivells d'intensitat, ampliable pel centre. |
| **Currículum** | Explorador de les matèries de l'ESO i les àrees de primària del Decret 175/2022. |
| **Dades i còpies** | Còpia de seguretat, restauració, fusió i historial intern d'instantànies. |

## Privadesa

Tot es desa a l'**emmagatzematge local del navegador** del dispositiu on
s'obre el fitxer. L'aplicació no fa cap petició de xarxa amb dades: no hi ha
servidor, ni analítica, ni telemetria, ni compte. La suite de proves ho
comprova a cada canvi (`tests/test_aplicacio.py`).

La contrapartida és que **les còpies de seguretat són responsabilitat de qui
la fa servir**: buidar les dades del navegador esborra els plans. Vegeu
[`docs/privadesa.md`](docs/privadesa.md).

---

## El dipòsit

```
├── src/                  codi font de l'aplicació
│   ├── index.html          estructura del document i marques de construcció
│   ├── styles/             18 fulls d'estil, en ordre de cascada
│   └── app/                29 mòduls de JavaScript, en ordre d'execució
├── data/                 dades: currículum, banc de mesures, plantilles
├── tools/                construcció, validació i extracció dels PDF oficials
├── tests/                suite de proves (pytest)
├── docs/                 arquitectura, decisions, manteniment de les dades
├── dist/pi-eso.html      l'aplicació, generada — és el que es distribueix
└── referencies/          PDF oficials de la normativa (no versionats)
```

### Per què hi ha un pas de construcció

L'aplicació ha de funcionar oberta des del disc (protocol `file://`). En
aquest context el navegador bloqueja els mòduls ES i la lectura de fitxers
JSON del costat, de manera que **el que es distribueix ha de ser un sol
fitxer**. Però un sol fitxer de 5.900 línies no és mantenible, així que el codi
viu partit i `tools/build.py` el cus.

`dist/pi-eso.html` està versionat a propòsit: és l'artefacte que baixa la gent,
i ha de ser accessible sense clonar el dipòsit ni tenir Python. La integració
contínua comprova a cada canvi que correspon exactament al que hi ha a `src/` i
`data/`.

Vegeu [`docs/arquitectura.md`](docs/arquitectura.md) i les decisions de
disseny a [`docs/adr/`](docs/adr/).

### Construir-la

Cal **Python 3.9 o superior**. No cal cap dependència per construir.

```bash
python -m tools.build              # genera dist/pi-eso.html
python -m tools.build --verifica   # comprova que dist/ correspon a src/ i data/
python -m tools.valida             # valida les dades sense construir res
```

### Provar-la

```bash
python -m pip install -r requirements-dev.txt
python -m pytest
```

Les proves comproven, entre altres coses, que la construcció sigui
determinista, que `dist/` estigui al dia, que cap atribut `onclick` de la
interfície cridi una funció inexistent, que el document no carregui cap recurs
extern i que les dades del currículum no arrosseguin glifs corromputs de
l'extracció dels PDF del DOGC.

---

## Contribuir

Les aportacions més útils són **correccions al banc de mesures i al
currículum**: hi ha 114 mesures i milers de criteris d'avaluació extrets de
PDF, i cada error acaba en un document que signa un centre.

- Errors i propostes: [obriu una incidència](../../issues/new/choose).
- Canvis al codi o a les dades: llegiu [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Manteniment de cada conjunt de dades: [`docs/dades/`](docs/dades/).

## Autoria i llicència

Aplicació creada per **Víctor Moreno de la Torre**, psicòleg i orientador
educatiu, amb l'assistència de **Claude** (Anthropic).

Publicada sota [**Creative Commons Reconeixement 4.0
Internacional**](https://creativecommons.org/licenses/by/4.0/deed.ca)
(`CC-BY-4.0`): ús, còpia, modificació i distribució lliures i gratuïts,
inclòs l'ús comercial, sempre que se'n reconegui l'autoria. Vegeu
[`LICENSE`](LICENSE).

El currículum i els textos normatius que s'hi incorporen provenen de
publicacions oficials de la Generalitat de Catalunya; la seva autoria és del
Departament d'Educació. Vegeu [`referencies/README.md`](referencies/README.md).
