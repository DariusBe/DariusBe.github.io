
function zeigeUhrzeit()
{
    const displayZeit = document.querySelector("#displayTime");
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

function setzeStandardwerte() {
    //Bereitsstellung der Inputfelder
    const feldDatum = document.querySelector("#auswahlDatum");
    const feldZeit = document.querySelector("#auswahlUhrzeit");

    //Erzeugen eines neuen, aktuellen Datums
    const heute = new Date();
    const presetDatum = new Date(heute);

    /*Für Tests - Uhrzeit vor Mitternacht*/
    presetDatum.setHours(1);

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

function zeigeRestzeit() {
    const feldDatum = document.querySelector("#auswahlDatum");
    const feldZeit = document.querySelector("#auswahlUhrzeit");
}

const logic = ()=>{
    setzeStandardwerte();
    onClickMenuEinblenden();
    onButtonInputfelderAuswerten();
    setInterval(zeigeUhrzeit, 1000);
}