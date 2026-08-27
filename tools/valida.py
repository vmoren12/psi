"""Validació de les dades del projecte.

Les dades de `data/` són el que acaba dins del pla de suport individualitzat
que signa un centre educatiu: una mesura sense concreció, un criteri amb el
codi fora de seqüència o un perfil que remet a una mesura inexistent no són
errors cosmètics, són text erroni en un document oficial. Per això la
construcció s'atura si qualsevol d'aquestes comprovacions falla.

Cada funció `valida_*` retorna una llista de missatges d'error. Llista
buida = dades correctes. Cap funció escriu res ni surt del procés: qui
decideix què fer amb els errors és qui les crida (`tools/build.py` o els
tests de `tests/`).

    python -m tools.valida        # comprova-ho tot i informa
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from . import rutes

# Camps que l'aplicació espera a cada mesura del banc. L'ordre és el que
# tindran dins de `dist/`: es fixa aquí perquè el fitxer generat sigui
# reproduïble i els canvis de `data/` es llegeixin bé a la diferència.
CAMPS_MESURA = ["id", "titol", "desc", "concrecio", "intensitat", "bloc",
                "tipus", "perfils", "materies", "font"]

PRIORITATS = ["nucli", "complementari"]
RELACIONS = ["directa", "parcial"]

# Matèries del model oficial que no surten a l'annex 3 del decret. Han de
# coincidir amb la constant EXTRA_FILES de src/app/01-referencies.js; el test
# tests/test_dades.py ho comprova.
EXTRA_FILES = ["Optativa", "Projecte", "Àmbit", "Tutoria"]

RE_CODI = re.compile(r"^(\d+)\.(\d+)$")


# --------------------------------------------------------------------------
# lectura
# --------------------------------------------------------------------------

def llegeix(ruta: Path):
    """Carrega un JSON de `data/` amb un error llegible si no s'hi pot."""
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit("ERROR: no es troba %s" % ruta) from None
    except json.JSONDecodeError as e:
        raise SystemExit("ERROR: %s no es pot llegir com a JSON "
                         "(línia %d, columna %d): %s"
                         % (ruta, e.lineno, e.colno, e.msg)) from None


def perfils_de_l_aplicacio() -> list:
    """Llista PERFILS tal com la declara el codi de l'aplicació.

    El vocabulari de perfils viu al codi i no a `data/` perquè cada perfil
    també canvia la interfície. Es llegeix d'allà, i no d'una còpia, perquè
    les dues llistes no puguin divergir en silenci.
    """
    js = (rutes.APLICACIO / "01-referencies.js").read_text(encoding="utf-8")
    m = re.search(r"const PERFILS = \[(.*?)\];", js, re.S)
    if not m:
        raise SystemExit("ERROR: no es troba la constant PERFILS "
                         "a src/app/01-referencies.js")
    return json.loads("[" + m.group(1) + "]")


def materies_de_l_eso(curr_eso) -> set:
    """Vocabulari de matèries admès a les dades: annex 3 + files extra."""
    return {x["nom"] for x in curr_eso["materies"]} | set(EXTRA_FILES)


# --------------------------------------------------------------------------
# currículum
# --------------------------------------------------------------------------

