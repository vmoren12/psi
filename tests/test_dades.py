"""Comprovacions sobre les dades de `data/`.

El que hi ha aquí acaba, literalment, dins d'un document que un centre
educatiu signa i lliura a una família. Els errors de dades no són defectes
d'interfície: són text equivocat en un document oficial.
"""
import json
import re

import pytest

from tools import rutes, valida

RE_ID_MESURA = re.compile(r"^(?:U|AD|IN)-[A-Z]{3}-\d{2}$|^AD\d{2}$")


@pytest.mark.parametrize("ambit", ["currículum de l'ESO", "currículum de primària",
                                   "banc de mesures", "plantilles de perfil"])
def test_les_dades_passen_la_validacio(ambit):
    errs = valida.valida_tot()[ambit]
    assert errs == [], "%s: %s" % (ambit, "; ".join(errs))


def test_extra_files_es_igual_a_les_dues_bandes():
    """La llista de matèries que no són de l'annex 3 viu al codi i a la validació.

    Estan duplicades a propòsit —el codi no pot importar Python i la validació
    no pot executar JavaScript— però han de dir el mateix, o el validador
    acceptaria mesures que l'aplicació no sabria on posar.
    """
    js = (rutes.APLICACIO / "01-referencies.js").read_text(encoding="utf-8")
    m = re.search(r"const EXTRA_FILES = \[(.*?)\];", js, re.S)
    assert m, "no es troba EXTRA_FILES a src/app/01-referencies.js"
    assert json.loads("[" + m.group(1) + "]") == valida.EXTRA_FILES


def test_els_identificadors_de_mesura_segueixen_la_convencio(banc):
    dolents = [x["id"] for x in banc["mesures"] if not RE_ID_MESURA.match(x["id"])]
    assert dolents == [], "identificadors fora de convenció: %s" % dolents


def test_la_inicial_de_l_identificador_concorda_amb_la_intensitat(banc):
    """`U-…` universal, `AD-…` addicional, `IN-…` intensiva.

    Sense això, un identificador pot dir una intensitat i el camp una altra, i
    a la fitxa de la mesura hi surten totes dues.

    Els identificadors curts `ADnn` queden fora de la comprovació: són una
    numeració anterior a aquesta convenció i el prefix hi és correlatiu, no
    descriptiu (n'hi ha vuit que són mesures universals). No es renumeren
    perquè poden constar a plans ja redactats i desats en dispositius de
    centres; la convenció s'aplica només als identificadors nous.
    """
    esperat = {"U": "Universal", "AD": "Addicional", "IN": "Intensiva"}
    dolents = []
    for x in banc["mesures"]:
        if "-" not in x["id"]:
            continue
        prefix = x["id"].split("-")[0]
        if esperat.get(prefix) != x["intensitat"]:
            dolents.append("%s és %s" % (x["id"], x["intensitat"]))
    assert dolents == [], "; ".join(dolents)


def test_cap_mesura_repeteix_titol(banc):
    """Dues mesures amb el mateix títol són indistingibles a la finestra del banc."""
    titols = [x["titol"].strip().lower() for x in banc["mesures"]]
    repetits = sorted({t for t in titols if titols.count(t) > 1})
    assert repetits == [], "títols repetits: %s" % repetits


def test_tota_mesura_diu_d_on_surt(banc):
    """El camp `font` és el que permet a un centre defensar la mesura davant d'una inspecció."""
    for x in banc["mesures"]:
        assert x["font"].strip(), "%s no diu de quin document surt" % x["id"]


def test_les_plantilles_cobreixen_tots_els_perfils(perfils):
    """Cada perfil que l'aplicació ofereix ha de tenir proposta de mesures.

    Un perfil sense plantilla es pot triar a la fitxa de l'alumne/a però no
    proposa res, i qui l'ha triat no en sap el motiu.
    """
    sense = valida.perfils_sense_plantilla(perfils, valida.perfils_de_l_aplicacio())
    assert sense == [], "perfils sense plantilla: %s" % sense


def test_el_curriculum_declara_la_seva_font(curriculum_primaria):
    assert "175/2022" in curriculum_primaria.get("font", "")


def test_les_equivalencies_parcials_expliquen_en_que_ho_son(equivalencies):
    """Una relació parcial sense nota deixa el docent sense saber què pot agafar."""
    for materia, llista in equivalencies.items():
        for e in llista:
            if e["relacio"] == "parcial":
                assert e.get("nota", "").strip(), "%s → %s" % (materia, e["area"])


def test_cap_criteri_es_queda_sense_text(curriculum_eso):
    buits = [
        "%s %s" % (m["nom"], it.get("c"))
        for m in curriculum_eso["materies"] if "ref" not in m
        for c in m["ce"] for g in c["grups"] for it in g["items"]
        if not (it.get("t") or "").strip()
    ]
    assert buits == []


def test_l_extraccio_no_ha_deixat_glifs_corromputs(curriculum_eso, curriculum_primaria):
    """Restes de l'extracció dels PDF del DOGC.

    Les fonts dels annexos porten una taula ToUnicode incompleta i, quan
    l'extracció falla, el text no s'espatlla de manera visible: hi apareixen
    caràcters de control o símbols isolats enmig d'una paraula correcta. Es
    detecten així i no llegint, perquè passen desapercebuts a la lectura.
    """
    def textos(doc, clau):
        for u in doc[clau]:
            if "ref" in u:
                continue
            for c in u["ce"]:
                yield c["desc"]
                for g in c["grups"]:
                    for it in g["items"]:
                        yield it["t"]
            for g in u.get("sabers", []):
                for t in g["temes"]:
                    for it in t["items"]:
                        yield it["t"]

    sospitos = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]|µ|�")
    for doc, clau in ((curriculum_eso, "materies"), (curriculum_primaria, "arees")):
        for t in textos(doc, clau):
            assert not sospitos.search(t), "text amb glifs corromputs: %r" % t[:80]


def test_els_fitxers_de_dades_estan_en_utf8_sense_bom():
    for ruta in sorted(rutes.DADES.glob("*.json")):
        cru = ruta.read_bytes()
        assert not cru.startswith(b"\xef\xbb\xbf"), "%s porta BOM" % ruta.name
        cru.decode("utf-8")
