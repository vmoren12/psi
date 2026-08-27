# -*- coding: utf-8 -*-
"""
Extreu l'annex 2 del Decret 175/2022 (àrees d'educació primària) del PDF del
DOGC i escriu data/curriculum-primaria.json.

    python -m tools.extraccio.curriculum_primaria [ruta-del-pdf]

Per què cal aquest script
-------------------------
El PDF del DOGC porta el text de l'annex 2 en tres formats diferents:

  * la prosa i les taules de criteris, en Arial normal, que s'extreu bé;
  * els encapçalaments (competències específiques, blocs de sabers), en
    Arial negreta amb una taula ToUnicode incompleta: els glifs afectats
    surten com a chr(gid) i el text queda il·legible ("traYps" per "través").
    Per a aquest subconjunt, gid = codi ASCII - 29, i la resta de glifs es
    resolen amb la taula GLIFS, derivada alineant les competències de
    l'annex 3 del PDF amb les que ja hi ha dins de dist/pi-eso.html;
  * les taules de criteris d'avaluació, en tres columnes (un cicle per
    columna) que el text pla barreja. Aquí es reconstrueixen a partir de les
    coordenades de cada caràcter i de les línies de la taula.

L'script no toca l'aplicació: només escriu el JSON. Per incrustar-lo a
dist/pi-eso.html cal executar després tools/build.py.
"""
import collections, io, json, os, re, sys

try:
    import pymupdf
except ImportError:                                  # pymupdf < 1.24
    import fitz as pymupdf

ARREL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF = os.path.join(ARREL, "referencies", "curriculum",
                   "curriculum-basica-decret-175-2022.pdf")
SORTIDA = os.path.join(ARREL, "data", "curriculum-primaria.json")

# Glifs de l'Arial negreta que no es resolen amb la regla gid = ASCII - 29.
GLIFS = {106: "à", 111: "ç", 112: "é", 113: "è", 116: "í", 119: "ï", 121: "ó",
         122: "ò", 126: "ú", 129: "ü", 172: "À", 182: "’", 202: "È", 257: "·"}

# Àrees de l'annex 2: (primera pàgina, última pàgina + 1, nom, cursos)
AREES = [
    (47,  67, "Llengua Catalana i Literatura", "1r a 6è de primària"),
    (67,  89, "Llengua Estrangera", "1r a 6è de primària"),
    (89, 101, "Segona Llengua Estrangera", "primària (oferta opcional del centre)"),
    (101, 124, "Coneixement del Medi Natural, Social i Cultural", "1r a 6è de primària"),
    (124, 141, "Educació Artística", "1r a 6è de primària"),
    (141, 150, "Educació en Valors Cívics i Ètics", "un curs del cicle superior"),
    (150, 172, "Educació Física", "1r a 6è de primària"),
    (172, 193, "Matemàtiques", "1r a 6è de primària"),
]

# Àrees que comparteixen currículum amb una altra (annex 2, àrees lingüístiques)
REFERENCIES = [
    ("Llengua Castellana i Literatura", "Llengua Catalana i Literatura"),
    ("Aranès i Literatura a l’Aran", "Llengua Catalana i Literatura"),
]

CICLES = ["1r i 2n", "3r i 4t", "5è i 6è"]
RE_CE = re.compile(r"^Compet[èe]ncia\s+(?:espec[íi]fica\s*)?(\d*)\s*$")
RE_CRIT = re.compile(r"^Criteris\s+d[’']avaluaci[óo]\s*$")
RE_CODI = re.compile(r"^(\d+)\.(\d+)\.?\s+(.*)$")
RE_CICLE_HDR = re.compile(r"^\s*(1r|3r|5è)\s*[i\-o]?\s*(2n|4t|6è)\s*$")
# Etiquetes amb què el decret encapçala els sabers de cada cicle: cada àrea
# fa servir la seva variant, i totes es normalitzen a l'etiqueta del cicle.
PICS = ("-", "–", "—", "·", "●", "•")
CICLE_ETIQ = {
    "primer cicle": CICLES[0], "primer i segon": CICLES[0],
    "primer i segon curs": CICLES[0], "1r i 2n": CICLES[0],
    "segon cicle": CICLES[1], "tercer i quart": CICLES[1],
    "tercer i quart curs": CICLES[1], "3r i 4t": CICLES[1],
    "tercer cicle": CICLES[2], "cinquè i sisè": CICLES[2],
    "cinquè i sisè curs": CICLES[2], "5è i 6è": CICLES[2],
    "cinquè o sisè": "5è o 6è", "cinquè o sisè curs": "5è o 6è",
}
# El DOGC no manté la negreta a tots els encapçalaments: n'hi ha en rodona
# (competències, cicles de sabers). Es reconeixen sempre pel text.


