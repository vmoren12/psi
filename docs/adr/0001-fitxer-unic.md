# 0001 · Distribuir l'aplicació com un sol fitxer HTML

**Estat:** vigent · **Data:** 2026-08-27

## Context

L'aplicació s'adreça a orientadores i orientadors educatius i a equips
docents de centres de primària i secundària de Catalunya. Aquest públic té
tres condicions que no es poden negociar:

- **No pot instal·lar programari** als equips del centre sense passar per la
  gestió informàtica, i sovint ni així.
- **No pot desar dades d'alumnat en serveis de tercers** sense un encàrrec de
  tractament que ningú farà per a una eina d'ús propi.
- **Treballa sovint sense connexió fiable**: aules, reunions amb famílies,
  sessions d'avaluació en sales sense cobertura.

Una aplicació web amb servidor resol el problema tècnic i crea'n tres de
jurídics i organitzatius. Una aplicació d'escriptori exigeix instal·lació i
un paquet per sistema operatiu.

## Decisió

Distribuir l'aplicació com **un únic fitxer HTML autònom**, que es baixa i
s'obre amb doble clic des del disc.

Això obliga a incrustar-hi tot: els estils, el codi, el currículum sencer del
Decret 175/2022 i el catàleg de mesures. Quan un document s'obre amb el
protocol `file://`, el navegador bloqueja els mòduls ES i la lectura de
fitxers del costat, de manera que no hi ha manera de partir-lo en temps
d'execució.

Per no pagar-ho amb un fitxer de 5.900 línies inmantenible, el codi viu
partit a `src/` i un pas de construcció el cus (vegeu
[0003](0003-construccio-en-python.md)).

## Conseqüències

**A favor**

- Zero instal·lació, zero configuració, zero comptes. Baixar i obrir.
- Funciona sense connexió, sempre i des del primer moment.
- Es pot desar en un llapis de memòria, enviar per correu o deixar en una
  carpeta compartida del centre.
- Cada còpia és independent: no hi ha res que es pugui trencar per a tothom
  alhora.
- Es pot arxivar. Un fitxer obert d'aquí a deu anys seguirà funcionant.

**En contra**

- El fitxer fa 1,1 MB, gairebé tot currículum. És el preu de tenir-lo sense
  connexió i és acceptable: cap.
- No hi ha actualització automàtica. Qui vulgui la versió nova l'ha de baixar.
- No es poden fer servir mòduls ES, ni cap eina de desenvolupament que en
  depengui.
- Tot el codi comparteix un àmbit global (vegeu
  [`docs/arquitectura.md`](../arquitectura.md)).

## Alternatives descartades

**Aplicació web amb servidor.** Resol la mida i l'actualització, i introdueix
el problema que fa que l'eina no es pugui fer servir: dades d'alumnat en un
servidor de tercers.

**Progressive Web App.** Necessita un origen `https://` per instal·lar-se i un
service worker; torna a exigir allotjament.

**Electron o Tauri.** Cal instal·lació i un paquet per sistema operatiu, i
l'aplicació passa a ser programari que la gestió informàtica del centre ha
d'autoritzar.

**Fitxer HTML que llegeixi els JSON del costat.** És el que es faria si el
navegador ho permetés. No ho permet amb `file://`, i demanar a un docent que
aixequi un servidor local no és una opció.
