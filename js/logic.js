
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
    //Bereitsstellung des Inputfeldes als  
    const feld = document.querySelector("#auswahlDatum");
    const heute = new Date();
    feld.valueAsDate = heute;
}

const logic = ()=>{

    setzeStandardwerte();
    onClickMenuEinblenden();
    onButtonInputfelderAuswerten();
    setInterval(zeigeUhrzeit, 1000);
}