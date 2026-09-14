"""Construeix `dist/pi-eso.html` a partir de `src/` i `data/`.

Per què hi ha una construcció
-----------------------------
L'aplicació s'ha de poder obrir amb un doble clic des d'un llapis de memòria,
sense servidor, sense instal·lació i sense connexió (protocol `file://`). En
aquest context el navegador bloqueja tant els mòduls ES com la lectura de
fitxers JSON del costat, de manera que el que es distribueix ha de ser un sol
fitxer HTML amb tot a dins.

Això no vol dir que s'hagi d'escriure com un sol fitxer. El codi viu partit a
`src/styles/` i `src/app/`, i les dades a `data/`; aquesta eina ho cus tot en
l'ordre declarat aquí i escriu el fitxer únic a `dist/`.

Com que els fitxers de `src/app/` es concatenen dins d'un únic `<script>`
clàssic, comparteixen àmbit global: l'ordre de la llista APLICACIO és part del
contracte, no un detall. Les dades i les utilitats van primer, les vistes
després i l'arrencada al final.

Ús
--
    python -m tools.build              # construeix dist/pi-eso.html
    python -m tools.build --verifica   # no escriu: comprova que dist/ és al dia
    python -m tools.build --silenci    # sense resum a la sortida

`--verifica` és el que fa la integració contínua: si algú toca `src/` o `data/`
i no reconstrueix, la comprovació falla i el fitxer distribuït no es queda
enrere en silenci.
"""
from __future__ import annotations

import json
import sys

from . import rutes, valida

# Marques de la plantilla i dels mòduls. Són comentaris vàlids en el llenguatge
# on viuen, de manera que `src/index.html` i els fitxers de `src/app/` es poden
# obrir i llegir tal com són, sense passar per la construcció.
MARCA_ESTILS = "/* <<<INSERTA: estils>>> */"
MARCA_APLICACIO = "/* <<<INSERTA: aplicacio>>> */"
MARCA_CURRICULUM = "<!-- <<<INSERTA: curriculum>>> -->"
MARCA_BANC = "/* <<<INSERTA: banc-mesures>>> */"
MARCA_ESTRATEGIES = "/* <<<INSERTA: estrategies>>> */"
MARCA_PERFILS = "/* <<<INSERTA: perfils>>> */"

# Fulls d'estil, en ordre de cascada: primer els testimonis i la base, després
# l'estructura, les primitives i cada zona de la interfície, i al final les
# adaptacions a pantalla petita, que han de poder sobreescriure la resta.
ESTILS = [
    "01-tokens.css",
    "02-icones.css",
    "03-base.css",
    "04-estructura.css",
    "05-primitives.css",
    "06-stepper.css",
    "07-redactor.css",
    "08-catalegs.css",
    "09-horari.css",
    "10-cronologia.css",
    "11-mesures.css",
    "12-banc-modal.css",
    "13-criteris.css",
    "14-document.css",
    "15-avis.css",
    "16-notes.css",
    "17-editor-mesura.css",
    "18-adaptatiu.css",
]

# Mòduls de l'aplicació, en ordre d'execució.
APLICACIO = [
    # dades de referència i vocabularis
    "01-referencies.js",
    "02-banc-mesures.js",
    "03-perfils.js",
    # estat, persistència i infraestructura de la interfície
    "04-estat.js",
    "05-utilitats.js",
    "06-navegacio.js",
    "07-dialegs.js",
    "08-logos.js",
    "09-versio-web.js",
    # vistes principals
    "10-vista-tauler.js",
    "11-vista-alumnat.js",
    "12-vista-banc.js",
    "13-vista-curriculum.js",
    "14-estrategies.js",
    # editor del pla, pas a pas
    "20-pi-nucli.js",
    "21-pi-pas1.js",
    "22-pi-pas2-3.js",
    "23-pi-pas4.js",
    "24-pi-banc-modal.js",
    "25-pi-proposta.js",
    "26-pi-pas5.js",
    "27-pi-pas5-sabers.js",
    "28-pi-pas5-primaria.js",
    "29-pi-conductes.js",
    "30-pi-pas6.js",
    "31-pi-pas7-8.js",
    # seguiment, document i dades
    "40-vista-seguiment.js",
    "50-document.js",
    "60-copies.js",
    "61-dades-io.js",
    "62-alumnat-io.js",
    # arrencada: ha de ser l'últim
    "99-arrencada.js",
]


class ErrorDeConstruccio(Exception):
    """Les dades o la plantilla no permeten generar el fitxer."""


# --------------------------------------------------------------------------
# peces
# --------------------------------------------------------------------------

def _compacte(dades) -> str:
    """JSON per incrustar: sense espais i amb els accents tal com són.

    `ensure_ascii=False` no és estètica. Escapar cada vocal accentuada com a
    `\\uXXXX` inflaria el fitxer un 40 % llarg, i el document ja declara el joc de
    caràcters a la capçalera.
    """
    return json.dumps(dades, ensure_ascii=False, separators=(",", ":"))


