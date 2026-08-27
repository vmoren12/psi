# -*- coding: utf-8 -*-
"""
Extreu el currículum d'educació secundària obligatòria de l'annex 3 del
Decret 175/2022 i genera data/curriculum-eso.json.

    python -m tools.extraccio.curriculum_eso
    python -m tools.build   (incrusta el JSON a dist/pi-eso.html)

Per què cal aquest script
-------------------------
El PDF oficial (referencies/curriculum/Annex_3_Secundaria.pdf) porta les fonts Arial
incrustades com a subconjunts Identity-H amb un CMap /ToUnicode incomplet:
només 42 dels glifs de l'Arial Bold hi tenen equivalent Unicode. Quan un
extractor troba un glif sense entrada al CMap, escriu el número de glif en
comptes de la lletra, i el text surt corromput de maneres molt discretes:

    "fent ús"        ->  "fent ~s"      (glif 126 = ú)
    "rebutjar"       ->  "rebutMar"     (glif  77 = j)
    "d'evidències"   ->  "dµevidències" (glif 181 = comes)
    "psicològica"    ->  "psicolzgica"  (glif 122 = ò)
    "i/o"            ->  "i\x12o"       (glif  18 = /)

Com que els números de glif de les subincrustacions coincideixen amb els de
l'Arial completa, es pot reconstruir el CMap sencer a partir de la font del
sistema. L'script ho fa, comprova que les 42 entrades que el PDF sí que porta
coincideixen amb les reconstruïdes i, només llavors, llegeix el text.

La taula reconstruïda es desa a data/annex3-glifs.json perquè l'extracció es
pugui repetir en una màquina sense les fonts Arial instal·lades.

Requereix: pymupdf i fonttools (aquest darrer només el primer cop).
"""
import io, json, os, re, sys

import pymupdf

ARREL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ARREL, "referencies", "curriculum", "Annex_3_Secundaria.pdf")
GLIFS = os.path.join(ARREL, "data", "annex3-glifs.json")
SORTIDA = os.path.join(ARREL, "data", "curriculum-eso.json")

FONT = ("Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments de "
        "l'educació bàsica (DOGC 8762, 29.9.2022), annex 3")

# Fonts del document que cal reparar: xref de l'objecte /Font -> fitxer del
# sistema amb la mateixa ordenació de glifs.
FONTS_PDF = {
    288: "arialbd.ttf",   # Arial,Bold      (títols, competències, sabers)
    295: "arial.ttf",     # Arial           (cos del text i taules)
    303: "ariali.ttf",    # Arial,Italic
    319: "ariali.ttf",    # Arial,Italic (segona incrustació)
}
DIR_FONTS = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "Fonts")


# ------------------------------------------------------------------ glifs ---
def taula_glifs():
    """GID -> punt de codi Unicode, per a cada font del PDF."""
    if os.path.exists(GLIFS):
        cru = json.load(io.open(GLIFS, encoding="utf-8"))
        return {int(x): {int(g): u for g, u in m.items()} for x, m in cru.items()}
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit("ERROR: falta data/annex3-glifs.json i no hi ha fonttools "
                 "per regenerar-lo (pip install fonttools).")
    cache, taules = {}, {}
    for xref, fitxer in FONTS_PDF.items():
        if fitxer not in cache:
            cami = os.path.join(DIR_FONTS, fitxer)
            if not os.path.exists(cami):
                sys.exit("ERROR: no es troba la font %s." % cami)
            tt = TTFont(cami)
            noms = {n: i for i, n in enumerate(tt.getGlyphOrder())}
            m = {}
            for u, glif in sorted(tt.getBestCmap().items()):
                gid = noms.get(glif)
                if gid is not None and gid < 600 and gid not in m:
                    m[gid] = u
            cache[fitxer] = m
        taules[xref] = cache[fitxer]
    io.open(GLIFS, "w", encoding="utf-8", newline="\n").write(
        json.dumps({str(k): {str(g): u for g, u in v.items()}
                    for k, v in taules.items()}, ensure_ascii=False, indent=0))
    return taules


