document.addEventListener("DOMContentLoaded", function () {
    const navOps = document.querySelectorAll(".navOp");
    const nav = document.querySelector("nav");
    const contInd = document.querySelector("#contInd");
    const indicNav = contInd.querySelector("#indicNav");

    if (navOps.length === 0 || !contInd || !indicNav) return;

    // Configurações
    const firstNavOp = navOps[0];
    const navOpWidth = firstNavOp.getBoundingClientRect().width;
    const originalWidth = navOpWidth;
    indicNav.style.width = `${originalWidth}px`;

    // Área útil para mover o indicador
    const usableWidth = contInd.getBoundingClientRect().width - navOpWidth;
    const fullScrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Variáveis para controle do timeout
    let scrollTimeout;
    let isExpanded = false;
    const SCROLL_DELAY = 500; // 1 segundo

    // Função para encontrar o navOp mais próximo da posição atual
    function findClosestNavOp(scrollPercent) {
        scrollPercent = scrollPercent * 100

        let index = 0;

        if (scrollPercent < 25) index = 0;
        if (scrollPercent > 25 && scrollPercent < 50) index = 1;
        if (scrollPercent > 50 && scrollPercent < 75) index = 2;
        if (scrollPercent > 75 && scrollPercent < 105) index = 3;

        console.log(index);
        console.warn(scrollPercent);


        return navOps[index];
    }

    // Função para alinhar e expandir o indicador
    function alignAndExpandIndicator(targetOp) {
        if (!targetOp) return;

        const opRect = targetOp.getBoundingClientRect();
        const containerRect = contInd.getBoundingClientRect();
        const relativePosition = opRect.left - containerRect.left;

        // Expande o indicador
        if (!isExpanded) {
            indicNav.style.width = `${originalWidth * 1.1}px`;
            isExpanded = true;

            // Retorna ao tamanho original após 0.5s
            setTimeout(() => {
                indicNav.style.width = `${originalWidth}px`;
                isExpanded = false;
            }, 500);
        }

        // Alinha com o item de navegação
        indicNav.style.transition = 'transform 0.3s ease, width 0.2s ease';
        indicNav.style.transform = `translateX(${relativePosition}px)`;

        // Remove a transição após o alinhamento
        setTimeout(() => {
            indicNav.style.transition = 'transform 0.2s ease';
        }, 300);
    }

    // Função principal de scroll
    function handleScroll() {
        const scrollPercent = window.scrollY / fullScrollHeight;
        const moveDistance = scrollPercent * usableWidth;

        // Movimento normal do indicador
        indicNav.style.transition = 'transform 0.2s ease';
        indicNav.style.transform = `translateX(${moveDistance}px)`;

        // Limpa o timeout anterior
        clearTimeout(scrollTimeout);

        // Configura novo timeout para alinhar após parar de scrollar
        scrollTimeout = setTimeout(() => {
            const closestNavOp = findClosestNavOp(scrollPercent);
            alignAndExpandIndicator(closestNavOp);
        }, SCROLL_DELAY);

        if((scrollPercent*100) < 5) {
            nav.classList.add("baseNav")
        }else{
            console.log("ok");
            
           nav.classList.remove("baseNav")
        }
    }

    // Event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Inicialização
    handleScroll();
});

function scrollToSection(classe) {
    const section = document.getElementsByClassName(classe)[0];
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}