def _valida_unitats(unitats, etiqueta, errs, codis_estrictes):
    """Comprovacions comunes a les matèries de l'ESO i a les àrees de primària.

    Les dues comparteixen forma —competències específiques, grups de criteris
    per curs o cicle, i sabers— i només canvia el nom que se'ls dona i el
    rigor amb què es numeren els criteris: a l'ESO cada codi ha de ser
    exactament «CE.ordre», mentre que a primària només se'n comprova la
    seqüència, perquè el decret hi agrupa els criteris per cicle.

    Retorna el conjunt de noms vàlids, que les equivalències necessiten.
    """
    noms = set()
    for u in unitats:
        nom = u.get("nom")
        if not nom:
            errs.append("hi ha %s sense nom" % etiqueta)
            continue
        if nom in noms:
            errs.append("%s duplicada: %s" % (etiqueta, nom))
        noms.add(nom)

    for u in unitats:
        nom = u.get("nom", "?")
        # Una unitat amb «ref» no té text propi: remet al d'una altra (l'aranès
        # al català, per exemple). Amb comprovar que existeixi n'hi ha prou.
        if "ref" in u:
            if u["ref"] not in noms:
                errs.append("%s remet a una unitat inexistent: %s" % (nom, u["ref"]))
            continue

        if not u.get("ce"):
            errs.append("%s: no té cap competència específica" % nom)
        for i, c in enumerate(u.get("ce", []), 1):
            marca = "%s CE%s" % (nom, c.get("n"))
            if c.get("n") != i:
                errs.append("%s: la competència %d està numerada com a %s"
                            % (nom, i, c.get("n")))
            if not (c.get("desc") or "").strip():
                errs.append("%s: sense descripció" % marca)
            if not c.get("grups"):
                errs.append("%s: sense criteris d'avaluació" % marca)
            for g in c.get("grups", []):
                curs = g.get("curs")
                if not (curs or "").strip():
                    errs.append("%s: un grup de criteris sense curs" % marca)
                items = g.get("items", [])
                if not items:
                    errs.append("%s [%s]: grup buit" % (marca, curs))
                if codis_estrictes:
                    for j, it in enumerate(items, 1):
                        mc = RE_CODI.match(it.get("c") or "")
                        if (not mc or int(mc.group(1)) != c.get("n")
                                or int(mc.group(2)) != j):
                            errs.append("%s [%s]: el criteri %d té el codi %r"
                                        % (marca, curs, j, it.get("c")))
                else:
                    codis = [it.get("c") for it in items]
                    esperat = ["%s.%d" % (c.get("n"), k + 1) for k in range(len(codis))]
                    if codis and codis != esperat:
                        errs.append("%s [%s]: codis fora de seqüència: %s"
                                    % (marca, curs, ", ".join(map(str, codis))))
                for it in items:
                    if not (it.get("t") or "").strip():
                        errs.append("%s [%s]: criteri %s sense text"
                                    % (marca, curs, it.get("c")))

        if not u.get("sabers"):
            errs.append("%s: sense sabers" % nom)
        for g in u.get("sabers", []):
            curs = g.get("curs")
            if not (curs or "").strip():
                errs.append("%s: un grup de sabers sense curs" % nom)
            if not g.get("temes"):
                errs.append("%s sabers [%s]: sense temes" % (nom, curs))
            for t in g.get("temes", []):
                if not (t.get("tema") or "").strip():
                    errs.append("%s sabers [%s]: un tema sense títol" % (nom, curs))
                if not t.get("items"):
                    errs.append("%s sabers [%s]: el tema %r no té sabers"
                                % (nom, curs, t.get("tema")))
                for it in t.get("items", []):
                    if not (it.get("t") or "").strip():
                        errs.append("%s sabers [%s]: un saber sense text" % (nom, curs))
    return noms


def valida_curriculum_eso(doc) -> list:
    errs = []
    _valida_unitats(doc.get("materies", []), "una matèria", errs, codis_estrictes=True)
    return errs


def valida_curriculum_primaria(doc, equiv, materies_eso) -> list:
    errs = []
    arees = _valida_unitats(doc.get("arees", []), "una àrea", errs, codis_estrictes=False)

    # Les equivalències són el pont entre una matèria d'ESO i l'àrea de
    # primària de la qual se'n poden prendre criteris d'un nivell anterior.
    for mat, llista in equiv.items():
        if mat not in materies_eso:
            errs.append("equivalències: matèria desconeguda %r" % mat)
        vistes = set()
        for e in llista:
            area = e.get("area")
            if area not in arees:
                errs.append("%s: àrea de primària desconeguda %r" % (mat, area))
            if area in vistes:
                errs.append("%s: àrea repetida %r" % (mat, area))
            vistes.add(area)
            if e.get("relacio") not in RELACIONS:
                errs.append("%s: relació desconeguda %r (ha de ser %s)"
                            % (mat, e.get("relacio"), " o ".join(RELACIONS)))
            # Si la relació és parcial, el docent necessita saber en què ho és.
            if e.get("relacio") == "parcial" and not (e.get("nota") or "").strip():
                errs.append("%s: una relació parcial ha de portar nota per al docent" % mat)
    return errs


# --------------------------------------------------------------------------
# banc de mesures
# --------------------------------------------------------------------------

def valida_banc(doc, materies_eso, perfils_app) -> list:
    errs = []
    voc = doc.get("vocabulari", {})
    for clau in ("intensitats", "blocs", "tipus"):
        if not voc.get(clau):
            errs.append("el vocabulari no declara «%s»" % clau)
    if errs:
        return errs  # sense vocabulari no es pot comprovar cap mesura

    vistos = set()
    for x in doc.get("mesures", []):
        idx = x.get("id", "(sense id)")
        falten = [c for c in CAMPS_MESURA if c not in x]
        for c in falten:
            errs.append("%s: falta el camp «%s»" % (idx, c))
        if falten:
            continue  # la resta de comprovacions necessiten l'entrada completa

        if idx in vistos:
            errs.append("id duplicat: " + idx)
        vistos.add(idx)

        for camp, vocabulari in (("intensitat", "intensitats"),
                                 ("bloc", "blocs"),
                                 ("tipus", "tipus")):
            if x[camp] not in voc[vocabulari]:
                errs.append("%s: %s fora del vocabulari: %r" % (idx, camp, x[camp]))
        for p in x["perfils"]:
            if p not in perfils_app:
                errs.append("%s: perfil desconegut %r" % (idx, p))
        for m in x["materies"]:
            if m != "*" and m not in materies_eso:
                errs.append("%s: matèria desconeguda %r" % (idx, m))
        # La concreció és el text que entra al pla: cap mesura hi pot anar sense.
        for c in ("titol", "desc", "concrecio", "font"):
            if not str(x[c]).strip():
                errs.append("%s: el camp «%s» no pot ser buit" % (idx, c))
    return errs


