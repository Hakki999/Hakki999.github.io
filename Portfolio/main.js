var py = 0, p = 0, on = true, st = 0, limite = 25, hi= w= NaN;
var lastScrollTop = 0, delta = 5;
const root = document.getElementById("root");
const copy = document.getElementById("copy");
const co = document.getElementsByClassName("co");

tam();
function tam(){   
    w = window.innerWidth/100;
    hi = window.innerHeight/100;
    x = root.scrollWidth/150;
}

window.addEventListener("resize", tam())

var lastScrollTop = 0, delta = 5;

	 $("#root").scroll(function(){
        if(w*100 > 500){
            scrolling();
            console.log(w*100);
        }

});

function scrolling(){
    py = 100 * $("#root").scrollTop() / (root.scrollHeight - window.innerHeight)
    
    root.scrollLeft= py * x;

if(on == true){
 if(root.scrollTop % 2 == 0){
     if(root.scrollTop > lastScrollTop){
         if(p < 2){
             p++;
             scrollMove(p);
         }
     }else{
         if(p > 0){
             p--;
             scrollMove(p);
             console.log("Ok");
         }
     }
 }else{
     lastScrollTop = root.scrollTop;
 }
}else{
 root.scrollTop= (hi*101) * p;
}
}
scrollMove(0)

function scrollMove(id){
    
    if(on){

        on = false;
        p = id;

        $(".nv").attr("class", "hove nv");
        $(".nv").eq(p).attr("class", "hove nv marc");
        
         $("#root").animate({
             scrollTop: hi*100 * id
         }, 450);


        setTimeout(()=>{
            on = true;
        }, 500);
    }
}

function copiar(i){
    copy.value= co[i].innerHTML;

    copy.select();
    document.execCommand('copy');
}