def cmap_del_pdf(doc, xref):
    """Les entrades /ToUnicode que el PDF sí que porta (per validar)."""
    clau = doc.xref_get_key(xref, "ToUnicode")
    if clau[0] != "xref":
        return None, {}
    flux = int(clau[1].split()[0])
    text = doc.xref_stream(flux).decode("latin-1")
    parells = []
    for bloc in re.findall(r"beginbfchar(.*?)endbfchar", text, re.S):
        parells += re.findall(r"<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4,})>", bloc)
    return flux, {int(a, 16): int(b[:4], 16) for a, b in parells}


def flux_cmap(taula):
    caps = ("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n"
            "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n"
            "/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n"
            "1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n")
    parells = [(g, u) for g, u in sorted(taula.items()) if g < 0x10000 and u < 0x10000]
    cos = []
    for i in range(0, len(parells), 100):
        tros = parells[i:i + 100]
        cos.append("%d beginbfchar\n" % len(tros))
        cos += ["<%04X> <%04X>\n" % p for p in tros]
        cos.append("endbfchar\n")
    peu = "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n"
    return (caps + "".join(cos) + peu).encode("latin-1")


def obre_pdf_reparat():
    doc = pymupdf.open(PDF)
    taules = taula_glifs()
    for xref, taula in taules.items():
        flux, actual = cmap_del_pdf(doc, xref)
        if flux is None:
            sys.exit("ERROR: la font %d del PDF no té /ToUnicode." % xref)
        for gid, u in actual.items():
            if gid in taula and taula[gid] != u:
                sys.exit("ERROR: la taula de glifs no quadra amb el PDF "
                         "(font %d, glif %d: %s vs %s). El PDF no és el que "
                         "esperava l'script." % (xref, gid, hex(actual[gid]), hex(taula[gid])))
        complet = dict(taula)
        complet.update(actual)       # el que el PDF ja deia, mana
        doc.update_stream(flux, flux_cmap(complet), compress=True)
    return doc


# ---------------------------------------------------------------- lectura ---
# Capçaleres i peus del DOGC que no formen part del currículum.
PEU = re.compile(r"^(ISSN\b|DL B\b|https://www\.gencat|Núm\. 8762|"
                 r"Diari Oficial|CVE-DOGC|\d+/491$|\d+$)")


def linies_i_taules(doc, pag):
    """Elements d'una pàgina, ordenats de dalt a baix.

    Les taules es detecten només per les línies dibuixades (lines_strict):
    amb la detecció per alineació de text, els paràgrafs explicatius de
    matèries com Educació Física o Educació Plàstica es prenien per taules.
    """
    p = doc[pag]
    taules = list(p.find_tables(strategy="lines_strict").tables)
    caixes = [t.bbox for t in taules]
    fora = []
    for bloc in p.get_text("dict")["blocks"]:
        for lin in bloc.get("lines", []):
            trossos = lin["spans"]
            text = "".join(s["text"] for s in trossos).rstrip()
            if not text.strip():
                continue
            x0, y0, x1, y1 = lin["bbox"]
            if any(y0 >= c[1] - 2 and y1 <= c[3] + 2 and x0 >= c[0] - 2 and x1 <= c[2] + 2
                   for c in caixes):
                continue
            if PEU.match(text.strip()) or y0 > 740 or y0 < 100:
                continue
            negreta = sum(len(s["text"].strip()) for s in trossos if "Bold" in s["font"])
            total = sum(len(s["text"].strip()) for s in trossos)
            fora.append(dict(tipus="linia", pag=pag, y=y0, x=x0, text=text,
                             negreta=(total > 0 and negreta == total)))
    for t in taules:
        fora.append(dict(tipus="taula", pag=pag, y=t.bbox[1],
                         files=t.extract(), cols=t.col_count))
    fora.sort(key=lambda e: e["y"])
    # el pic i el text d'un mateix saber són dos fragments a la mateixa
    # alçada: cal llegir-los d'esquerra a dreta
    i = 0
    while i < len(fora):
        j = i + 1
        while j < len(fora) and fora[j]["y"] - fora[i]["y"] < 3:
            j += 1
        if j - i > 1:
            fora[i:j] = sorted(fora[i:j], key=lambda e: e.get("x", 0))
        i = j
    return fora


def elements(doc, ini, fi):
    tot = []
    for pag in range(ini, fi):
        tot.extend(linies_i_taules(doc, pag))
    return tot


