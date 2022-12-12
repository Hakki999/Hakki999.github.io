const pg = document.getElementsByClassName("pg");
const os = ['a', 'b', 'c'];

var x = 1;

function next(ii, i) {
    if (x == 1) {
        x = 0;




        if (ii == 2) {
            pg[ii].style = " animation-name: toLeft;animation-duration: 2s;";
            pg[i].style= "animation-name: page;animation-duration: 2s;";

        } else {
            pg[ii].style = " animation-name: page;animation-duration: 2s;";
            pg[i].style = " animation-name: pagee;animation-duration: 2s;";

            setTimeout(() => {
                pg[i].style = "display: none; z-index: 1;";
            pg[ii].style = "";
                x = 1;
            }, 1400)
        }

    }



}