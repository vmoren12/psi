# 0005 · Separar el currículum i les mesures del codi

**Estat:** vigent · **Data:** 2026-08-27

## Context

L'aplicació porta a dins el currículum sencer del Decret 175/2022 —25 matèries
d'ESO, 10 àrees de primària, milers de criteris d'avaluació i sabers— i un
catàleg de 114 mesures i suports. És, de llarg, la major part del projecte: el
codi són unes 5.200 línies i les dades ocupen 1,1 MB.

Aquestes dades tenen un cicle de vida propi i molt diferent del codi:

- **Canvien per motius aliens al programari**: una modificació del decret, una
  taula nova del Departament, una errada de transcripció detectada per algú
  que fa servir l'eina.
- **Les revisa gent que no programa.** L'aportació més valuosa que pot rebre
  aquest projecte és que una orientadora corregeixi la concreció d'una mesura.
- **Han de ser verificables.** Cada mesura ha de dir de quin document oficial
  surt, perquè un centre l'ha de poder defensar davant d'una inspecció.

## Decisió

Les dades viuen a `data/` com a JSON llegible, són la **font de veritat** i
s'incrusten al fitxer distribuït durant la construcció. Cap dada s'edita mai
dins de `dist/`.

Cada conjunt té un document de manteniment a [`docs/dades/`](../dades/) que
explica com està construït, què vol dir cada camp i com ampliar-lo.

`tools/valida.py` comprova la coherència del conjunt abans de construir res:
vocabularis tancats, identificadors únics, codis de criteri en seqüència,
referències creuades entre plantilles i banc, i cap camp obligatori buit. Si
troba un error, **no es genera res**.

## Conseqüències

**A favor**

- Corregir el text d'una mesura és editar un JSON i executar una ordre. No cal
  entendre el codi.
- Les diferències de les revisions expliquen què ha canviat del contingut, no
  del programari.
- La validació té un únic lloc i la comparteixen la construcció i les proves.
- El vocabulari es pot creuar: cap mesura no pot referir-se a una matèria que
  no existeix ni a un perfil que l'aplicació no ofereix.

**En contra**

- Hi ha un pas de construcció que cal recordar (mitigat per `--verifica`).
- Un vocabulari, el de perfils, viu al **codi** i no a `data/`, perquè cada
  perfil també canvia la interfície. El validador el llegeix del codi amb una
  expressió regular en comptes de mantenir-ne una còpia, precisament perquè
  les dues llistes no puguin divergir sense que ningú se n'assabenti.
