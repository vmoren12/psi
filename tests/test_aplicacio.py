"""Comprovacions sobre el codi de l'aplicació.

Tot el codi de `src/app/` es concatena dins d'un únic `<script>` clàssic i
comparteix, doncs, un sol àmbit global. Això té dues conseqüències que aquí es
vigilen: cap nom no es pot declarar dues vegades, i tot el que criden els
atributs `onclick` de la interfície ha d'existir realment.
"""
import re

import pytest

from tools import build, rutes

# Noms que el navegador ja proporciona i que, per tant, no cal que declari
# ningú del projecte.
GLOBALS_DEL_NAVEGADOR = {
    "window", "document", "console", "Object", "Array", "String", "Number",
    "Boolean", "JSON", "Math", "Date", "Set", "Map", "Promise", "RegExp",
    "parseInt", "parseFloat", "isNaN", "setTimeout", "setInterval", "alert",
    "confirm", "prompt", "encodeURIComponent", "decodeURIComponent", "fetch",
    "print", "if", "for", "while", "return", "typeof", "switch", "catch",
}


def declarades(codi):
    """Noms declarats al nivell superior del codi de l'aplicació."""
    noms = set(re.findall(r"^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", codi, re.M))
    noms |= set(re.findall(r"^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=", codi, re.M))
    return noms


def invocades_des_dels_gestors(text):
    """Noms de funció que apareixen dins d'un atribut `on...="..."`.

    S'exclouen els noms precedits de punt, que són crides a mètodes d'un
    objecte (`llista.filter(...)`) i no funcions del projecte.
    """
    noms = set()
    for m in re.finditer(r'\bon[a-z]+\s*=\s*(["\'])(.*?)\1', text, re.S):
        noms |= set(re.findall(r"(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(", m.group(2)))
    return noms


def test_els_gestors_en_linia_criden_funcions_que_existeixen(codi):
    """La interfície es pinta amb cadenes: cap `onclick` pot quedar orfe.

    És la xarxa de seguretat de la separació en mòduls. Si algú mou codi de
    lloc, en canvia el nom o esborra una funció que només es crida des d'un
    atribut d'HTML, cap eina de JavaScript no se n'adonaria; això sí.
    """
    plantilla = rutes.PLANTILLA.read_text(encoding="utf-8")
    disponibles = declarades(codi) | GLOBALS_DEL_NAVEGADOR
    orfes = sorted(invocades_des_dels_gestors(plantilla + codi) - disponibles)
    assert orfes == [], "gestors que criden funcions inexistents: %s" % orfes


def test_cap_nom_declarat_dues_vegades(codi):
    """Dos mòduls no poden declarar el mateix nom: el segon guanyaria en silenci."""
    noms = re.findall(r"^(?:(?:async\s+)?function\s+|(?:const|let|var)\s+)"
                      r"([A-Za-z_$][\w$]*)", codi, re.M)
    repetits = sorted({n for n in noms if noms.count(n) > 1})
    assert repetits == [], "noms declarats més d'un cop: %s" % repetits


@pytest.mark.parametrize("modul", build.APLICACIO)
def test_cada_modul_comenca_amb_una_explicacio(modul):
    """Cada mòdul ha de dir de què va abans de la primera línia de codi."""
    text = (rutes.APLICACIO / modul).read_text(encoding="utf-8").lstrip()
    assert text.startswith("/*"), "%s no comença amb un comentari de capçalera" % modul


@pytest.mark.parametrize("modul", build.APLICACIO)
def test_cap_modul_es_desmesurat(modul):
    """Un mòdul de més de 700 línies torna a ser el problema que s'ha resolt."""
    linies = (rutes.APLICACIO / modul).read_text(encoding="utf-8").count("\n")
    assert linies <= 700, "%s té %d línies: convé partir-lo" % (modul, linies)


def test_les_dades_del_navegador_es_llegeixen_com_a_dades(codi):
    """El currículum entra amb `JSON.parse`, mai executant-lo com a codi.

    És el que garanteix que un apòstrof o una barra dins d'un criteri
    d'avaluació del DOGC no puguin trencar —ni alterar— l'aplicació.
    """
    for identificador in ("curriculum-data", "curriculum-primaria-data",
                          "equivalencies-primaria-data"):
        patro = r'JSON\.parse\(document\.getElementById\("%s"\)\.textContent\)' % identificador
        assert re.search(patro, codi), "%s no es llegeix amb JSON.parse" % identificador


def test_el_text_de_l_usuari_s_escapa_abans_de_pintar_lo(codi):
    """Ha d'existir una única funció d'escapament i ha de cobrir els quatre caràcters."""
    m = re.search(r"^const esc = .*$", codi, re.M)
    assert m, "no es troba la funció esc()"
    for c in ("&", "<", ">", '"'):
        assert repr(c).strip("'") in m.group(0) or c in m.group(0)


def test_les_dades_es_desen_nomes_al_navegador(codi):
    """Cap crida de xarxa: les dades d'alumnat no poden sortir del dispositiu.

    És la promesa que fa l'aplicació a la barra lateral i el motiu pel qual un
    centre la pot fer servir sense encàrrec de tractament amb ningú.
    """
    for prohibit in ("fetch(", "XMLHttpRequest", "navigator.sendBeacon", "new WebSocket"):
        assert prohibit not in codi, "el codi conté %s" % prohibit
