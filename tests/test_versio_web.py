"""La versió publicada: que no contamini el fitxer únic i que no filtri res.

L'aplicació té dues formes de distribució i una sola font. Aquestes proves
vigilen la frontera entre totes dues:

- el fitxer que es baixa **no pot** referenciar res del que només existeix al
  servidor, perquè obert des d'un llapis de memòria ha de continuar sent
  autònom i no donar cap error;
- el que s'hi afegeix al servidor —manifest, service worker i icones— ha de ser
  coherent i **no pot enviar dades enlloc**.
"""
import json
import re
import struct

import pytest

from tools import pagines, rutes

MANIFEST = rutes.WEB / "manifest.webmanifest"
SW = rutes.WEB / "sw.js"


@pytest.fixture(scope="session")
def manifest():
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def sw():
    return SW.read_text(encoding="utf-8")


def mida_png(cami):
    """Amplada i alçada declarades a la capçalera IHDR d'un PNG."""
    dades = cami.read_bytes()
    assert dades[:8] == b"\x89PNG\r\n\x1a\n", "%s no és un PNG" % cami.name
    return struct.unpack(">II", dades[16:24])


def cos_de(codi, nom):
    """El cos d'una funció del mòdul, per poder comprovar-la per separat.

    Les funcions del projecte es tanquen amb una clau a la primera columna, de
    manera que això no necessita entendre JavaScript.
    """
    m = re.search(r"^(?:async )?function %s\(\)\{$(.*?)^\}$" % nom, codi, re.M | re.S)
    assert m, "no s'ha trobat la funció %s()" % nom
    return m.group(1)


# --------------------------------------------------------------------------
# la frontera amb el fitxer únic
# --------------------------------------------------------------------------

def test_el_fitxer_unic_no_referencia_cap_recurs_del_servidor(html):
    """Cap etiqueta del document no pot apuntar a un fitxer de `web/`.

    És el que fa que la còpia baixada continuï sent un sol fitxer: els enllaços
    al manifest i a la icona d'inici els injecta `arrencaVersioWeb()` en temps
    d'execució, i només quan el document se serveix per http(s). Si algú els
    posés a `src/index.html`, la còpia oberta des del disc buscaria fitxers que
    no hi són i ompliria la consola d'errors.
    """
    noms = [p.name for p in rutes.WEB.iterdir() if p.is_file() and p.suffix != ".md"]
    for etiqueta in re.findall(r"<(?:link|script|img|iframe)\b[^>]*>", html):
        for nom in noms:
            assert nom not in etiqueta, "el document referencia %s: %s" % (nom, etiqueta)


def test_la_versio_web_nomes_s_activa_amb_http(codi):
    """El mòdul de la versió web ha de comprovar el protocol abans de fer res."""
    assert 'location.protocol === "http:"' in codi
    assert 'location.protocol === "https:"' in codi
    assert re.search(r"function arrencaVersioWeb\(\)\{\s*if\(!SERVIT_PER_WEB\) return;", codi), \
        "arrencaVersioWeb() no surt immediatament quan no se serveix per web"


def test_el_boto_de_descarrega_va_just_darrere_del_de_l_avis():
    """La posició del botó es resol amb un selector de germà adjacent.

    `.avis-obre.on + .baixa-app` és el que el fa pujar per sobre del botó rodó
    quan l'avís està amagat. Si algú separa els dos botons al document, el de
    descàrrega se solaparia amb l'altre sense que res avisés.
    """
    plantilla = rutes.PLANTILLA.read_text(encoding="utf-8")
    darrere = plantilla.split('id="avis-obre"', 1)[1]
    entremig = darrere.split('<button class="baixa-app"', 1)[0].split("</button>", 1)[1]
    entremig = re.sub(r"<!--.*?-->", "", entremig, flags=re.S)
    assert "<" not in entremig, \
        "entre #avis-obre i #baixa-app hi ha aparegut un altre element: %r" % entremig
    full = (rutes.ESTILS / "15-avis.css").read_text(encoding="utf-8")
    assert ".avis-obre.on + .baixa-app" in full


# --------------------------------------------------------------------------
# el manifest i les icones
# --------------------------------------------------------------------------

