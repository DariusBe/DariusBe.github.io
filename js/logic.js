
function zeigeUhrzeit()
{
    var str = "";
    var now = new Date();

    str = now.toLocaleTimeString();

    document.getElementById("displayTime").innerHTML = str;
};


const app = ()=>{
    setInterval(zeigeUhrzeit, 1000);
}

app();
