"""Munta el lloc publicat a `_site/`, a partir de `dist/` i de `web/`.

Què és el lloc publicat
-----------------------
La mateixa aplicació de sempre, servida per una adreça en comptes de baixada.
No és una versió diferent: `_site/index.html` és **el mateix fitxer**, byte a
byte, que `dist/pi-eso.html`. El que hi afegeix aquesta eina és el que un
fitxer únic no pot portar a dins —manifest, service worker i icones— i que
només té sentit quan hi ha un servidor al davant. Vegeu
`docs/adr/0006-versio-web-i-pwa.md`.

    dist/pi-eso.html ──┬──► _site/index.html     el que s'obre amb l'enllaç
                       └──► _site/pi-eso.html    el que baixa el botó
    web/*            ─────► _site/*              manifest, service worker, icones

El fitxer hi va dues vegades a propòsit. Com a `index.html` és l'aplicació; com
a `pi-eso.html` és l'artefacte descarregable, amb el mateix nom que a
*Releases* i al dipòsit, de manera que qui el baixi obtingui exactament el
fitxer que documenta el README.

La versió
---------
`web/sw.js` porta la marca `__VERSIO__`, que aquí se substitueix per la suma de
verificació del que es publica. El cau del navegador es renova, doncs, quan
canvia el contingut i no a cada desplegament: dos desplegaments idèntics donen
un lloc idèntic.

Ús
--
    python -m tools.pagines            # munta _site/
    python -m tools.pagines --silenci  # sense resum a la sortida

`_site/` no es versiona: el genera la feina de GitHub Actions
(`.github/workflows/pages.yml`) a cada publicació.
"""
from __future__ import annotations

import hashlib
import shutil
import sys

from . import build, rutes

MARCA_VERSIO = "__VERSIO__"

# El nom amb què es publica l'aplicació, i el nom amb què es baixa.
INDEX = "index.html"
DESCARREGA = "pi-eso.html"


class ErrorDePublicacio(Exception):
    """El lloc no es pot muntar amb el que hi ha al dipòsit."""


def peces_web() -> list:
    """Els fitxers de `web/`, ordenats pel nom.

    L'ordre és fix perquè la suma de verificació no pugui dependre de com el
    sistema de fitxers retorni la carpeta.
    """
    if not rutes.WEB.is_dir():
        raise ErrorDePublicacio("no hi ha la carpeta web/ amb el manifest i el service worker")
    return sorted((p for p in rutes.WEB.iterdir() if p.is_file()), key=lambda p: p.name)


def versio(aplicacio: bytes, peces) -> str:
    """Suma de verificació del contingut publicat, escurçada a 12 xifres.

    Hi entren l'aplicació i totes les peces de `web/`, cadascuna precedida del
    seu nom: canviar una icona també ha de renovar el cau, encara que el fitxer
    únic no s'hagi mogut.
    """
    h = hashlib.sha256()
    h.update(aplicacio)
    for p in peces:
        h.update(p.name.encode("utf-8"))
        h.update(p.read_bytes())
    return h.hexdigest()[:12]


def munta():
    """Escriu `_site/` i retorna la versió publicada i els fitxers que hi ha deixat."""
    if not rutes.SORTIDA.exists():
        raise ErrorDePublicacio(
            "no hi ha %s. Executeu «python -m tools.build»."
            % rutes.SORTIDA.relative_to(rutes.ARREL))
    if build.main(["--verifica", "--silenci"]) != 0:
        raise ErrorDePublicacio(
            "dist/pi-eso.html no correspon a src/ i data/: no es publica res desactualitzat")

    aplicacio = rutes.SORTIDA.read_bytes()
    peces = peces_web()
    marca = versio(aplicacio, peces)

    # Es buida i es torna a omplir: un fitxer que ja no toqui no s'hi pot quedar
    # d'un muntatge anterior. Es buida el contingut i no la carpeta mateixa
    # perquè a Windows no es pot esborrar un directori que algú tingui obert, i
    # el cas normal és tenir-hi un servidor local servint-lo per provar-ho.
    rutes.LLOC.mkdir(parents=True, exist_ok=True)
    for vell in rutes.LLOC.iterdir():
        if vell.is_dir():
            shutil.rmtree(vell)
        else:
            vell.unlink()

    (rutes.LLOC / INDEX).write_bytes(aplicacio)
    (rutes.LLOC / DESCARREGA).write_bytes(aplicacio)

    for p in peces:
        if p.suffix == ".md":
            continue                    # les notes de la carpeta no es publiquen
        if p.name == "sw.js":
            text = p.read_text(encoding="utf-8")
            if MARCA_VERSIO not in text:
                raise ErrorDePublicacio("web/sw.js ja no porta la marca %s" % MARCA_VERSIO)
            (rutes.LLOC / p.name).write_text(
                text.replace(MARCA_VERSIO, marca), encoding="utf-8", newline="")
        else:
            shutil.copyfile(p, rutes.LLOC / p.name)

    return marca, sorted(q.name for q in rutes.LLOC.iterdir())


def main(argv=None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    argv = list(sys.argv[1:] if argv is None else argv)
    silenci = "--silenci" in argv
    desconegudes = [a for a in argv if a != "--silenci"]
    if desconegudes:
        print("ERROR: opció desconeguda: " + " ".join(desconegudes))
        return 2

    try:
        marca, fitxers = munta()
    except ErrorDePublicacio as e:
        print("ERROR: %s" % e)
        return 1

    if not silenci:
        total = sum((rutes.LLOC / f).stat().st_size for f in fitxers)
        print("Lloc muntat a %s" % rutes.LLOC.relative_to(rutes.ARREL))
        print("  %-28s %s" % ("versió", marca))
        print("  %-28s %d fitxers, %.2f MB" % ("contingut", len(fitxers), total / 1024 / 1024))
        for f in fitxers:
            print("    %-26s %8d bytes" % (f, (rutes.LLOC / f).stat().st_size))
    return 0


if __name__ == "__main__":
    sys.exit(main())
