//Vorbereitung + Konsolen-Output
self.addEventListener("install", event => {
    console.log("Service Worker wurde installiert");
});

self.addEventListener("activate", event => {
    console.log("Service Worker wurde aktiviert");
});

//Fetch-Events:
self.addEventListener("fetch", event => {
    console.log("Fetch ausgelöst", event);
});