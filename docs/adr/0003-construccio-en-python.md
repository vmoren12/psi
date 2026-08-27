# 0003 · Construir amb Python i sense dependències

**Estat:** vigent · **Data:** 2026-08-27

## Context

La decisió [0001](0001-fitxer-unic.md) obliga a un pas de construcció que
cusi el codi partit en un sol document. La pregunta és amb què.

L'opció per defecte al món del front-end és Node: un `package.json`, un
empaquetador i unes quantes desenes de dependències. Per a aquest projecte
això té dos problemes. El primer és que la construcció **no fa res que
justifiqui un empaquetador**: no hi ha mòduls que resoldre, ni transpilació,
ni minimització. El segon és que qui més probablement voldrà tocar aquest
dipòsit —una orientadora que vol corregir una mesura del banc— no té Node i no
hauria de necessitar-ne.

A més, el projecte **ja depèn de Python**: els extractors que llegeixen els
PDF del DOGC estan escrits amb `pymupdf` i no es poden reescriure
raonablement en cap altra cosa.

## Decisió

Construir amb **Python 3.9 o superior i només la biblioteca estàndard**.

`tools/build.py` concatena els fitxers declarats a `build.ESTILS` i
`build.APLICACIO`, substitueix quatre marques i escriu `dist/pi-eso.html`. No
minimitza, no transpila i no reordena res.

Les úniques dependències del projecte són `pytest` per provar-lo i `ruff` per
revisar-ne l'estil, totes dues a `requirements-dev.txt` i cap de les dues
necessària per construir.

## Conseqüències

**A favor**

- `git clone` i `python -m tools.build`. No hi ha `npm install`, ni un arbre
  de dependències, ni cap de les vulnerabilitats que hi apareixen soles.
- Un únic entorn per a la construcció, la validació, les proves i l'extracció.
- La construcció és **determinista i llegible**: es pot entendre sencera en
  una lectura, cosa que importa perquè és el que produeix el fitxer que
  s'executarà en un centre.

**En contra**

- Cap de les comoditats de l'ecosistema JavaScript: ni recàrrega en calent, ni
  mapes de codi, ni comprovació de tipus. Per a un projecte d'aquesta mida i
  d'aquest estil de codi, no compensen el cost.
- El codi de `src/app/` s'ha d'escriure ja compatible amb els navegadors
  objectiu, perquè ningú no el transformarà.
