const mag = document.querySelectorAll(".mag");
const hover = document.querySelectorAll(".hove");
sl = 1;

$(window).on("mousemove", e => {
    m(e, sl, 1);
})

function m(e, Scale, slo){
    $(".cursor").eq(0).attr("style", "transform: translate("+(e.pageX - 17)+"px, "+(e.pageY - 17)+"px) scale("+Scale+")")
    $(".cursor").eq(1).attr("style", "transform: translate("+(e.pageX - 7)+"px, "+(e.pageY - 7)+"px ) scale("+slo+");")
}

$(window).on("mouseout", e => {
    m(e, 0.0000000000001, 0.00000000000001)
})



hover.forEach((h)=>{
    h.addEventListener("mousemove", e => {
        sl = 5;
    })
    h.addEventListener("mouseleave", e => {
        sl = 1;
    })
})

//-----------------------


mag.forEach(btn => {
    btn.addEventListener("mousemove", e => {
        const position = btn.getBoundingClientRect();
        const x = e.pageX - position.left - position.width / 2;
        const y = e.pageY - position.top - position.height / 2;

        btn.children[0].style.transform = "translate(" + x * 0.3 + "px, " + y * 0.5 + "px)";
    });
    btn.addEventListener("mouseleave", e => {
        btn.children[0].style.transform = "";
    })
})
