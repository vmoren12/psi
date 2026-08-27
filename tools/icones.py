"""Genera les icones de la versió web a partir de la marca de l'aplicació.

Per què són fitxers i no una icona incrustada
---------------------------------------------
El fitxer únic porta la seva icona de pestanya dins del document, com la resta
(un SVG a `src/index.html`). Però per instal·lar l'aplicació —el manifest, la
pantalla d'inici d'Android, «Afegeix a la pantalla d'inici» d'iOS— el navegador
exigeix imatges de mida coneguda i, a iOS, opaques i en PNG. Han de ser fitxers
del costat, i per això viuen a `web/` i només existeixen al lloc publicat.

Es generen un cop i es versionen. Aquesta eina **no s'executa a la construcció
ni a la integració contínua**: `python -m tools.build` continua necessitant
només la biblioteca estàndard. Només cal tornar-la a executar si canvia la
marca, i llavors demana Pillow:

    python -m pip install pillow
    python -m tools.icones

La geometria és la mateixa de l'SVG de la pestanya, expressada sobre un llenç
de 512: rectangle de cantons arrodonits del color de tinta, «PI» en cursiva
romana blanca i el filet verd a sota. El factor `k` encongeix el contingut cap
al centre per a la variant «maskable», que Android retalla amb la forma que
tingui el sistema i de la qual només garanteix el 80 % central.
"""
from __future__ import annotations

import sys
from pathlib import Path

from . import rutes

INK = (20, 29, 35, 255)      # --ink    #141d23
BLANC = (255, 255, 255, 255)
MET = (31, 107, 92, 255)     # --met    #1f6b5c

# Sobremostreig: es dibuixa a 4× i es redueix amb Lanczos. És la manera
# d'obtenir cantons i corbes nets sense demanar antialiàsing a ImageDraw, que
# no en té.
SOBRE = 4

# Tipus de lletra amb serifa, per ordre de preferència. DejaVu Serif és la
# primera perquè hi és tant a Windows com a les màquines de Linux on es podria
# voler regenerar això, i per tant dona el mateix resultat a totes dues.
SERIFES = [
    "DejaVuSerif-Bold.ttf",
    "Georgia Bold.ttf", "georgiab.ttf",
    "LiberationSerif-Bold.ttf",
    "NotoSerif-Bold.ttf",
    "timesbd.ttf",
]
CARPETES = [
    Path("C:/Windows/Fonts"),
    Path("/usr/share/fonts/truetype/dejavu"),
    Path("/usr/share/fonts/truetype/liberation"),
    Path("/usr/share/fonts"),
    Path("/Library/Fonts"),
    Path("/System/Library/Fonts/Supplemental"),
]

# Les icones que necessita el manifest, més la d'iOS.
#   nom, mida, contingut (k), fons ple
PECES = [
    ("icona-192.png", 192, 1.0, False),
    ("icona-512.png", 512, 1.0, False),
    ("icona-maskable-512.png", 512, 0.62, True),
    ("icona-180.png", 180, 1.0, True),
]


class ErrorDIcones(Exception):
    """No es pot generar la imatge."""


def troba_serifa() -> Path:
    for carpeta in CARPETES:
        if not carpeta.is_dir():
            continue
        for nom in SERIFES:
            cami = carpeta / nom
            if cami.is_file():
                return cami
        # Alguns sistemes reparteixen les DejaVu en subcarpetes.
        for nom in SERIFES:
            trobat = next(carpeta.rglob(nom), None)
            if trobat is not None:
                return trobat
    raise ErrorDIcones(
        "no s'ha trobat cap tipus de lletra amb serifa (%s) a %s"
        % (", ".join(SERIFES), ", ".join(str(c) for c in CARPETES)))


def cos_per_alcada(ImageFont, cami: Path, objectiu: int) -> int:
    """El cos de lletra amb què «PI» fa exactament `objectiu` píxels d'alt.

    Es busca per bisecció en comptes de calcular-lo a partir de les mètriques
    perquè l'alçada de majúscula varia entre tipus i el que s'ha de mantenir
    constant és el que es veu, no el que declara la font.
    """
    baix, dalt = 4, max(8, objectiu * 4)
    while baix < dalt:
        mig = (baix + dalt + 1) // 2
        caixa = ImageFont.truetype(str(cami), mig).getbbox("PI")
        if caixa[3] - caixa[1] <= objectiu:
            baix = mig
        else:
            dalt = mig - 1
    return baix


def dibuixa(Image, ImageDraw, ImageFont, serifa: Path, mida: int, k: float, fons_ple: bool):
    n = mida * SOBRE
    u = n / 512.0                      # unitats del disseny de 512 → píxels
    centre = 256.0

    def p(v):                          # coordenada del disseny, encongida cap al centre
        return (centre + (v - centre) * k) * u

    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if fons_ple:
        d.rectangle([0, 0, n, n], fill=INK)
    else:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=round(112 * u), fill=INK)

    # «PI»: 190 unitats d'alçada d'ull, centrat i recolzat sobre la línia 320,
    # que és on el situa l'SVG de la pestanya.
    cos = cos_per_alcada(ImageFont, serifa, round(190 * k * u))
    lletra = ImageFont.truetype(str(serifa), cos)
    caixa = lletra.getbbox("PI")
    x = (n - (caixa[2] - caixa[0])) / 2 - caixa[0]
    d.text((x, p(320) - caixa[3]), "PI", font=lletra, fill=BLANC)

    # El filet verd de sota.
    d.rounded_rectangle([p(144), p(368), p(368), p(408)], radius=16 * k * u, fill=MET)

    return img.resize((mida, mida), Image.LANCZOS)


def main(argv=None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("ERROR: cal Pillow per generar les icones: python -m pip install pillow")
        return 1

    try:
        serifa = troba_serifa()
    except ErrorDIcones as e:
        print("ERROR: %s" % e)
        return 1

    rutes.WEB.mkdir(parents=True, exist_ok=True)
    print("tipus de lletra: %s" % serifa)
    for nom, mida, k, ple in PECES:
        img = dibuixa(Image, ImageDraw, ImageFont, serifa, mida, k, ple)
        desti = rutes.WEB / nom
        img.save(desti, "PNG", optimize=True)
        print("  %-26s %d×%d  %d bytes" % (nom, mida, mida, desti.stat().st_size))
    return 0


if __name__ == "__main__":
    sys.exit(main())