def bloc_curriculum() -> str:
    """Els tres blocs de currículum, com a `<script type="application/json">`.

    Van com a dades i no com a codi: així el navegador no n'analitza el
    contingut i un apòstrof o una barra dins d'un criteri d'avaluació no poden
    trencar l'aplicació.
    """
    eso = valida.llegeix(rutes.CURRICULUM_ESO)["materies"]
    prim = valida.llegeix(rutes.CURRICULUM_PRIMARIA)
    equiv = valida.llegeix(rutes.EQUIVALENCIES)["equivalencies"]
    return (
        "<!-- <<<CURRICULUM-ESO-INICI>>> -->\n"
        '<script id="curriculum-data" type="application/json">'
        + _compacte(eso) + "</script>\n"
        "<!-- <<<CURRICULUM-ESO-FI>>> -->\n"
        "<!-- <<<CURRICULUM-PRIMARIA-INICI>>> -->\n"
        '<script id="curriculum-primaria-data" type="application/json">'
        + _compacte(prim) + "</script>\n"
        '<script id="equivalencies-primaria-data" type="application/json">'
        + _compacte(equiv) + "</script>\n"
        "<!-- <<<CURRICULUM-PRIMARIA-FI>>> -->"
    )


def bloc_banc() -> str:
    """El catàleg de mesures, una mesura per línia.

    Una línia per mesura és intencionat: així la diferència d'una revisió
    ensenya exactament quines mesures han canviat, encara que el fitxer estigui
    generat.
    """
    doc = valida.llegeix(rutes.BANC)
    linies = [" " + json.dumps({c: x[c] for c in valida.CAMPS_MESURA}, ensure_ascii=False)
              for x in valida.ordena_mesures(doc)]
    return ("/* <<<BANC-MESURES-INICI>>> */\n"
            "const MESURES_BASE = [\n" + ",\n".join(linies) + "\n];\n"
            "/* <<<BANC-MESURES-FI>>> */")


def bloc_estrategies() -> str:
    """El banc d'estratègies metodològiques, una frase per línia.

    Mateix criteri que el catàleg de mesures: una línia per entrada, de manera
    que la diferència d'una revisió ensenyi exactament quines frases han
    canviat encara que el fitxer estigui generat.
    """
    doc = valida.llegeix(rutes.ESTRATEGIES)
    linies = [" " + json.dumps({c: x[c] for c in valida.CAMPS_ESTRATEGIA}, ensure_ascii=False)
              for x in valida.ordena_estrategies(doc)]
    return ("/* <<<ESTRATEGIES-INICI>>> */\n"
            "const ESTRATEGIES_CATEGORIES = "
            + _compacte(doc["vocabulari"]["categories"]) + ";\n"
            "const ESTRATEGIES_BASE = [\n" + ",\n".join(linies) + "\n];\n"
            "/* <<<ESTRATEGIES-FI>>> */")


def bloc_perfils() -> str:
    """Les plantilles de mesures per perfil, una per línia."""
    doc = valida.llegeix(rutes.PERFILS)

    def js(b, claus):
        d = {c: b[c] for c in claus if c in b}
        d["mesures"] = [{"id": m["id"], "prioritat": m["prioritat"]} for m in b["mesures"]]
        return json.dumps(d, ensure_ascii=False)

    linies = [" " + js(pf, ["perfil", "nom", "resum", "evidencia"]) for pf in doc["perfils"]]
    return ("/* <<<PERFILS-INICI>>> */\n"
            "const PERFIL_BASE = " + js(doc["base"], ["titol", "resum", "evidencia"]) + ";\n"
            "const PERFIL_PLANTILLES = [\n" + ",\n".join(linies) + "\n];\n"
            "/* <<<PERFILS-FI>>> */")


def _llegeix_parts(carpeta, noms, etiqueta) -> str:
    """Concatena els fitxers indicats, comprovant que la llista i el disc coincideixin."""
    presents = {p.name for p in carpeta.iterdir() if p.is_file()}
    declarats = set(noms)
    if presents - declarats:
        raise ErrorDeConstruccio(
            "%s: hi ha fitxers a %s que no consten a tools/build.py: %s"
            % (etiqueta, carpeta.name, ", ".join(sorted(presents - declarats))))
    if declarats - presents:
        raise ErrorDeConstruccio(
            "%s: tools/build.py espera fitxers que no hi són: %s"
            % (etiqueta, ", ".join(sorted(declarats - presents))))
    return "".join((carpeta / n).read_text(encoding="utf-8") for n in noms)


def _substitueix(text, marca, contingut, on) -> str:
    if text.count(marca) != 1:
        raise ErrorDeConstruccio("%s ha de contenir la marca %s exactament un cop "
                                 "(n'hi ha %d)" % (on, marca, text.count(marca)))
    return text.replace(marca, contingut)


# --------------------------------------------------------------------------
# construcció
# --------------------------------------------------------------------------