def ajunta(linies):
    """Uneix línies d'un mateix paràgraf desfent els talls de ratlla.

    Un guionet a final de ratlla seguit de minúscula és sempre part de la
    paraula ("reflexionant-|ne", "físic-|químics"): s'uneix sense espai.
    """
    sortida = ""
    for cru in linies:
        tros = cru.strip()
        if not tros:
            continue
        if not sortida:
            sortida = tros
        elif sortida.endswith("-") and tros[:1].islower():
            sortida += tros
        else:
            sortida += " " + tros
    return re.sub(r"\s+", " ", sortida).strip()


def net(text):
    return ajunta((text or "").split("\n"))


# ------------------------------------------------------------- matèries -----
# pàgina d'inici (0-based) dins del PDF, nom a l'aplicació, cursos, tipus i
# etiqueta dels grups de criteris quan la matèria no fa servir taula.
MATERIES = [
    (3,   "Llengua Catalana i Literatura", "1r a 4t", "comuna", None),
    (21,  "Llengua Estrangera", "1r a 4t", "comuna", None),
    (38,  "Segona Llengua Estrangera", "1r a 4t (optativa)", "optativa", "1r a 4t"),
    (50,  "Arts Escèniques i Dansa", "4t", "opció 4t", "4t"),
    (56,  "Biologia i Geologia", "1r a 3r i 4t", "comuna", None),
    (71,  "Ciències Socials: Geografia i Història", "1r a 4t", "comuna", None),
    (93,  "Cultura Clàssica", "1r a 3r (optativa)", "optativa", "1r a 3r"),
    (100, "Digitalització", "4t", "opció 4t", "4t"),
    (108, "Economia Bàsica", "4t", "opció 4t", "4t"),
    (116, "Educació en Valors Cívics i Ètics", "un curs de 1r a 4t", "comuna", "1r, 2n, 3r o 4t"),
    (125, "Educació Física", "1r a 4t", "comuna", None),
    (138, "Educació Plàstica, Visual i Audiovisual",
     "1r a 3r i 4t (Expressió Artística)", "comuna", None),
    (149, "Emprenedoria", "1r a 3r (optativa)", "optativa", "1r a 3r"),
    (156, "Emprenedoria (4t)", "4t", "opció 4t", "4t"),
    (167, "Filosofia", "4t", "opció 4t", "4t"),
    (175, "Física i Química", "1r a 3r i 4t", "comuna", None),
    (190, "Formació i Orientació Personal i Professional", "4t", "opció 4t", "4t"),
    (198, "Llatí: Llengua i Cultura", "4t", "opció 4t", "4t"),
    (210, "Matemàtiques", "1r a 4t", "comuna", None),
    (228, "Música", "1r a 3r i 4t", "comuna", None),
    (236, "Robòtica i Programació", "1r a 3r (optativa)", "optativa", "1r a 3r"),
    (241, "Tecnologia", "4t", "opció 4t", "4t"),
    (250, "Tecnologia i Digitalització", "1r a 3r", "comuna", "1r a 3r"),
]
FI_ANNEX = 259

# Matèries que remeten a una altra: l'annex 3 les presenta amb un currículum
# comú (pàgines 4-20 del PDF, "Aranès i Literatura a l'Aran / Llengua
# Castellana i Literatura / Llengua Catalana i Literatura").
REMISSIONS = [
    ("Aranès i Literatura a l’Aran", "Llengua Catalana i Literatura"),
    ("Llengua Castellana i Literatura", "Llengua Catalana i Literatura"),
]

# Les capçaleres de columna del PDF repeteixen el nom de la matèria; a
# l'aplicació la columna ja va dins de la matèria i només cal el curs.
ETIQUETES = {
    "Educació Plàstica, Visual i Audiovisual (1r a 3r)": "1r a 3r",
    "Cursos de 1r a 3r": "1r a 3r",
    # a l'aplicació els criteris i els sabers d'una matèria comparteixen
    # etiqueta de grup, i les claus dels plans ja desats hi van lligades
    "1r o 2n o 3r o 4t": "1r, 2n, 3r o 4t",
}

