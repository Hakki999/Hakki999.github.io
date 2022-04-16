const inp = document.getElementById("inp");
const cont = document.getElementById("cont");
var on = false, st, txt = "", i = 0, s = 100;

inp.select();

document.addEventListener("keypress", e => {
    console.log(e.keyCode);
    if(e.keyCode == 13){
        if(on){
            pause();
            on = false;
        }else{
            start();
            on = true;
        }
    }
    if(e.keyCode == 32 && on){
        pause();
        on = false;
    }
    if(e.keyCode == 115 && on == false){
       s = prompt("Qual a velociade em milissegundos?");
    }
    if(e.keyCode == 114){
        i = 0;
    }
})

function start(){
    inp.style= "display: none;";
    cont.style= "";

    txt = inp.value.split(" ");
    alert("Para ler isso vai demorar: "+ (txt.length * s) / 1000) + " Segundos;" 

   st = setInterval(()=>{
    if(i >= txt.length){
        clearInterval(st);
        i = 0;
        pause();
    }
        cont.textContent= txt[i] + " ";
        i++;
        
    }, s)
}

function pause(){
    inp.style= "display: block;";
    cont.style= "display: none;";

    clearInterval(st);
}
