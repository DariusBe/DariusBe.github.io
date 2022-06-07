//Name für Cache-Ressource:
const staticCacheName = "site-static-v1";
//Array der möglichen Requests, die gecacht werden müssen (offline-Funktionalität):
const assets = [
    "/",
    "/index.html",
    "/pages/about.html",
    "/js/app.js",
    "/js/logic.js",
    "/manifest.json",
    "/css/styles.css",
    "/img/wide.png",
    "/img/Antu_Charm_512x512.png",
    "/img/Antu_Charm_DARK_144x144.png",
    "https://fonts.googleapis.com/css2?family=Roboto:wght@100&display=swap",
    "https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1MmgVxIIzI.woff2",
];

//Service Worker für Caching aller nötigen Elemente
self.addEventListener("install", event => {
    //da SerWorker-Install vielleicht früher beendet als Caching:
    //Ressourcen-Caching (asynchron) abwarten mit waitUntil()
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            console.log("Elemente gecacht.");
            cache.addAll(assets);
        })
    );
    console.log("Caching-Service Worker installiert.");
});

//Problem: bei Änderungen an Dateien werden diese in Cache momentan nicht aktualisiert
//Deshalb "site-static" muss versioniert werden! --> neues Install-Event
//Beschaffung 
self.addEventListener("activate", event => {
    console.log("Service Worker aktiviert");

    event.waitUntil(
        caches.keys().then(keys => {
            console.log(keys);
            //alle alten Caches löschen (asynchroner Task)
            //dafür alle promises als Array 
            return Promise.all(keys
                .filter(key => key !== staticCacheName)
                //wenn Ausdruck wahr: behalte betrachteten Promise (mittels Key) in Liste
                //lösche alle keys in diesem Array --> alle alten Caches
                .map(key => caches.delete(key))
            )
        })
    );
});

//Fetch-Events abfangen, fetch auf Cache umleiten (für offline-Funktionalität)
self.addEventListener("fetch", event => {
    //console.log("Fetch ausgelöst", event);
    event.respondWith(
        //wenn der Request auf etwas zielt, das in der Cache liegt:
        caches.match(event.request).then(cacheResponse => {
            //returne diesen Inhalt, sonst returne request --> fahre (online) fort
            return cacheResponse || fetch(event.request).then(fetchResponse => {
                //dann gebe diesen in dynamic cache
            });
        })
    );
});