# Encapçalaments de curs dins de l'apartat "Sabers".
CURSOS_SABERS = {
    "Primer i segon curs", "Tercer i quart curs", "Primer, segon i tercer curs",
    "Quart curs", "Primer i segon", "Tercer i quart", "Cursos de 1r a 3r",
    "Matèria optativa de 4t", "De primer a tercer curs",
    "Cursos de primer a tercer", "Matèria optativa de quart curs",
}
# Encapçalaments que només repeteixen el nom de la matèria.
SOBRERS = {"Educació Plàstica, Visual i Audiovisual", "Expressió Artística"}

RE_CE = re.compile(r"^Compet[eè]ncia espec[ií]fica\s*(\d+)\s*$")
RE_CRIT = re.compile(r"^Criteris\s+(d[’']avaluació|avaluació)\s*$")
RE_CODI = re.compile(r"^\s*(\d+)\.(\d+)\b")
# Pics dels sabers: el decret fa servir "●" (o el seu equivalent de la
# font Symbol) per als subblocs i "-" per als sabers; sovint el pic i el
# text surten com a dos fragments separats.
PICS = "-–—·●•"
SUBPICS = "●•"   # pic de subbloc (el darrer, de la font Symbol)
RE_PIC = re.compile(r"^([" + PICS + r"])\s*(.*)$")


def talla_criteris(text, ce, on):
    """Parteix el text d'una columna en criteris 'ce.1', 'ce.2'…"""
    marques = []
    espera = 1
    # el decret escriu el codi tant "9.2" com "9.3." (Matemàtiques CE9)
    for m in re.finditer(r"(?<![\w.,])(%d\.(\d+))\.?(?=\s)" % ce, text):
        if int(m.group(2)) != espera:
            continue
        marques.append((m.start(), m.end(), m.group(1)))
        espera += 1
    if not marques:
        return []
    if marques[0][0] > 0:
        avis("%s: text abans del criteri %d.1 (%r)"
             % (on, ce, text[:marques[0][0]][:60]))
    items = []
    for i, (a, b, codi) in enumerate(marques):
        fi = marques[i + 1][0] if i + 1 < len(marques) else len(text)
        items.append({"c": codi, "t": re.sub(r"\s+", " ", text[b:fi]).strip()})
    return items


AVISOS = []


def avis(msg):
    AVISOS.append(msg)


def criteris_de_taules(taules, ce, etiqueta_unica, on):
    """Columnes -> [(curs, [criteris])] a partir de les taules del PDF."""
    caps, columnes = None, None
    for t in taules:
        files = t["files"]
        if columnes is None:
            primera = files[0]
            if primera and not RE_CODI.match(net(primera[0]) or ""):
                caps = [net(c) for c in primera]
                files = files[1:]
            else:
                caps = [etiqueta_unica or ""] * t["cols"]
            columnes = [[] for _ in caps]
        for fila in files:
            for i, cel in enumerate(fila):
                if i < len(columnes) and cel:
                    columnes[i].append(net(cel))
    grups = []
    for cap, trossos in zip(caps, columnes):
        text = ajunta(trossos)
        if not text.strip():
            continue
        curs = ETIQUETES.get(cap, cap) or etiqueta_unica or ""
        items = talla_criteris(text, ce, "%s CE%d [%s]" % (on, ce, curs))
        if items:
            grups.append({"curs": curs, "items": items})
    return grups


