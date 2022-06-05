//Name für Cache-Ressource:
const staticCacheName = "site-static";
//Liste zu cachender Inhalte:
const assets = [
    //Array der möglichen Requests, die gecacht werden sollen
    "/",     //unspez. index-Page
    "/index.html",  //index-Page
    "/js/app.js",
    "js/logic.js",
    "css/style.css",
    "/img/wide.png",
    "https://fonts.googleapis.com", //Online-Fonts
    "https://fonts.gstatic.com",
];

//Vorbereitung + Konsolen-Output
self.addEventListener("install", event => {
    
    //da SW-Install vielleicht früher beendet als Caching:
    event.waitUntil(

        //Ressourcen-Caching (asynchron)
        caches.open(staticCacheName).then(cache => {
            
            console.log("Elemente gecacht.");
            //Array von Ressourcen vom Server abrufen und in Cache ablegen:
            cache.addAll(assets);
        })
    );
    console.log("Service Worker wurde installiert");
});

self.addEventListener("activate", event => {
    console.log("Service Worker wurde aktiviert");
});

//Fetch-Events:
self.addEventListener("fetch", event => {
    console.log("Fetch ausgelöst", event);
});