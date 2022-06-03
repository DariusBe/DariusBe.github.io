
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
};

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
    //presetDatum.setHours(22);

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

function onButtonInputfelderAuswerten() {
    const feld = document.querySelector("#displayRestzeit");
    const okButton = document.querySelector("#okButton");

    document.querySelector("#auswahlDatum").addEventListener("change", () => {
        var inputDatum = document.querySelector("#auswahlDatum").valueAsDate;
        var dateEntered = new Date(inputDatum);
        const gerade = new Date;
        setInterval(feld.innerHTML = (gerade.getTime()-dateEntered.getTime())/360000, 1000);
    });

    var inputDatum = document.querySelector("#auswahlDatum").value;
    var dateEntered = new Date(inputDatum);

    const inputUhrzeit = document.querySelector("#auswahlUhrzeit").value;
    const aktuellesDatum = new Date();
    //feld.innerHTML = dateEntered;

    okButton.addEventListener("click", () => {
        //TODO
    });

}

function zeigeRestzeit() {
    const feldDatum = document.querySelector("#auswahlDatum").valueAsDate;
    const feldZeit = document.querySelector("#auswahlUhrzeit").valueAsDate;
    var feld = document.querySelector("#displayRestzeit");
    
    //Datumsobjekt aus Feldern erzeugen:
    fJahr = feldDatum.getUTCFullYear();
    fMonat = feldDatum.getUTCMonth();
    fTag = feldDatum.getUTCDate();
    fStunde = feldZeit.getUTCHours();
    fMinute = feldZeit.getUTCMinutes();
    fSekunde = feldZeit.getUTCSeconds();
    var outputDatum = new Date(fJahr, fMonat, fTag, fStunde, fMinute, fSekunde, 0);

    //Datumsdifferenz in Sekunden:
    var uebrigeSekunden = Math.floor(datumsDifferenzInSek(outputDatum));
    var uebrigeMinuten = Math.floor(uebrigeSekunden/60);
    var uebrigeStunden = Math.floor(uebrigeSekunden/3600);

    if (datumsDifferenzInSek(outputDatum) < 0) {
        feld.innerHTML = "dieser Zeitpunkt liegt in der Vergangenheit!";
        document.querySelector("#restzeitLabel").style.display = "none";
        document.querySelector("body").classList.toggle("html-alert");
    }
    else if (uebrigeStunden==1 && uebrigeMinuten==60) {
        feld.innerHTML = uebrigeMinuten%61+" Min.";
    }
    else if (uebrigeStunden<1 && uebrigeMinuten<60 && uebrigeSekunden>61) {
        feld.innerHTML = uebrigeMinuten%61+" Min.";
    }
    else if (uebrigeSekunden<60) {
        feld.innerHTML = uebrigeSekunden+1+" Sek.";
    }
    else feld.innerHTML = uebrigeStunden+" Std. " + uebrigeMinuten%60+" Min.";
    

}

function datumsDifferenzInSek(datum) {
    const jetzt = new Date();
    var diff = ((datum-jetzt)/(1000));
    return diff;
}

const logic = ()=>{
    setInterval(zeigeUhrzeit, 1000);
    setInterval(zeigeRestzeit, 1000);
    onClickMenuEinblenden();
    setzeStandardwerte();
    onButtonInputfelderAuswerten();
}