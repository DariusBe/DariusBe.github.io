function zeigeUhrzeit()
{
    var str = "";
    var now = new Date();

    str = now.toLocaleString();

    document.getElementById("displayTime").innerHTML = str;
}
setInterval(zeigeUhrzeit, 1000);