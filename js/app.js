if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    //gibt nach erfolgreichem Abschluss promise, danach:
    .then((reg) => console.log('Service worker erfolgreich registriert', reg))
    //sonst Fehler loggen:
    .catch((err) => console.log('Service worker-Registrierung fehlgeschlagen', err));
}

function isPushSupported() {
    //prüfen, ob notifications erlaubt sind
    if (Notification.permission === 'denied') {
      alert('Push-Benachrichtigungen sind nicht aktiviert.');
      return;
    }

    //prüfen, ob der Browser Push-Benachrichtigungen unterstützt:
    if (!('PushManager' in window)) {
      alert('Dieser Browser unterstützt keine Push-Benachrichtigungen');
      return;
    }

    //"Push-Benachrichtigungen": Subscription-ID beziehen

    //Wenn Service Worker aktiv und bereit ist:
    navigator.serviceWorker.ready
      .then(function (registration) {
        registration.pushManager.getSubscription()
        .catch(function (err) {
          console.error('Error occurred while enabling push ', err);
        });
      })
  }


function subscribePush() {
    //Subscribes user to Push notifications
    registration.pushManager.subscribe({
        userVisibleOnly: true //Set user to see every notification
    }).then(function (subscription) {
        toast('Subscribed successfully.');
        console.info('Push notification subscribed.');
        console.log(subscription);
        }).catch(function (err) {
            console.error('Push notification subscription error: ', err);
            });
}


function unsubscribePush() {
    navigator.serviceWorker.ready
    .then(function(registration) {
      //Get subscription
      registration.pushManager.getSubscription()
      .then(function (subscription) {
        //If no `push subscription`, then return
        if(!subscription) {
          alert('Unable to unregister push notification.');
          return;
        }

        //Unsubscribes user
        subscription.unsubscribe()
          .then(function () {
            toast('Unsubscribed successfully.');
            console.info('Push notification unsubscribed.');
          })
          .catch(function (error) {
            console.error(error);
          });
      })
      .catch(function (error) {
        console.error('Failed to unsubscribe push notification.');
      });
    })
  }
  
  /*
  Quellen:
  https://www.youtube.com/watch?v=4XT23X0Fjfk
  https://www.educative.io/blog/5-minute-guide-to-push-notifications-in-pwa
  */