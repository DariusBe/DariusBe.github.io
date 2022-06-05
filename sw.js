//Name für Cache-Ressource:
const staticCacheName = "site-static";
//Array der möglichen Requests, die gecacht werden sollen
const assets = [
    "/",
    "/index.html",
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

//Service Worker für Caching aller nötigen Elemente (offline)
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

self.addEventListener("activate", event => {
    console.log("Service Worker aktiviert");
});

//Fetch-Events abfangen, fetch auf Cache umleiten (für offline-Funktionalität)
self.addEventListener("fetch", event => {
    //console.log("Fetch ausgelöst", event);
    event.respondWith(
        //wenn der Request auf etwas zielt, das in der Cache liegt:
        caches.match(event.request).then(cacheResponse => {
            //returne diesen Inhalt, sonst returne request --> fahre (online) fort
            //
            return cacheResponse || fetch(event.request);
        })
    )
});