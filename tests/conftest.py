"""Peces compartides pels tests.

Els tests treballen sobre l'arbre del projecte tal com és: no hi ha cap
projecte de mentida ni cap còpia de les dades. El que es comprova aquí és
exactament el que es distribueix.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools import build, rutes, valida


@pytest.fixture(scope="session")
def html():
    """L'aplicació sencera, construïda una sola vegada per a tota la sessió."""
    return build.construeix()


@pytest.fixture(scope="session")
def codi():
    """Tot el codi de src/app/ concatenat en l'ordre de construcció."""
    return "".join((rutes.APLICACIO / n).read_text(encoding="utf-8") for n in build.APLICACIO)


@pytest.fixture(scope="session")
def banc():
    return valida.llegeix(rutes.BANC)


@pytest.fixture(scope="session")
def estrategies():
    return valida.llegeix(rutes.ESTRATEGIES)


@pytest.fixture(scope="session")
def perfils():
    return valida.llegeix(rutes.PERFILS)


@pytest.fixture(scope="session")
def curriculum_eso():
    return valida.llegeix(rutes.CURRICULUM_ESO)


@pytest.fixture(scope="session")
def curriculum_primaria():
    return valida.llegeix(rutes.CURRICULUM_PRIMARIA)


@pytest.fixture(scope="session")
def equivalencies():
    return valida.llegeix(rutes.EQUIVALENCIES)["equivalencies"]
