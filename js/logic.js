var startzeit = new Date();

function zeigeUhrzeit()
{
    const displayZeit = document.querySelector("#displayZeit");
    var str = "";
    var now = new Date();
    str = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    displayZeit.innerHTML = str;
}

function onClickMenuEinblenden() {
    const burgermenu = document.querySelector("#bm");
    burgermenu.addEventListener("click", () => {
        document.querySelector("#me").classList.toggle("menuElems-active");
        document.querySelector(".countdownPanel").classList.toggle("countdownPanel-up");
    });
}

function setzeStandardwerte() {
    //Bereitsstellung der Inputfelder
    const feldDatum = document.querySelector("#auswahlDatum");
    const feldZeit = document.querySelector("#auswahlUhrzeit");

    //Erzeugen eines neuen, aktuellen Datums
    const heute = new Date();
    const presetDatum = new Date(heute);

    /*Für Tests - Uhrzeit vor Mitternacht*/
    // presetDatum.setHours(1);

    //Füllen des Datum-Inputfeldes mit heutigem Datum
    if(presetDatum.getHours() >= 22) {
        const morgen = new Date();
        //Hinzufügen eines Tages (in ms)
        morgen.setTime(presetDatum.getTime() + 24*60*60*1000);
        feldDatum.valueAsDate = morgen;
    }
    //Für 00/01 Uhr auftretende Datumsdiskrepanz zuaddieren
    else if (presetDatum.getHours() < 2) {
        presetDatum.setDate(presetDatum.getDate()+1);
        feldDatum.valueAsDate = presetDatum;
    }
    //Für alle anderen Uhrzeiten
    else { 
        feldDatum.valueAsDate = presetDatum;
    }

    //Füllen des Zeit-Inputfeldes mit Zeit aus "heute"
    //davor Setzen der Voreinstellung (übernächste volle Stunde)
    presetDatum.setHours(presetDatum.getHours()+2);
    presetDatum.setMinutes(0);
    presetDatum.setSeconds(0);
    var presetZeit = presetDatum.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    feldZeit.value = presetZeit;
}

function aendereTimerzeit() {
    const feld = document.querySelector("#displayEnde");
    var date = new Date(leseFelderAus());
    ende = date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    feld.innerHTML = "Ende: " + ende;
}

function zeigeRestzeit() {
    const feld = document.querySelector("#displayRestzeit");
    var outputDatum = new Date(leseFelderAus());

    localStorage.setItem("gewaehltesDatum", outputDatum);

    const jetzt = new Date();


    //Datumsdifferenz in Sekunden:
    var uebrigeSekunden;
    uebrigeSekunden = Math.floor(datumsDifferenzInSek(outputDatum, jetzt));
    var uebrigeMinuten = Math.floor(uebrigeSekunden/60);
    var uebrigeStunden = Math.floor(uebrigeSekunden/3600);

    if (datumsDifferenzInSek(outputDatum, jetzt) < 0) {
        feld.innerHTML = "dieser Zeitpunkt liegt in der Vergangenheit!";
        document.querySelector("#restzeitLabel").style.display = "none";
        document.querySelector("body").classList.toggle("html-alert");
    }
    else if (uebrigeStunden==1 && uebrigeMinuten==60) {
        if(uebrigeMinuten%15 == 0) document.querySelector("#displayRestzeit").classList.toggle("blink");
        feld.innerHTML = uebrigeMinuten%61+" Min.";
    }
    else if (uebrigeStunden<1 && uebrigeMinuten<60 && uebrigeSekunden>61) {
        if(uebrigeMinuten%15 == 0) document.querySelector("#displayRestzeit").classList.toggle("blink");
        feld.innerHTML = uebrigeMinuten%61+" Min.";    }
    else if (uebrigeSekunden<60) {
        feld.innerHTML = uebrigeSekunden+1+" Sek.";
    }
    else {
        if(uebrigeMinuten%15 == 0) document.querySelector("#displayRestzeit").classList.toggle("blink");
        feld.innerHTML = uebrigeStunden+" Std. " + uebrigeMinuten%60+" Min.";
    }
    //nach Durchlauf Label "verbliebene Zeit" wieder einblenden und style wiederherstellen
    document.querySelector("#restzeitLabel").style.display = "block";
    const fuellung = document.querySelector(".fuellStand");
    const balken = document.querySelector(".ladeBalken");

    /*Ladebalken*/
    /*const prozent = (minVal/maxVal)*100;*/
    const lel = startzeit;
    const minVal = jetzt;
    const maxVal = outputDatum;
    const schritt = minVal-lel;
    const rech = maxVal-lel;
    var prozent = Math.floor((schritt/rech)*100);

    /* Testausgabe */
    // document.querySelector("#ausgabe").style.display = "block";
    // document.querySelector("#ausgabe").innerHTML =
    // "maxVal: " + maxVal.getTime() + "<br>" +
    // "minVal: " + minVal.getTime() + "<br>" + 
    // "start: " + lel.getTime() + "<br>" +
    // "schritte: " + schritt + "<br>" +
    // "max-start: " + rech + "<br>" +
    // "prozent: " + prozent;
    
    str = prozent+"%";
    if(prozent<100) {
        fuellung.style.width = str;
    }
    else if (prozent>100) {
        fuellung.style.width = str;
    }

}