def descodifica(u, gid, negreta):
    if not negreta:
        return chr(u)
    if 3 <= gid <= 97:
        return chr(gid + 29)
    return GLIFS.get(gid, chr(u))


def talls(pag):
    """Coordenades x de les línies verticals de la taula de criteris."""
    xs = set()
    for g in pag.get_drawings():
        r = g["rect"]
        if r.width < 2.5 and r.height > 2:
            xs.add(round(r.x0, 1))
    # Hi ha pàgines amb dues taules d'amplades lleugerament diferents: les
    # línies properes són la mateixa vora i s'han de fusionar.
    fusio = []
    for x in sorted(xs):
        if fusio and x - fusio[-1] < 10:
            continue
        fusio.append(x)
    return fusio


def linies(pag):
    """[(y, x0, x1, negreta, text)] de la pàgina, una entrada per cel·la."""
    chars = []
    for sp in pag.get_texttrace():
        if sp.get("type") != 0 or "Arial" not in sp["font"]:
            continue                                  # capçalera i peu del DOGC
        neg = "Bold" in sp["font"]
        for c in sp["chars"]:
            chars.append((c[2][1], c[2][0], c[3][2], descodifica(c[0], c[1], neg), neg))
    chars.sort(key=lambda c: (c[0], c[1]))
    files, actual, base = [], [], None
    for c in chars:
        if base is None or abs(c[0] - base) > 0.6:
            if actual:
                files.append(actual)
            actual, base = [], c[0]
        actual.append(c)
    if actual:
        files.append(actual)

    out = []
    for fila in files:
        fila.sort(key=lambda c: c[1])
        tros = []
        for c in fila:
            if tros and c[1] - tros[-1][2] > 4.5:
                out.append(_linia(tros)); tros = []
            tros.append(c)
        if tros:
            out.append(_linia(tros))
    return [l for l in out if l[4]]


def _linia(tros):
    txt = re.sub(r"\s+", " ", "".join(c[3] for c in tros)).strip()
    return (round(tros[0][0], 1), round(tros[0][1], 1), round(tros[-1][2], 1),
            all(c[4] for c in tros), txt)


def columna(x0, tall):
    """Índex de columna d'una cel·la, o None si la línia no és dins la taula."""
    if not tall:
        return None
    for i in range(len(tall) - 1):
        if tall[i] + 3 <= x0 < tall[i + 1]:
            return i
    return None


def uneix(trossos):
    """Ajunta les línies d'una cel·la. El text del DOGC no parteix paraules a
       final de ratlla: un guió final és sempre un guió de la paraula
       (valorar-los, iniciar-se), i s'ha de conservar sense espai."""
    text = ""
    for t in trossos:
        if not text:
            text = t
        elif text.endswith("-"):
            text += t
        else:
            text += " " + t
    return re.sub(r"\s+", " ", text).strip()


def items_de(trossos, avisos, on):
    """Converteix les línies d'una columna en criteris {c, t}."""
    items, actual = [], None
    for t in trossos:
        m = RE_CODI.match(t)
        if m:
            if actual:
                items.append(actual)
            actual = {"c": "%s.%s" % (m.group(1), m.group(2)), "l": [m.group(3)]}
        elif actual:
            actual["l"].append(t)
        elif t:
            avisos.append("%s: text fora de cap criteri: %r" % (on, t[:60]))
    if actual:
        items.append(actual)
    return [{"c": i["c"], "t": uneix(i["l"])} for i in items]


def _nou_tema(cicle, pare, titol):
    """Obre un bloc de sabers. Els sabers de la majoria d'àrees tenen dos
       nivells (bloc i subbloc); el títol resultant els encadena."""
    tema = {"tema": (pare + " · " + titol) if (pare and titol) else (pare or titol),
            "items": []}
    cicle["temes"].append(tema)
    return tema


