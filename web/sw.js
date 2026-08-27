/* Service worker de la versió publicada.
   ======================================

   Existeix per una sola raó: que l'aplicació oberta amb un enllaç es pugui
   instal·lar i tornar a obrir sense connexió, com fa la còpia baixada. Només
   el registra `src/app/09-versio-web.js`, i només quan el document se serveix
   per http(s); la còpia que s'obre des del disc no el veu mai.

   Què guarda i què no
   -------------------
   Guarda l'aplicació (que és pública i igual per a tothom) i els tipus de
   lletra. **No toca cap dada de l'alumnat**: els plans viuen a localStorage i
   a IndexedDB, que no passen pel service worker, i aquí no hi ha cap petició
   que enviï res enlloc. Tot el que fa és respondre amb el que ja s'ha baixat.
   Ho comprova `tests/test_versio_web.py`.

   Estratègies
   -----------
   - Navegació (obrir l'aplicació): **primer la xarxa**. Quan hi ha connexió
     s'obté sempre la versió publicada més recent, que en una eina que porta
     currículum i normativa a dins és el que convé; sense connexió, la còpia
     guardada.
   - Tipus de lletra de Google: **primer el cau**. Són immutables i és el que
     evita que les icones surtin en blanc quan s'obre sense connexió.
   - La resta de l'origen (manifest, icones, el fitxer que baixa el botó):
     primer el cau.

   La versió
   ---------
   `__VERSIO__` la substitueix `tools/pagines.py` per la suma de verificació
   del que es publica. Així el cau es renova exactament quan canvia
   l'aplicació, i no a cada desplegament. */

const VERSIO = "__VERSIO__";
const CAU = "pi-eso-" + VERSIO;
const CAU_FONTS = "pi-eso-fonts";

/* Sense això no hi ha mode sense connexió: si algun falla, la instal·lació
   del service worker s'avorta i es torna a provar la propera vegada. */
const ESSENCIAL = [
  "./",
  "./manifest.webmanifest",
  "./icona-192.png",
  "./icona-512.png",
  "./icona-maskable-512.png",
  "./icona-180.png",
];

/* El fitxer que baixa el botó de descàrrega. Es guarda si es pot, però no es
   fa dependre'n la instal·lació: és un megabyte i mig que no cal per treballar. */
const OPCIONAL = ["./pi-eso.html"];

const ES_TIPOGRAFIA = u =>
  u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cau = await caches.open(CAU);
    await cau.addAll(ESSENCIAL);
    await Promise.all(OPCIONAL.map(u => cau.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms
      .filter(n => n.startsWith("pi-eso-") && n !== CAU && n !== CAU_FONTS)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const peticio = e.request;
  if(peticio.method !== "GET") return;
  const url = new URL(peticio.url);

  if(ES_TIPOGRAFIA(url)){ e.respondWith(primerElCau(peticio, CAU_FONTS)); return; }
  if(url.origin !== self.location.origin) return;
  if(peticio.mode === "navigate"){ e.respondWith(primerLaXarxa(peticio)); return; }
  e.respondWith(primerElCau(peticio, CAU));
});

/* Obrir l'aplicació. La resposta bona es desa sempre sota "./" i no sota
   l'adreça demanada: l'aplicació és una sola pàgina i qualsevol camí de dins
   del seu abast n'ha de rebre el mateix document, també sense connexió. */
async function primerLaXarxa(peticio){
  const cau = await caches.open(CAU);
  try{
    const resposta = await fetch(peticio);
    if(resposta && resposta.ok) await cau.put("./", resposta.clone());
    return resposta;
  }catch(err){
    const desat = await cau.match("./") || await cau.match(peticio);
    return desat || Response.error();
  }
}

async function primerElCau(peticio, nom){
  const cau = await caches.open(nom);
  const desat = await cau.match(peticio);
  if(desat) return desat;
  try{
    const resposta = await fetch(peticio);
    /* Les respostes opaques són les peticions sense CORS als tipus de lletra:
       no se'n pot llegir el contingut, però sí tornar-les tal com són. */
    if(resposta && (resposta.ok || resposta.type === "opaque")){
      await cau.put(peticio, resposta.clone());
    }
    return resposta;
  }catch(err){
    return Response.error();
  }
}
