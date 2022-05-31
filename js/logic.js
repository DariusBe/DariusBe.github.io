
const slideMenu = () => {
    const burger = document.querySelector(".burgerMenu2");
    const nav = document.querySelector(".menuElems");

    burger.addEventListener("click", () => {
        nav.classList.toggle("topbar-active");
    });
}


function zeigeUhrzeit()
{
    var str = "";
    var now = new Date();

    str = now.toLocaleTimeString();

    document.getElementById("displayTime").innerHTML = str;
}


const app = ()=>{
    setInterval(zeigeUhrzeit, 1000);
    slideMenu();
}

app();