def construeix() -> str:
    """Retorna el contingut complet de l'aplicació en un sol document HTML."""
    problemes = valida.valida_tot()
    total = sum(len(v) for v in problemes.values())
    if total:
        detall = "\n".join("  [%s] %s" % (ambit, e)
                           for ambit, errs in problemes.items() for e in errs)
        raise ErrorDeConstruccio(
            "les dades tenen %d error(s); no s'ha generat res:\n%s" % (total, detall))

    html = rutes.PLANTILLA.read_text(encoding="utf-8")

    estils = _llegeix_parts(rutes.ESTILS, ESTILS, "estils")
    codi = _llegeix_parts(rutes.APLICACIO, APLICACIO, "aplicació")
    codi = _substitueix(codi, MARCA_BANC, bloc_banc(), "src/app/02-banc-mesures.js")
    codi = _substitueix(codi, MARCA_ESTRATEGIES, bloc_estrategies(), "src/app/02-banc-mesures.js")
    codi = _substitueix(codi, MARCA_PERFILS, bloc_perfils(), "src/app/03-perfils.js")

    # Les marques ocupen una línia sencera i el contingut que les substitueix ja
    # porta el salt final, així que se'n treu el de la plantilla.
    html = _substitueix(html, MARCA_ESTILS + "\n", estils, "src/index.html")
    html = _substitueix(html, MARCA_CURRICULUM, bloc_curriculum(), "src/index.html")
    html = _substitueix(html, MARCA_APLICACIO + "\n", codi, "src/index.html")
    return html


def resum(html: str) -> str:
    banc = valida.llegeix(rutes.BANC)
    estrategies = valida.llegeix(rutes.ESTRATEGIES)
    perfils = valida.llegeix(rutes.PERFILS)
    eso = valida.llegeix(rutes.CURRICULUM_ESO)["materies"]
    prim = valida.llegeix(rutes.CURRICULUM_PRIMARIA)["arees"]
    perfils_app = valida.perfils_de_l_aplicacio()

    linies = [
        "  %-28s %s" % ("fitxer", rutes.SORTIDA.relative_to(rutes.ARREL)),
        "  %-28s %.2f MB (%d línies)" % ("mida",
                                         len(html.encode("utf-8")) / 1024 / 1024,
                                         html.count("\n")),
        "  %-28s %d fulls, %d mòduls" % ("codi", len(ESTILS), len(APLICACIO)),
        "  %-28s %d matèries d'ESO, %d àrees de primària" % ("currículum", len(eso), len(prim)),
        "  %-28s %d mesures" % ("banc", len(banc["mesures"])),
        "  %-28s %d frases en %d categories"
        % ("estratègies", len(estrategies["estrategies"]),
           len(estrategies["vocabulari"]["categories"])),
        "  %-28s %d de %d perfils" % ("plantilles", len(perfils["perfils"]), len(perfils_app)),
    ]

    sense = valida.perfils_sense_plantilla(perfils, perfils_app)
    if sense:
        linies.append("  AVÍS: perfils sense plantilla: " + ", ".join(sense))
    orfes = valida.mesures_orfes(perfils, banc)
    if orfes:
        linies.append("  AVÍS: %d mesures no surten a cap plantilla: %s"
                      % (len(orfes), ", ".join(orfes)))
    return "\n".join(linies)


def main(argv=None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    argv = list(sys.argv[1:] if argv is None else argv)
    verifica = "--verifica" in argv
    silenci = "--silenci" in argv
    desconegudes = [a for a in argv if a not in ("--verifica", "--silenci")]
    if desconegudes:
        print("ERROR: opció desconeguda: " + " ".join(desconegudes))
        print(__doc__.split("Ús\n--\n", 1)[-1].strip())
        return 2

    try:
        html = construeix()
    except ErrorDeConstruccio as e:
        print("ERROR: %s" % e)
        return 1

    if verifica:
        if not rutes.SORTIDA.exists():
            print("ERROR: no hi ha %s. Executeu «python -m tools.build»."
                  % rutes.SORTIDA.relative_to(rutes.ARREL))
            return 1
        actual = rutes.SORTIDA.read_text(encoding="utf-8", newline="")
        if actual != html:
            print("ERROR: %s no correspon a src/ i data/.\n"
                  "       Executeu «python -m tools.build» i incloeu-ho al canvi."
                  % rutes.SORTIDA.relative_to(rutes.ARREL))
            return 1
        if not silenci:
            print("%s està al dia." % rutes.SORTIDA.relative_to(rutes.ARREL))
        return 0

    rutes.DIST.mkdir(parents=True, exist_ok=True)
    # newline="" perquè el fitxer distribuït porti sempre salts LF, tant si es
    # genera a Windows com a Linux: així la còpia de `dist/` no canvia de mida
    # ni de suma de verificació segons qui la construeixi.
    rutes.SORTIDA.write_text(html, encoding="utf-8", newline="")
    if not silenci:
        print("Aplicació construïda.")
        print(resum(html))
    return 0


if __name__ == "__main__":
    sys.exit(main())