def extreu_area(doc, p0, p1, nom, cursos, avisos, blocs=None):
    ces, sabers = [], []
    ce = None                 # competència en curs
    mode = "prosa"
    cols = collections.defaultdict(list)   # columna -> línies
    etiquetes = {}            # columna -> etiqueta del cicle
    cicle = tema = pare = None
    blocs = set() if blocs is None else blocs
    pic = ""                  # pic pendent quan va en un tros a part
    ultim_y = None

    def tanca_criteris():
        if not ce:
            return
        for i in sorted(cols):
            trossos = cols[i]
            if not trossos:
                continue
            curs = etiquetes.get(i) or (CICLES[i] if len(cols) == 3 else "tota l'etapa")
            its = items_de(trossos, avisos, "%s CE%s (%s)" % (nom, ce["n"], curs))
            if not its:
                continue
            grup = next((g for g in ce["grups"] if g["curs"] == curs), None)
            if grup is None:
                grup = {"curs": curs, "items": []}
                ce["grups"].append(grup)
            grup["items"].extend(its)
        cols.clear(); etiquetes.clear()

    for pno in range(p0, p1):
        pag = doc[pno]
        tall = talls(pag)
        for y, x0, x1, neg, txt in linies(pag):
            anterior = ultim_y
            salt = None if ultim_y is None or y < ultim_y else y - ultim_y
            ultim_y = y

            m = RE_CE.match(txt)
            if m:
                tanca_criteris()
                ce = {"n": int(m.group(1)) if m.group(1).isdigit() else 0,
                      "desc": [], "grups": []}
                ces.append(ce); mode = "ce"; continue
            if RE_CRIT.match(txt):
                mode = "criteris"; cols.clear(); etiquetes.clear(); continue
            if txt == "Sabers" and mode != "sabers":
                tanca_criteris(); mode = "sabers"
                cicle = tema = pare = None; continue
            if mode == "sabers" and txt.lower() in CICLE_ETIQ:
                cicle = {"curs": CICLE_ETIQ[txt.lower()], "temes": []}
                sabers.append(cicle); tema = pare = None; pic = ""; continue

            if neg:
                if mode == "ce":
                    ce["desc"].append(txt); continue
                if mode == "sabers":
                    if cicle is None:                # sabers sense divisió per cicles
                        cicle = {"curs": "tota l'etapa", "temes": []}
                        sabers.append(cicle)
                    blocs.add(txt)
                    pare, tema, pic = txt, None, ""
                    continue
                continue                    # títols d'àrea i capçaleres de taula

            if mode == "ce":
                # el decret no manté la negreta fins al final d'algunes
                # competències: la línia continua si no hi ha salt de paràgraf
                if ce["desc"] and salt is not None and salt <= 13.5:
                    ce["desc"].append(txt); continue
                mode = "prosa"
            if mode == "criteris":
                col = columna(x0, tall)
                if col is None:
                    if tall:
                        mode = "prosa"                # el text ha sortit de la taula
                        continue
                    # àrees sense taula: el bloc acaba amb un salt de paràgraf
                    if salt is not None and salt > 13 and not RE_CODI.match(txt):
                        mode = "prosa"; continue
                    col = 0
                if RE_CICLE_HDR.match(txt):
                    etiquetes[col] = re.sub(r"\s*-\s*", " i ", txt).strip()
                    cols.setdefault(col, [])
                    continue
                cols[col].append(txt)
                continue

            if mode == "sabers":
                if cicle is None:
                    continue          # presentació dels sabers, abans del 1r cicle
                if txt in PICS:       # el pic i el text van en dos trossos
                    pic = txt; ultim_y = anterior; continue
                m = re.match(r"^([-–—·●•])\s*(.*)$", txt)
                if m:
                    pic, txt = m.group(1), m.group(2)
                marca, pic = pic, ""
                if marca in ("●", "•"):              # subbloc de sabers
                    tema = _nou_tema(cicle, pare, txt); continue
                if marca:                            # saber nou
                    if tema is None:
                        tema = _nou_tema(cicle, pare, "")
                    tema["items"].append([txt]); continue
                if tema is not None and tema["items"] and (
                        (salt is not None and salt <= 13.5)
                        or len(txt) >= 60 or txt.endswith((".", ",", ";", ":"))):
                    tema["items"][-1].append(txt)    # continuació del saber
                elif txt in blocs:      # bloc que en aquest cicle no va en negreta
                    pare, tema = txt, None
                else:                                # encapçalament de subbloc
                    tema = _nou_tema(cicle, pare, txt)
    tanca_criteris()

    for g in sabers:
        noms = [t["tema"] for t in g["temes"]]
        for n in set(noms):
            if noms.count(n) > 1:
                avisos.append("%s (%s): el bloc de sabers %r surt %d vegades"
                              % (nom, g["curs"], n, noms.count(n)))
    for c in ces:
        c["desc"] = uneix(c["desc"]).rstrip(". ") + "."
        codis = [int(i["c"].split(".")[0]) for g in c["grups"] for i in g["items"]]
        if codis:                       # el número del títol no sempre és llegible
            if len(set(codis)) > 1:
                avisos.append("%s: la competència %s barreja criteris %s"
                              % (nom, c["n"], sorted(set(codis))))
            c["n"] = codis[0]
    for i, c in enumerate(ces, 1):
        if c["n"] != i:
            avisos.append("%s: la competència %d està numerada com a %s"
                          % (nom, i, c["n"]))
        if not c["grups"]:
            avisos.append("%s: la competència %s no té cap criteri" % (nom, c["n"]))
        if len(c["grups"]) not in (1, 3):
            avisos.append("%s CE%s: %d columnes de criteris (%s)"
                          % (nom, c["n"], len(c["grups"]),
                             ", ".join(g["curs"] for g in c["grups"])))
        for g in c["grups"]:
            codis = [it["c"] for it in g["items"]]
            if codis != ["%d.%d" % (c["n"], k + 1) for k in range(len(codis))]:
                avisos.append("%s CE%s (%s): codis fora de seqüència: %s"
                              % (nom, c["n"], g["curs"], ", ".join(codis)))
            for it in g["items"]:
                if not it["t"].endswith((".", "…", ":")):
                    avisos.append("%s %s (%s): sembla tallat: ...%s"
                                  % (nom, it["c"], g["curs"], it["t"][-40:]))
    for g in sabers:
        for t in g["temes"]:
            nous = []
            for x in t["items"]:
                # el decret encadena de tant en tant dos sabers a la mateixa
                # ratlla ("...col·leccio. - Us estrategic de les operacions...")
                for tros in re.split(r"(?<=[.:]) -\s+(?=[A-ZÀÈÉÍÒÓÚÜÇ])", uneix(x)):
                    tros = tros.strip()
                    if tros:
                        nous.append({"t": tros})
            t["items"] = nous
    resultat = {"nom": nom, "cursos": cursos, "etapa": "Primària",
            "ce": [{"n": c["n"], "desc": c["desc"], "grups": c["grups"]} for c in ces],
            "sabers": [{"curs": g["curs"],
                        "temes": [{"tema": t["tema"], "items": t["items"]}
                                  for t in g["temes"] if t["items"]]}
                       for g in sabers]}
    return resultat, blocs


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else PDF
    if not os.path.exists(ruta):
        print("ERROR: no es troba el PDF " + ruta); sys.exit(1)
    doc = pymupdf.open(ruta)
    avisos, arees = [], []
    for p0, p1, nom, cursos in AREES:
        # 1a passada: recull els blocs de sabers que el decret posa en negreta
        # en algun cicle, perquè es reconeguin també als cicles on no ho fa.
        _, blocs = extreu_area(doc, p0, p1, nom, cursos, [])
        a, _ = extreu_area(doc, p0, p1, nom, cursos, avisos, blocs)
        arees.append(a)
        print("%-48s %2d competencies, %2d cicles de sabers" %
              (nom, len(a["ce"]), len(a["sabers"])))
    for nom, ref in REFERENCIES:
        arees.append({"nom": nom, "ref": ref, "etapa": "Primària"})
    arees.sort(key=lambda a: a["nom"])

    doc_json = {
        "font": ("Decret 175/2022, de 27 de setembre, d'ordenació dels ensenyaments "
                 "de l'educació bàsica (DOGC 8762, 29.9.2022), annex 2"),
        "etapa": "Primària",
        "cicles": CICLES,
        "arees": arees,
    }
    io.open(SORTIDA, "w", encoding="utf-8", newline="\n").write(
        json.dumps(doc_json, ensure_ascii=False, indent=1))
    print("\nEscrit " + SORTIDA)
    if avisos:
        print("\n%d avis(os):" % len(avisos))
        for a in avisos[:40]:
            print("  - " + a)


if __name__ == "__main__":
    main()
