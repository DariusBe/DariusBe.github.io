
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
        const inputDatum = this.value;
    });

    var dateEntered = new Date(inputDatum);

    const inputUhrzeit = document.querySelector("#auswahlUhrzeit").value;
    const aktuellesDatum = new Date();


    okButton.addEventListener("click", () => {
        feld.innerHTML = dateEntered.getFullYear();
    });

}

const app = ()=>{
    onClickMenuEinblenden();
    setInterval(zeigeUhrzeit, 1000);
    onButtonInputfelderAuswerten();
}