def llegeix_materia(doc, ini, fi, nom, etiqueta_unica):
    els = elements(doc, ini, fi)
    ce_llista, sabers = [], []
    i = 0
    # ---- competències específiques i criteris d'avaluació ----
    while i < len(els):
        e = els[i]
        if e["tipus"] == "linia" and e["negreta"] and e["text"].strip() == "Sabers":
            break
        m = (RE_CE.match(e["text"].strip())
             if e["tipus"] == "linia" and e["negreta"] else None)
        if not m:
            i += 1
            continue
        n = int(m.group(1))
        i += 1
        # descripció: tot el que hi ha fins a "Criteris d'avaluació". Va en
        # negreta, però alguna ratlla del DOGC se n'escapa (Filosofia CE2).
        desc = []
        while i < len(els):
            e = els[i]
            if e["tipus"] != "linia":
                break
            if RE_CRIT.match(e["text"].strip()):
                i += 1
                break
            if RE_CE.match(e["text"].strip()):
                break
            desc.append(e["text"])
            i += 1
        # criteris: o bé taules amb columnes per curs, o bé text seguit
        taules = []
        while i < len(els) and els[i]["tipus"] == "taula":
            t = els[i]
            if taules and not (t["pag"] > taules[-1]["pag"] and t["y"] < 220):
                break
            taules.append(t)
            i += 1
        if taules:
            grups = criteris_de_taules(taules, n, etiqueta_unica, nom)
        else:
            linies, ant = [], None
            while i < len(els):
                e = els[i]
                if e["tipus"] != "linia" or e["negreta"]:
                    break
                # dins del bloc de criteris, tot paràgraf nou comença amb el
                # codi del criteri; el primer que no ho fa ja és la prosa
                # explicativa que ve després
                nou_bloc = (ant is not None and e["pag"] == ant["pag"]
                            and e["y"] - ant["y"] > 13.5)
                if ant is not None and e["pag"] != ant["pag"]:
                    # canvi de pàgina: només continua si el criteri anterior
                    # havia quedat a mitges
                    nou_bloc = linies[-1].rstrip().endswith((".", "…"))
                if linies and nou_bloc and not RE_CODI.match(e["text"].strip()):
                    break
                linies.append(e["text"])
                ant = e
                i += 1
            curs = etiqueta_unica or ""
            # algunes matèries sense taula posen el curs en una ratlla pròpia
            if linies and not RE_CODI.match(linies[0].strip()) and len(linies[0].strip()) < 40:
                cap = linies.pop(0).strip()
                curs = ETIQUETES.get(cap, cap)
            items = talla_criteris(ajunta(linies), n, "%s CE%d" % (nom, n))
            grups = [{"curs": curs, "items": items}] if items else []
        ce_llista.append({"n": n, "desc": ajunta(desc), "grups": grups})

    # ---- sabers ----
    while i < len(els) and not (els[i]["tipus"] == "linia" and els[i]["negreta"]
                                and els[i]["text"].strip() == "Sabers"):
        i += 1
    i += 1
    curs_actual, tema_actual, bloc, arrel = None, None, None, None
    pendent, entrada, pic, ant_linia = [], [], "", None

    def subtema(pare, titol):
        titol = re.sub(r"\s+", " ", (titol or "")).strip()
        titol = re.sub(r"\s*\.$", "", titol)
        if pare and titol:
            return pare + " · " + titol
        return pare or titol

    def tanca_tema():
        if curs_actual is not None and tema_actual and pendent:
            curs_actual["temes"].append({"tema": tema_actual, "items": list(pendent)})

    def es_negreta(k):
        return (k < len(els) and els[k]["tipus"] == "linia" and els[k]["negreta"])

    while i < len(els):
        e = els[i]
        if e["tipus"] == "taula":
            i += 1
            for fila in e["files"]:
                for cel in fila:
                    if cel and cel.strip():
                        pendent.append({"t": net(cel)})
            continue

        if not e["negreta"]:
            i += 1
            text = e["text"].strip()
            nou_paragraf = (ant_linia is None
                            or e["pag"] != ant_linia["pag"]
                            or e["y"] - ant_linia["y"] > 13.5)
            ant_linia = e
            if text in tuple(PICS):         # el pic i el text van en dos trossos
                pic = text
                continue
            m = RE_PIC.match(text)
            if m:
                pic, text = m.group(1), m.group(2).strip()
            marca, pic = pic, ""
            if marca or tema_actual is not None or pendent:
                if curs_actual is None:     # sabers sense divisió per cursos
                    curs_actual = {"curs": etiqueta_unica or "", "temes": []}
                    sabers.append(curs_actual)
            if marca in tuple(SUBPICS):     # subbloc de sabers
                tanca_tema()
                tema_actual, pendent, entrada = subtema(arrel, text), [], []
                continue
            if marca:                       # saber nou
                if tema_actual is None:
                    tema_actual = subtema(arrel, ajunta(entrada))
                    entrada = []
                pendent.append({"t": text})
                continue
            if pendent:                     # continuació del saber anterior
                pendent[-1]["t"] = ajunta([pendent[-1]["t"], text])
            elif tema_actual is not None:   # continuació del títol del subbloc
                tema_actual = ajunta([tema_actual, text])
            else:
                # títol de subbloc sense pic; un paràgraf nou el reinicia,
                # de manera que la presentació de l'apartat no s'hi cola
                if nou_paragraf:
                    entrada = []
                entrada.append(text)
            continue

        # encapçalament en negreta, que pot ocupar més d'una ratlla
        capsal, ant = [e["text"]], e
        i += 1
        while (es_negreta(i) and els[i]["pag"] == ant["pag"]
               and els[i]["y"] - ant["y"] < 14
               and els[i]["text"].strip() not in CURSOS_SABERS
               and ajunta(capsal) not in SOBRERS):
            capsal.append(els[i]["text"])
            ant = els[i]
            i += 1
        titol = ajunta(capsal)
        if titol in SOBRERS:
            continue
        tanca_tema()
        pendent, entrada, ant_linia = [], [], None
        if titol in CURSOS_SABERS:
            curs_actual = {"curs": titol, "temes": []}
            sabers.append(curs_actual)
            tema_actual = bloc = arrel = None
            continue
        if curs_actual is None:
            curs_actual = {"curs": etiqueta_unica or "", "temes": []}
            sabers.append(curs_actual)
        pic = ""            # un pic davant d'un encapçalament només el decora
        j = i               # el pic i l'encapçalament són elements separats
        while (j < len(els) and els[j]["tipus"] == "linia"
               and els[j]["text"].strip() in tuple(PICS)):
            j += 1
        seguent = (els[j]["text"].strip() if es_negreta(j) else None)
        if seguent is not None and seguent not in CURSOS_SABERS and seguent not in SOBRERS:
            bloc, arrel, tema_actual = titol, None, None   # encapçalament de bloc
        else:
            arrel = (bloc + " · " + titol) if bloc else titol
            tema_actual = None
    tanca_tema()
    return ce_llista, sabers


