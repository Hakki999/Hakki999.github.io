const btn = document.getElementsByClassName("btn");
const card = document.getElementById("card");
const text = document.getElementById("text");

var w = 0, h = w, bond, sx = 0, sy = sx, x=0, y=0, macB;

tam();
function tam(){
    w = window.innerWidth/100;
    h = window.innerHeight/100;

    bond = card.getBoundingClientRect();
    macB = btn[0].getBoundingClientRect();

    console.log(bond);
}
window.addEventListener("resize", tam);

btn[1].addEventListener("click", Not);
btn[0].addEventListener("click", yes);

function Not(){
    x = Math.floor(Math.random() * ((bond.x + bond.width - macB.width) - bond.x + 1)) + bond.x;
    y = Math.floor(Math.random() * ((bond.y + bond.height - macB.height) - bond.y + 1)) + bond.y;

    btn[1].style= "position: absolute; top: "+y+"px; left: "+x+"px;";
}

function yes(){
    text.textContent= "Sabia, kkkk";
}
