# Peces de la versió web

Aquesta carpeta conté el que **no cap dins del fitxer únic** i només té sentit
quan hi ha un servidor al davant. No forma part de `dist/pi-eso.html`: la còpia
que es baixa i s'obre amb doble clic no en veu ni en necessita res.

| | |
|---|---|
| `manifest.webmanifest` | Nom, colors i icones amb què s'instal·la l'aplicació. |
| `sw.js` | Service worker: fa que es pugui tornar a obrir sense connexió. |
| `icona-*.png` | Icones d'instal·lació. Les genera `python -m tools.icones`. |

`tools/pagines.py` les combina amb `dist/pi-eso.html` per muntar `_site/`, que
és el que publica [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)
a GitHub Pages. `_site/` no es versiona.

Les icones es generen un cop i es versionen: la construcció habitual i la
integració contínua no les toquen, i `python -m tools.build` continua
funcionant només amb la biblioteca estàndard. Per regenerar-les cal Pillow.

Vegeu [`docs/adr/0006-versio-web-i-pwa.md`](../docs/adr/0006-versio-web-i-pwa.md).