def main():
    doc = obre_pdf_reparat()
    materies = []
    for k, (ini, nom, cursos, tipus, etiqueta) in enumerate(MATERIES):
        fi = MATERIES[k + 1][0] if k + 1 < len(MATERIES) else FI_ANNEX
        ce, sabers = llegeix_materia(doc, ini, fi, nom, etiqueta)
        materies.append({"nom": nom, "cursos": cursos, "tipus": tipus,
                         "ce": ce, "sabers": sabers})
        for i, c in enumerate(ce, 1):
            if c["n"] != i:
                avis("%s: la competència %d surt numerada com a %s" % (nom, i, c["n"]))
            if not c["desc"]:
                avis("%s CE%s: sense descripció" % (nom, c["n"]))
            if not c["grups"]:
                avis("%s CE%s: sense criteris d'avaluació" % (nom, c["n"]))
            for g in c["grups"]:
                if not g["curs"]:
                    avis("%s CE%s: un grup de criteris sense curs" % (nom, c["n"]))
                for it in g["items"]:
                    if not it["t"] or not it["t"].endswith((".", "…")):
                        avis("%s %s [%s]: el criteri no acaba en punt (%r)"
                             % (nom, it["c"], g["curs"], it["t"][-60:]))
        if not sabers:
            avis("%s: sense sabers" % nom)
        for g in sabers:
            if not g["temes"]:
                avis("%s sabers [%s]: sense temes" % (nom, g["curs"]))
    for nom, ref in REMISSIONS:
        materies.append({"nom": nom, "ref": ref})
    materies.sort(key=lambda m: m["nom"])

    doc_json = {"font": FONT, "etapa": "ESO", "materies": materies}
    io.open(SORTIDA, "w", encoding="utf-8", newline="\n").write(
        json.dumps(doc_json, ensure_ascii=False, indent=1) + "\n")

    plenes = [m for m in materies if "ref" not in m]
    ncrit = sum(len(g["items"]) for m in plenes for c in m["ce"] for g in c["grups"])
    nsab = sum(len(t["items"]) for m in plenes for g in m["sabers"] for t in g["temes"])
    print("Escrit %s" % os.path.relpath(SORTIDA, ARREL))
    print("  %d materies (%d amb text propi)" % (len(materies), len(plenes)))
    print("  %d competencies especifiques" % sum(len(m["ce"]) for m in plenes))
    print("  %d criteris d'avaluacio" % ncrit)
    print("  %d sabers" % nsab)
    if AVISOS:
        print("\n%d avis(os):" % len(AVISOS))
        for a in AVISOS:
            print("  - " + a)


if __name__ == "__main__":
    main()