def test_el_manifest_te_el_que_cal_per_instal_lar(manifest):
    for clau in ("name", "short_name", "start_url", "scope", "display",
                 "background_color", "theme_color", "icons", "lang"):
        assert clau in manifest, "al manifest hi falta %s" % clau
    assert manifest["display"] == "standalone"
    assert manifest["lang"] == "ca"


def test_el_manifest_no_lliga_l_aplicacio_a_cap_domini(manifest):
    """Rutes relatives, sempre.

    Amb rutes absolutes el lloc només funcionaria a l'arrel d'un domini, i
    l'adreça de GitHub Pages penja d'un subdirectori. Amb relatives, el mateix
    manifest serveix per a totes dues.
    """
    camins = [manifest["start_url"], manifest["scope"]] + [i["src"] for i in manifest["icons"]]
    for c in camins:
        assert not c.startswith(("/", "http://", "https://")), "ruta absoluta al manifest: %s" % c


def test_les_icones_del_manifest_existeixen_i_fan_la_mida_que_diuen(manifest):
    for icona in manifest["icons"]:
        cami = rutes.WEB / icona["src"]
        assert cami.is_file(), "falta la icona %s" % icona["src"]
        amplada, alcada = mida_png(cami)
        assert "%dx%d" % (amplada, alcada) == icona["sizes"], \
            "%s fa %dx%d i el manifest en diu %s" % (icona["src"], amplada, alcada, icona["sizes"])


def test_hi_ha_icona_emmascarable_i_icona_per_a_ios(manifest):
    """Android retalla la icona amb la forma del sistema; iOS no llegeix el manifest."""
    finalitats = {i.get("purpose", "any") for i in manifest["icons"]}
    assert "maskable" in finalitats, "cap icona amb purpose maskable"
    ios = rutes.WEB / "icona-180.png"
    assert ios.is_file(), "falta icona-180.png, la que fa servir «Afegeix a la pantalla d'inici»"
    assert mida_png(ios) == (180, 180)
    modul = (rutes.APLICACIO / "09-versio-web.js").read_text(encoding="utf-8")
    assert 'posa("apple-touch-icon", "icona-180.png")' in modul


# --------------------------------------------------------------------------
# la tria entre instal·lar i baixar
# --------------------------------------------------------------------------

def test_el_boto_obre_la_tria_i_no_baixa_directament(codi):
    """El cercle no descarrega: pregunta.

    Les dues maneres d'endur-se l'aplicació no són equivalents —instal·lar-la
    conserva els plans i s'actualitza sola; baixar el fitxer deixa una còpia
    buida i congelada— i qui hi clica no té per què saber-ho.
    """
    plantilla = rutes.PLANTILLA.read_text(encoding="utf-8")
    assert 'onclick="obtenAplicacio()"' in plantilla
    for nom in ("function obtenAplicacio(", "function instalAplicacio(",
                "function baixaFitxerUnic("):
        assert nom in codi, "falta %s" % nom


def test_l_opcio_d_instal_lar_nomes_surt_quan_es_pot_instal_lar(codi):
    """Un botó «Instal·la» que no fes res seria pitjor que no tenir-ne cap.

    Safari i Firefox no disparen `beforeinstallprompt`, i una aplicació que ja
    corre instal·lada tampoc. En tots dos casos el diàleg ha de mostrar una
    altra cosa: la instrucció manual, o res.
    """
    bloc = cos_de(codi, "opcioInstal")
    assert 'if(jaInstalLada()) return "";' in bloc
    assert "if(convitInstal){" in bloc
    assert "note info" in bloc, "sense convit s'ha d'explicar com s'instal·la a mà"


def test_el_convit_d_instal_lacio_es_rete_i_es_deixa_anar(codi):
    """Es reté el convit del navegador i s'allibera quan ja no serveix."""
    assert 'window.addEventListener("beforeinstallprompt"' in codi
    assert "e.preventDefault();" in codi, "sense això surt també la barra automàtica"
    assert 'window.addEventListener("appinstalled"' in codi
    instal = cos_de(codi, "instalAplicacio")
    assert "convitInstal = null;" in instal, "el convit només es pot fer servir un cop"


def test_l_avis_de_copia_buida_va_nomes_a_l_opcio_de_baixar(codi):
    """Instal·lar no canvia d'origen: allà els plans es conserven i no toca avisar."""
    baixar = cos_de(codi, "opcioDescarrega")
    instalar = cos_de(codi, "opcioInstal")
    assert "Es baixa buit" in baixar
    assert "buit" not in instalar
    assert "es conserven" in instalar