def ordena_mesures(doc) -> list:
    """Mesures en l'ordre estable amb què s'incrusten: per bloc i després per id.

    L'ordre no és cosmètic: és el que veu qui fulleja el banc a l'aplicació, i
    fixar-lo aquí fa que dues construccions de les mateixes dades donin el
    mateix fitxer.
    """
    blocs = doc["vocabulari"]["blocs"]
    return sorted(doc["mesures"], key=lambda x: (blocs.index(x["bloc"]), x["id"]))


# --------------------------------------------------------------------------
# plantilles de perfil
# --------------------------------------------------------------------------

def _valida_plantilla(nom, bloc, ids_banc, errs):
    for c in ("resum", "evidencia"):
        if not str(bloc.get(c, "")).strip():
            errs.append("%s: el camp «%s» no pot ser buit" % (nom, c))
    mesures = bloc.get("mesures")
    if not isinstance(mesures, list) or not mesures:
        errs.append("%s: cal una llista «mesures» amb almenys una entrada" % nom)
        return
    vistes, nucli = set(), 0
    for m in mesures:
        mid = m.get("id", "(sense id)")
        if mid in vistes:
            errs.append("%s: la mesura %r hi surt més d'un cop" % (nom, mid))
        vistes.add(mid)
        if mid not in ids_banc:
            errs.append("%s: la mesura %r no existeix al banc de mesures" % (nom, mid))
        pr = m.get("prioritat")
        if pr not in PRIORITATS:
            errs.append("%s / %s: prioritat desconeguda %r (ha de ser %s)"
                        % (nom, mid, pr, " o ".join(PRIORITATS)))
        if pr == "nucli":
            nucli += 1
    # Sense cap mesura de nucli la proposta automàtica arribaria buida.
    if not nucli:
        errs.append("%s: cap mesura marcada com a «nucli»; la proposta arribaria buida" % nom)


def valida_perfils(doc, banc, perfils_app) -> list:
    errs = []
    ids_banc = {x["id"] for x in banc.get("mesures", [])}

    _valida_plantilla("base", doc.get("base", {}), ids_banc, errs)

    vistos = set()
    for pf in doc.get("perfils", []):
        nom = pf.get("perfil", "(sense perfil)")
        if nom in vistos:
            errs.append("perfil duplicat: " + nom)
        vistos.add(nom)
        if nom not in perfils_app:
            errs.append("%s: no és cap dels perfils de la llista PERFILS "
                        "de l'aplicació" % nom)
        if not str(pf.get("nom", "")).strip():
            errs.append("%s: el camp «nom» no pot ser buit" % nom)
        _valida_plantilla(nom, pf, ids_banc, errs)
    return errs


def perfils_sense_plantilla(doc, perfils_app) -> list:
    """Avís, no error: perfils que l'aplicació ofereix i encara no tenen plantilla."""
    amb = {pf.get("perfil") for pf in doc.get("perfils", [])}
    return [x for x in perfils_app if x not in amb]


def mesures_orfes(doc, banc) -> list:
    """Avís, no error: mesures del banc que cap plantilla no proposa mai."""
    usades = {m["id"] for m in doc.get("base", {}).get("mesures", [])}
    for pf in doc.get("perfils", []):
        usades |= {m["id"] for m in pf.get("mesures", [])}
    return [x["id"] for x in banc.get("mesures", []) if x["id"] not in usades]


# --------------------------------------------------------------------------
# comprovació completa
# --------------------------------------------------------------------------

def valida_tot() -> dict:
    """Valida totes les dades i retorna {àmbit: [errors]} (llistes buides si tot va bé)."""
    curr_eso = llegeix(rutes.CURRICULUM_ESO)
    curr_prim = llegeix(rutes.CURRICULUM_PRIMARIA)
    equiv = llegeix(rutes.EQUIVALENCIES)["equivalencies"]
    banc = llegeix(rutes.BANC)
    perfils = llegeix(rutes.PERFILS)

    materies = materies_de_l_eso(curr_eso)
    perfils_app = perfils_de_l_aplicacio()

    return {
        "currículum de l'ESO": valida_curriculum_eso(curr_eso),
        "currículum de primària": valida_curriculum_primaria(curr_prim, equiv, materies),
        "banc de mesures": valida_banc(banc, materies, perfils_app),
        "plantilles de perfil": valida_perfils(perfils, banc, perfils_app),
    }


def main(argv=None) -> int:
    # La consola de Windows no fa servir UTF-8 per defecte i els missatges
    # d'error, que són en català, hi sortirien il·legibles.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    problemes = valida_tot()
    total = sum(len(v) for v in problemes.values())
    for ambit, errs in problemes.items():
        print("%-26s %s" % (ambit, "%d error(s)" % len(errs) if errs else "correcte"))
        for e in errs:
            print("    - " + e)
    if total:
        print("\n%d error(s) en total." % total)
        return 1
    print("\nTotes les dades són coherents.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
