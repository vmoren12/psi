# Política de seguretat

## Model d'amenaça

Convé entendre bé què es pot i què no es pot comprometre en aquesta
aplicació, perquè no s'assembla a una aplicació web normal.

**No hi ha servidor.** No hi ha base de dades, ni API, ni comptes, ni sessions.
Les dades de l'alumnat viuen a l'emmagatzematge local del navegador del
dispositiu on s'obre el fitxer i no es transmeten enlloc (vegeu
[`docs/privadesa.md`](docs/privadesa.md)). No hi ha, doncs, res que es pugui
atacar remotament ni cap filtració massiva possible.

El que sí que és rellevant:

| Amenaça | Per què importa |
|---|---|
| **Injecció d'HTML o de codi** a través de text que escriu l'usuari (àlies, notes, títols de mesures pròpies) o de dades importades (CSV d'alumnat, còpies de seguretat JSON). | La interfície es compon amb cadenes i `innerHTML`. Un camp mal escapat executaria codi amb accés a totes les dades desades. |
| **Manipulació del document imprès.** | El PDF que en surt és documentació oficial d'un centre. |
| **Un fitxer `pi-eso.html` alterat** que es distribueixi fent-se passar per aquest. | Podria enviar dades a fora sense que ningú se n'adonés. |
| **Pèrdua de dades** per un defecte de la persistència, la migració o la restauració. | És el risc més probable i el de conseqüències més immediates per a un centre. |

## Comprovar que teniu el fitxer autèntic

La construcció és determinista: les mateixes fonts donen sempre un fitxer
idèntic byte a byte. Podeu comprovar que un `pi-eso.html` correspon a una
versió publicada d'aquest dipòsit:

```bash
sha256sum dist/pi-eso.html
```

i comparar-ho amb la suma que consti a la versió corresponent de *Releases*.
Si no coincideix, el fitxer s'ha modificat: no el feu servir amb dades reals.

## Informar d'una vulnerabilitat

**No obriu una incidència pública** si creieu que heu trobat una manera
d'executar codi o d'extreure dades de l'aplicació.

Feu-ho per l'avís de seguretat privat de GitHub, a la pestanya *Security* del
dipòsit → *Report a vulnerability*.

Digueu-hi, si podeu:

- què es pot aconseguir explotant-ho i amb quin accés previ;
- els passos per reproduir-ho, i el navegador i la versió;
- si cal, un fitxer d'importació mínim que ho provoqui (**sense dades reals
  d'alumnat**).

És un projecte mantingut per una sola persona en el seu temps: la resposta
pot trigar uns dies. Rebreu resposta.

## Si informeu d'un error amb dades reals

**No enganxeu mai dades d'alumnat real** en una incidència, ni en una còpia de
seguretat adjunta. Reproduïu el problema amb les dades d'exemple que
l'aplicació pot carregar des de *Dades i còpies*, o anonimitzeu la còpia abans
d'enviar-la.

## Versions mantingudes

Es manté només l'última versió publicada. Com que l'aplicació és un fitxer que
cadascú té al seu dispositiu, actualitzar-se vol dir baixar el fitxer nou; les
dades desades es conserven, perquè viuen al navegador i no al fitxer.