function leseFelderAus() {
    const feldDatum = document.querySelector("#auswahlDatum").valueAsDate;
    const feldZeit = document.querySelector("#auswahlUhrzeit").valueAsDate;

    //Datumsobjekt aus Feldern erzeugen:
    fJahr = feldDatum.getUTCFullYear();
    fMonat = feldDatum.getUTCMonth();
    fTag = feldDatum.getUTCDate();
    fStunde = feldZeit.getUTCHours();
    fMinute = feldZeit.getUTCMinutes();
    fSekunde = feldZeit.getUTCSeconds();
    const outputDatum = new Date(fJahr, fMonat, fTag, fStunde, fMinute, fSekunde, 0);
    
    return outputDatum;
}

function datumsDifferenzInSek(datumEnde, datumAnfang) {
    var diff = ((datumEnde-datumAnfang)/1000);
    return diff;
}

function onButton() {
    const okButton = document.querySelector("#okButton");
    const panel = document.querySelector(".countdownPanel");

    okButton.addEventListener("click", () => {
        aendereTimerzeit();
        startzeit = new Date();
        //Unterscheidung notwendig: nur in Mobil-Ansicht
        //wird Panel nach oben verschoben; auch: Aufhebung des Alert-Effekts 
        if (window.matchMedia("(max-width: 600px)").matches) {
            document.querySelector("body").classList.remove("html-alert");
            panel.classList.toggle("countdownPanel-up");
            document.querySelector("#me").classList.toggle("menuElems-active");

          }
        else {
            document.querySelector("body").classList.remove("html-alert");
        }
        //Fehler ausschließen, dass Body-Alert nach Auswahl gültiger Uhrzeit erhalten bleibt:
    });
}

// function checkoxAuslesen() {
//     const checkbox = document.querySelector("#notifyCheckbox");

//     checkbox.addEventListener("change", () => {
//         pushInit();
//         istPushSupported();

//         if(Notification.permission === 'granted') {

//             console.log("1");
//             unsubscribePush();
//         }
//         else if(Notification.permission === 'denied') {
//             console.log("2");
//             pushAnmelden();
//         }
//         else if(Notification.permission === 'default') {
//             console.log("3");
//             var n = new Notification("Hi there!");
//         }
//     });

// }

const logic = ()=>{
    //checkoxAuslesen();
    onButton();
    setInterval(zeigeUhrzeit, 1000);
    onClickMenuEinblenden();
    setzeStandardwerte();
    aendereTimerzeit();
    setInterval(zeigeRestzeit, 1000);
}