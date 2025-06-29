const frasesPortfolio = [
  // Desenvolvimento
  "Código limpo, mente limpa.",
  "Soluções que escalam.",
  "Funcionalidade em primeiro lugar.",
  "Performance é tudo.",
  "Código que fala por si.",
  "Menos bugs, mais entrega.",
  "Pensando em cada detalhe.",
  "Backend sólido, frontend fluido.",
  "Pixel perfect? Sempre.",
  "Organizado, testado, entregue.",
  "API como deve ser.",
  "Desenvolvendo com propósito.",
  "Automação com eficiência.",
  "Cada linha, uma solução.",
  "Versátil em qualquer stack.",
  "Interfaces inteligentes.",
  "UX também é código.",
  "CI/CD? Claro que sim.",
  "Full-stack de verdade.",
  "Construindo o futuro digital.",

  // Design
  "Design que comunica.",
  "Beleza com função.",
  "Menos ruído, mais impacto.",
  "Intuitivo é essencial.",
  "Estética funcional.",
  "Harmonia visual real.",
  "Cada cor tem razão.",
  "Layout que guia.",
  "Identidade forte e clara.",
  "Design centrado no usuário.",
  "Experiência que encanta.",
  "Ideias que viram forma.",
  "Criatividade com estratégia.",
  "Tipografia com propósito.",
  "Motion sutil, efeito forte.",
  "Design sem excessos.",
  "Fluxo visual inteligente.",
  "Branding com personalidade.",
  "Cada pixel conta.",
  "Elegância visual.",

  // Inspiracionais e genéricas
  "Soluções além do óbvio.",
  "Crio com intenção.",
  "Transformo ideias em produto.",
  "Detalhes constroem excelência.",
  "Resolvendo com criatividade.",
  "Design encontra tecnologia.",
  "Paixão por resolver problemas.",
  "Onde função e forma se unem.",
  "Projetos que conectam.",
  "Digital com propósito.",
  "Construindo para durar.",
  "Experiências que marcam.",
  "Do esboço ao deploy.",
  "Estável, elegante, eficiente.",
  "Colaboração em cada etapa.",
  "Minimalismo com sentido.",
  "Interfaces que contam histórias.",
  "Transformando visão em interface.",
  "Soluções que encantam.",
  "Desenvolver é criar futuro.",
  
  // Mais técnicas ou pessoais
  "Reutilizável por natureza.",
  "Versátil e escalável.",
  "Design system é base.",
  "Modular é meu estilo.",
  "Performance orienta escolhas.",
  "JS no coração.",
  "Amante do CSS moderno.",
  "Frameworks são ferramentas, não muletas.",
  "Acessibilidade importa.",
  "Mobile first, sempre.",
  "Interfaces inclusivas.",
  "Amigo do Figma e VSCode.",
  "React é meu idioma.",
  "Códigos que ensinam.",
  "Erro? Chance de melhorar.",
  "UI com propósito.",
  "UX que guia.",
  "Processo centrado no usuário.",
  "Do wireframe ao produto.",
  "Códigos que contam histórias."
];
function sortearNumero(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


const textHome = document.getElementById("textHome");

setInterval(()=> {
    textHome.innerHTML = frasesPortfolio[sortearNumero(0, frasesPortfolio.length)]
}, 2000)