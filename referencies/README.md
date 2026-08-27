# Documents de referència

Aquesta carpeta conté els documents oficials dels quals surten les dades de
`data/`. **No estan versionats** (`.gitignore` els exclou) per dos motius:

1. Són publicacions de la Generalitat de Catalunya. L'autoria és del
   Departament d'Educació i no els cobreix la llicència d'aquest dipòsit;
   redistribuir-los des d'aquí barrejaria dues autories i dues llicències.
2. Ocupen uns 33 MB, i només calen per **tornar a extreure** el currículum,
   cosa que passa quan canvia la normativa.

Per treballar amb el projecte del dia a dia no fan cap falta: `data/*.json`
és el resultat de l'extracció i sí que està versionat.

## Què hi ha d'haver

```
referencies/
├── curriculum/
│   ├── Annex_1_clau.pdf                          Decret 175/2022, annex 1
│   ├── Annex_2_Primaria.pdf                      Decret 175/2022, annex 2
│   ├── Annex_3_Secundaria.pdf                    Decret 175/2022, annex 3
│   ├── Annex_4_Transversals.pdf                  Decret 175/2022, annex 4
│   └── curriculum-basica-decret-175-2022.pdf     el decret complet (DOGC)
└── normativa/
    ├── Decret_150_2017.pdf                       atenció educativa a l'alumnat
    ├── Models-PI_Secundaria.pdf                  model oficial del PI
    ├── mesures-suports-universals-centre-educatiu.pdf
    ├── taula-mesures-i-suports-universals.pdf
    ├── taula-mesures-i-suports-addicionals.pdf
    └── taula-mesures-i-suports-intensius.pdf
```

**Decret 175/2022**, de 27 de setembre, d'ordenació dels ensenyaments de
l'educació bàsica — DOGC núm. 8762, de 29.9.2022.
**Decret 150/2017**, de 17 d'octubre, de l'atenció educativa a l'alumnat en el
marc d'un sistema educatiu inclusiu — DOGC núm. 7477, de 19.10.2017.

Tots són consultables al Portal Jurídic de Catalunya
(<https://portaljuridic.gencat.cat>) i al web del Departament d'Educació
(<https://educacio.gencat.cat>).

## Comprovar que són els mateixos

L'extracció del currículum depèn de com estan incrustades les fonts dins de
cada PDF: una reedició del document pot canviar-ho i fer que el text surti
corromput sense avisar. Per això es guarden les sumes de verificació dels
fitxers amb què es va fer l'extracció que hi ha a `data/`:

```bash
cd referencies && sha256sum -c CHECKSUMS.txt
```

Si una suma no coincideix, el document s'ha reeditat. Cal tornar a extreure'l
(`python -m tools.extraccio.curriculum_eso`), revisar-ne el resultat i
actualitzar `CHECKSUMS.txt` en el mateix canvi. Vegeu
[`docs/dades/curriculum-eso.md`](../docs/dades/curriculum-eso.md), que explica
per què l'extracció no és un simple «copia el text».
