if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    //gibt nach erfolgreichem Abschluss promise, danach:
    .then((reg) => console.log('Service worker erfolgreich registriert', reg))
    //sonst Fehler loggen:
    .catch((err) => console.log('Service worker-Registrierung fehlgeschlagen', err));
}