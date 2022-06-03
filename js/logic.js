
function zeigeUhrzeit()
{
    var str = "";
    var now = new Date();
    str = now.toLocaleTimeString();
    document.getElementById("displayTime").innerHTML = str;
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
    //Für Tests: Uhrzeit vor Mitternacht:
    heute.setHours(23);

    //Füllen des Datum-Inputfeldes mit heutigem Datum
    if(heute.getHours() >= 22) {
        const morgen = new Date();
        morgen.setDate(heute.getDate()+1);
        feldDatum.valueAsDate = morgen;
    }
    else if (heute.getHours() < 2) {
        heute.setDate(heute.getDate()+1);
        feldDatum.valueAsDate = heute;

    }
    else feldDatum.valueAsDate = heute;
    //Füllen des Zeit-Inputfeldes mit Zeit aus "heute"
    //davor Setzen der Voreinstellung (übernächste volle Stunde)


    heute.setHours(heute.getHours()+2);
    heute.setMinutes(00);
    heute.setSeconds(00);
    var voreingestellteZeit = heute.toLocaleTimeString([], {timeStyle: 'short'});
    feldZeit.value = voreingestellteZeit;
}

const logic = ()=>{
    setzeStandardwerte();
    onClickMenuEinblenden();
    onButtonInputfelderAuswerten();
    setInterval(zeigeUhrzeit, 1000);
}