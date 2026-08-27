"""Rutes del projecte, resoltes a partir d'aquest fitxer.

Totes les eines les importen d'aquí perquè funcionin igual tant si
s'executen des de l'arrel del projecte com des de qualsevol subcarpeta.
"""
from pathlib import Path

ARREL = Path(__file__).resolve().parent.parent

SRC = ARREL / "src"
PLANTILLA = SRC / "index.html"
ESTILS = SRC / "styles"
APLICACIO = SRC / "app"

DADES = ARREL / "data"
BANC = DADES / "banc-mesures.json"
PERFILS = DADES / "perfils.json"
CURRICULUM_ESO = DADES / "curriculum-eso.json"
CURRICULUM_PRIMARIA = DADES / "curriculum-primaria.json"
EQUIVALENCIES = DADES / "equivalencies-primaria.json"

REFERENCIES = ARREL / "referencies"
DIST = ARREL / "dist"
SORTIDA = DIST / "pi-eso.html"
