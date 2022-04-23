const cell = document.querySelectorAll(".cell");
var e1 = e2 = 0;
var in1 = in2 = h = undefined;

function math(){
   return Math.floor(Math.random() * ((cell.length - 1) - 0 + 1)) + 0;
}

setInterval(moveSelect , 3000);

cell.forEach(e => {
   e.addEventListener("mouseenter", j => {
     hoverJ(e.getAttribute("i"));
   })
   e.addEventListener("mouseleave", j => {
      cl();
   })
})

function hoverJ(i){
    h = i;
}

function cl(){
    h = undefined;
}

function moveSelect(){
    e1 = math();
    e2 = math();

    if(e1 == e2 || e1 == h || e2 == h){
        moveSelect();
        e1 = e2 = 0;
    }else{

         

         cell[e1].animate([
            { transform: 'translateY(0px)' },
            { transform: 'translateY(-150%)' },
            { transform: 'translateY(0px)' }
         ], {
            duration: 1500
         })
         cell[e2].animate([
            { transform: 'translateY(0px)' },
            { transform: 'translateY(150%)' },
            { transform: 'translateY(0px)' }
         ], {
            duration: 1500
         })        

         setTimeout(()=>{
            in1 = cell[e1].innerHTML;
            in2 = cell[e2].innerHTML;

            cell[e1].innerHTML = in2;
            cell[e2].innerHTML = in1;
         }, 500)
    }
}
