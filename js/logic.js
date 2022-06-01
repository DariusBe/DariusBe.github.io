
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

const app = ()=>{
    onClickMenuEinblenden();
    setInterval(zeigeUhrzeit, 1000);
}