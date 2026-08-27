"""La construcció: que doni sempre el mateix i que `dist/` no quedi enrere."""
import re

from tools import build, rutes


def test_la_construccio_es_determinista():
    """Dues construccions seguides de les mateixes fonts han de donar el mateix fitxer.

    Si això falla, hi ha alguna cosa que depèn de l'ordre d'un diccionari, de
    l'hora o del sistema de fitxers, i el fitxer distribuït deixa de ser
    comprovable per suma de verificació.
    """
    assert build.construeix() == build.construeix()


def test_dist_correspon_a_les_fonts():
    """`dist/pi-eso.html` ha de ser el que surt de `src/` i `data/` d'ara.

    És la comprovació que impedeix que algú publiqui una versió del fitxer únic
    que ja no correspon al codi del dipòsit.
    """
    assert build.main(["--verifica", "--silenci"]) == 0, (
        "dist/pi-eso.html no està al dia: executeu «python -m tools.build»")


def test_no_hi_queda_cap_marca_de_construccio(html):
    assert "<<<INSERTA:" not in html


def test_les_llistes_de_moduls_cobreixen_les_carpetes():
    """Cap fitxer de `src/` es pot quedar fora del fitxer distribuït sense avisar."""
    assert {p.name for p in rutes.ESTILS.iterdir() if p.is_file()} == set(build.ESTILS)
    assert {p.name for p in rutes.APLICACIO.iterdir() if p.is_file()} == set(build.APLICACIO)


def test_l_arrencada_es_l_ultim_modul():
    """L'arrencada toca el DOM: tot el que hi crida ha d'estar definit abans."""
    assert build.APLICACIO[-1] == "99-arrencada.js"


def test_el_document_es_un_sol_fitxer_sense_recursos_carregats(html):
    """Res del que el navegador ha de baixar per pintar l'aplicació pot ser extern.

    L'única excepció són els tipus de lletra de Google, que estan pensats per
    fallar de manera benigna: si no hi ha connexió, el navegador cau a la font
    del sistema i l'aplicació segueix sent utilitzable. Els enllaços que ha de
    clicar una persona (normativa, llicència) sí que poden ser externs.
    """
    externs = re.findall(r'<(?:script|img|iframe)\b[^>]*\bsrc="([^"]+)"', html)
    externs += re.findall(r'<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"', html)
    permesos = ("https://fonts.googleapis.com/", "https://fonts.gstatic.com/")
    dolents = [u for u in externs if u.startswith(("http://", "https://", "//"))
               and not u.startswith(permesos)]
    assert dolents == [], "recursos externs no permesos: %s" % dolents


def test_cap_enllac_sense_xifrar(html):
    """Cap adreça navegable en clar.

    L'espai de noms XML de l'SVG de la icona (`http://www.w3.org/2000/svg`)
    no compta: és un identificador, no una adreça que es visiti.
    """
    clar = re.findall(r'(?:href|src|action)="(http://[^"]+)"', html)
    assert clar == [], "adreces sense xifrar: %s" % clar


def test_els_enllacos_externs_no_filtren_la_pagina(html):
    """Tot `target="_blank"` ha de portar `rel="noopener"`.

    Sense això, la pàgina que s'obre pot manipular la finestra d'origen, que
    aquí conté dades d'alumnat.
    """
    for etiqueta in re.findall(r"<a\b[^>]*>", html):
        if 'target="_blank"' in etiqueta:
            assert "noopener" in etiqueta, "enllaç sense noopener: " + etiqueta


def test_el_document_es_declara_en_catala_i_utf8(html):
    assert html.startswith("<!DOCTYPE html>\n<html lang=\"ca\">")
    assert '<meta charset="utf-8">' in html


def test_hi_ha_un_sol_bloc_de_codi(html):
    """Un únic `<script>` executable: la resta són dades i no s'analitzen com a codi."""
    assert len(re.findall(r"<script>", html)) == 1
    assert len(re.findall(r'<script id="[^"]+" type="application/json">', html)) == 3


def test_el_fitxer_es_prou_petit_per_enviar_per_correu(html):
    mb = len(html.encode("utf-8")) / 1024 / 1024
    assert mb < 2.0, "el fitxer distribuït ha crescut fins a %.2f MB" % mb
