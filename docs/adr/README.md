# Registre de decisions d'arquitectura

Cada fitxer d'aquesta carpeta recull **una decisió estructural**: què es va
decidir, contra què, i a canvi de què.

Serveixen per a una cosa concreta. Diverses decisions d'aquest projecte
semblen errors si només se'n mira el resultat —un fitxer de 1,1 MB amb tot a
dins, dades sense servidor, un artefacte generat dins del control de versions—
i tenen tot el sentit quan se'n coneix la restricció. Aquests documents són la
resposta a «per què no ho vau fer bé?».

No es reescriuen. Si una decisió es revisa, se'n redacta una de nova que
substitueixi l'anterior i la vella es marca com a substituïda.

| | Decisió | Estat |
|---|---|---|
| [0001](0001-fitxer-unic.md) | Distribuir l'aplicació com un sol fitxer HTML | Vigent |
| [0002](0002-dades-al-navegador.md) | Desar les dades només al navegador | Vigent |
| [0003](0003-construccio-en-python.md) | Construir amb Python i sense dependències | Vigent |
| [0004](0004-dist-versionat.md) | Versionar l'artefacte generat | Vigent |
| [0005](0005-dades-fora-del-codi.md) | Separar el currículum i les mesures del codi | Vigent |
