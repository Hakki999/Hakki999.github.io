const cursor = document.getElementsByClassName("cursor");
const hover = document.querySelectorAll(".hover");
const root = document.getElementsByClassName("root")[0];
const Action = document.querySelectorAll(".act");
const vd = document.getElementsByClassName("vd");
const cellProjeto = document.querySelectorAll(".cell-projeto");
const page = document.getElementsByClassName("page");

var scale = [1, 1], w = y = sy = p = 0, on = true;
var pageNome = [
    'home',
    'projetos',
    'sobre',
    'contato'
];

function loadingOk(){
    document.getElementsByClassName("loading")[0].style= "display: none;";
    root.style= "";
}

tam();
function tam() {
    w = window.innerWidth / 100;
    h = window.innerHeight / 100;

    moveScroll(0)
}


function revelP(){
    var r = document.querySelectorAll(".revel-"+pageNome[p]);
    r.forEach(r => {
        r.setAttribute("style", "visibility: hidden;");
    })
    let i = 0;

    let st = setInterval(()=>{
        if(i < r.length){
            r[i].setAttribute("style", "animation: ap 0.5s linear normal;");
            i++;
        }else{
            clearInterval(st);
        }
    }, 300)
}

function moveScroll(i) {
    if (on == true) {
        on = false;

        p = i;

        revelP()

        $(".navli").attr("style", "");
        $(".navli").eq(p).attr("style", "list-style: disc; text-shadow: 0.35rem 0.35rem 3.4px rgb(10, 10, 10, 0.3);");

        $('.root').animate({
            scrollTop: (h*100)*p,
            scrollLeft: (w*100)*p
        }, 400);


        setTimeout(() => {
            on = true;
        }, 600)
    }
}

window.addEventListener("resize", tam);

window.addEventListener("mousemove", e => {
    cursor[0].style = "transform: translate(" + (e.pageX - 25) + "px, " + (e.pageY - 25) + "px) scale(" + scale[0] + ");";
    cursor[1].style = "transform: translate(" + (e.pageX - 7.5) + "px, " + (e.pageY - 7.5) + "px) scale(" + scale[1] + ");";
});

hover.forEach(hover => {
    hover.addEventListener("mouseover", e => {
        scale = [3, 1];
    });
    hover.addEventListener("mouseout", e => {
        scale = [1, 1];
    });
})

Action.forEach(Action => {
    Action.addEventListener("mouseover", e => {
        cursor[0].innerHTML= "<span class='textoSeg' style='top: "+Action.getAttribute('altB')+";'>"+Action.getAttribute("act")+"</span>"; 
    });
    Action.addEventListener("mouseout", e => {
        cursor[0].innerHTML= "";
    })
});


var lastScrollTop = 0, delta = 5;
$(".root").scroll(function () {
    var nowScrollTop = $(this).scrollTop();

    if (Math.abs(lastScrollTop - nowScrollTop) >= delta) {
        if (nowScrollTop > lastScrollTop) {
            if (on == true && p < page.length) {
                p++;
                moveScroll(p);
            }
        } else {    
            if (on == true && p > 0) {
                p--;
                moveScroll(p);
            }
        }
        lastScrollTop = nowScrollTop;
    }
});

function copy(i){
    copyI[i].select();
    document.execCommand('copy');
    document.getSelection().removeAllRanges()
}
