
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

    okButton.addEventListener("click", () => {
        const inputDatum = document.querySelector("#auswahlDatum").value;
        const inputUhrzeit = document.querySelector("#auswahlUhrzeit").value;


        feld.innerHTML = inputDatum.getDate();
    });

}

const app = ()=>{
    onClickMenuEinblenden();
    setInterval(zeigeUhrzeit, 1000);
    onButtonInputfelderAuswerten();
}