# --------------------------------------------------------------------------
# el service worker
# --------------------------------------------------------------------------

def test_el_service_worker_no_envia_res_enlloc(sw):
    """La promesa de privadesa ha de valer també per a la versió publicada.

    El service worker veu passar totes les peticions de l'aplicació. Aquí es
    comprova que no en pugui originar cap de nova: només respon a les que rep.
    """
    for prohibit in ("XMLHttpRequest", "sendBeacon", "new WebSocket", "EventSource",
                     "importScripts", "postMessage("):
        assert prohibit not in sw, "el service worker conté %s" % prohibit
    for crida in re.findall(r"fetch\(([^)]*)\)", sw):
        assert crida.strip() == "peticio", \
            "el service worker fa una petició que no ve del navegador: fetch(%s)" % crida


def test_el_service_worker_nomes_guarda_el_seu_origen_i_els_tipus_de_lletra(sw):
    """Res d'un tercer no s'ha de poder colar al cau."""
    assert "url.origin !== self.location.origin" in sw
    dominis = set(re.findall(r'u\.hostname === "([^"]+)"', sw))
    assert dominis == {"fonts.googleapis.com", "fonts.gstatic.com"}, \
        "dominis externs inesperats al service worker: %s" % sorted(dominis)


def test_el_que_guarda_el_service_worker_existeix_de_debo(sw):
    """Si un fitxer de la llista essencial no hi és, la instal·lació falla sencera.

    I amb ella el mode sense connexió, en silenci i només per a qui obri el lloc
    després del desplegament.
    """
    bloc = sw.split("const ESSENCIAL = [", 1)[1].split("];", 1)[0]
    llista = re.findall(r'"\./([^"]*)"', bloc)
    assert llista, "no s'ha pogut llegir la llista ESSENCIAL"
    for nom in llista:
        if nom == "":
            continue                    # "./" és el document mateix
        assert (rutes.WEB / nom).is_file(), "el service worker precarrega %s, que no hi és" % nom


def test_el_service_worker_porta_la_marca_de_versio(sw):
    assert pagines.MARCA_VERSIO in sw


# --------------------------------------------------------------------------
# el muntatge del lloc
# --------------------------------------------------------------------------

def test_el_lloc_publicat_serveix_exactament_el_fitxer_del_diposit(tmp_path, monkeypatch):
    """`_site/index.html` ha de ser `dist/pi-eso.html`, byte a byte.

    És el que permet dir a qui ho vulgui comprovar que l'aplicació que corre a
    l'adreça pública és la mateixa que es baixa i que es pot verificar per suma
    de verificació.
    """
    monkeypatch.setattr(rutes, "LLOC", tmp_path / "_site")
    marca, fitxers = pagines.munta()
    aplicacio = rutes.SORTIDA.read_bytes()
    assert (tmp_path / "_site" / "index.html").read_bytes() == aplicacio
    assert (tmp_path / "_site" / "pi-eso.html").read_bytes() == aplicacio
    assert set(fitxers) >= {"index.html", "pi-eso.html", "manifest.webmanifest", "sw.js"}
    assert "README.md" not in fitxers, "les notes de web/ no s'han de publicar"
    assert re.fullmatch(r"[0-9a-f]{12}", marca)


def test_el_muntatge_substitueix_la_versio_del_service_worker(tmp_path, monkeypatch):
    monkeypatch.setattr(rutes, "LLOC", tmp_path / "_site")
    marca, _ = pagines.munta()
    publicat = (tmp_path / "_site" / "sw.js").read_text(encoding="utf-8")
    assert pagines.MARCA_VERSIO not in publicat
    assert 'const VERSIO = "%s"' % marca in publicat


def test_la_versio_depen_del_contingut_i_de_res_mes(tmp_path, monkeypatch):
    """Dos muntatges del mateix dipòsit han de donar la mateixa versió.

    Si depengués de l'hora o del número de desplegament, cada publicació
    invalidaria el cau de tothom i l'aplicació es tornaria a baixar sencera
    sense cap motiu.
    """
    monkeypatch.setattr(rutes, "LLOC", tmp_path / "un")
    primera, _ = pagines.munta()
    monkeypatch.setattr(rutes, "LLOC", tmp_path / "dos")
    segona, _ = pagines.munta()
    assert primera == segona
