const uploadPdf1 = document.getElementById('upload-pdf-1');
const uploadPdf2 = document.getElementById('upload-pdf-2');
const result = document.getElementById('result');
const id = document.getElementsByClassName("id");
const recorte = document.getElementById("recorte");
const video = document.getElementById("video");
var url_atual = window.location.href;
var verUrl = url_atual.split("");


var videos = [
    "https://cdn.pixabay.com/video/2023/11/26/190776-888535446_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/07/27/223459_large.mp4",
    "https://cdn.pixabay.com/video/2024/06/06/215484_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/03/04/202982-919365848_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/03/14/154726-808562497_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/03/04/202877-919288692_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/05/07/38388-418005845_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/05/07/38388-418005845_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/05/07/38388-418005845_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/05/07/38388-418005845_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/01/21/197564-905005767_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/06/10/216058_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/08/14/47213-451041047_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/05/25/213616_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/10/08/184069-872413642_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/12/09/192649-892970391_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/11/10/188595-883402169_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/09/30/182970-869947284_tiny.mp4",
    "https://cdn.pixabay.com/video/2023/07/04/169951-842348732_tiny.mp4",
    "https://cdn.pixabay.com/video/2021/10/05/90877-629483574_tiny.mp4",
    "https://cdn.pixabay.com/video/2022/03/18/111204-689949818_tiny.mp4",
    "https://cdn.pixabay.com/video/2021/07/18/81945-577442929_tiny.mp4",
    "https://cdn.pixabay.com/video/2021/08/04/83880-585600454_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/12/15/59291-492700392_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/08/30/48569-454825064_tiny.mp4",
    "https://cdn.pixabay.com/video/2016/05/12/3134-166335905_tiny.mp4",
    "https://cdn.pixabay.com/video/2016/05/12/3134-166335905_tiny.mp4"
]

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }
  

function getRandom() {
    let max = videos.length;

    return videos[getRandomInt(0, max)];
}

video.src = getRandom();


verUrl.forEach(e => {
    if(e == "?"){
        console.log("Possui um encaminhamento...");

        let dadosUrl = url_atual.split("?")[1].split("&");
        if(dadosUrl[0] == undefined) dadosUrl[0] = "";
        if(dadosUrl[1] == undefined) dadosUrl[1] = "";

            id[0].value = dadosUrl[0];
            id[1].value = dadosUrl[1];
    }
})







let pdfBytes1;
let pdfBytes2;

// Função para converter imagem para ArrayBuffer via fetch
async function fetchImageAsArrayBuffer(imagePath) {

    const response = await fetch(imagePath);
    if (!response.ok) {
        throw new Error(`Erro ao carregar a imagem: ${response.statusText}`);
        result.textContent = "Erro ao carregar a imagem."
        result.style = "background-color: #ff9393;"
    }
    return await response.arrayBuffer();
}

function generateName(n) {
    console.log(recorte.value);
    
    if(recorte.checked) n = "RECORTE";
    let nome = id[1].value + "_RD_" + n + "_" + id[0].value + "_R00";
    console.log(nome);
    return nome;
}

// Função para inserir imagem JPEG no PDF com proporção correta e rotação
async function insertJpegInPdf(pdfData, imageData, x, y, maxWidth, maxHeight, rotationDegrees) {
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Carrega a imagem JPEG
    const image = await pdfDoc.embedJpg(imageData);

    // Obtém as dimensões originais da imagem
    const { width: originalWidth, height: originalHeight } = image.scale(1);

    // Calcula as novas dimensões mantendo a proporção
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const scaleRatio = Math.min(widthRatio, heightRatio);

        width *= scaleRatio;
        height *= scaleRatio;
    }

    // Insere a imagem na página na posição especificada com rotação
    firstPage.drawImage(image, {
        x: x,
        y: y,
        width: width,
        height: height,
        rotate: PDFLib.degrees(rotationDegrees),
    });

    // Salva o PDF editado
    const updatedPdfBytes = await pdfDoc.save();
    return updatedPdfBytes;
}

// Função para compactar dois PDFs em um arquivo ZIP
async function zipPdfs(pdf1, pdf2) {
    const zip = new JSZip();
    zip.file(generateName("PROJETO") + ".pdf", pdf1);
    zip.file(generateName("LEVANTAMENTO") + ".pdf", pdf2);

    const content = await zip.generateAsync({ type: "blob" });

    // Criar um link para download do arquivo ZIP
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = generateName("ARQUIVOS") + '.zip';
    link.click();


}

// Manipulação dos eventos de upload do PDF 1
uploadPdf1.addEventListener('change', async (e) => {


    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
        pdfBytes1 = reader.result;

        // Obter as dimensões do PDF
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes1);
        const pages = pdfDoc.getPages();
        const sizes = pages.map((page) => {
            const { width, height } = page.getSize();
            return { width, height };
        });

        const sizesF = [
            { width: 2384, height: 3370, folha: "A0", imgX: 2850, imgY: 1990, tm: 200 },
            { width: 1684, height: 2384, folha: "A1", imgX: 1890, imgY: 1284, tm: 200 },
            { width: 1191, height: 1684, folha: "A2", imgX: 1280, imgY: 870, tm: 120 },
            { width: 842, height: 1191, folha: "A3", imgX: 50, imgY: 790, tm: 120 },
            { width: 595, height: 842, folha: "A4", imgX: 350, imgY: 555, tm: 90 }
        ];

        const temp = sizesF.find(element => sizes[0].width === element.width);

        if (!temp) {
            console.error("Erro ao encontrar o tamanho da folha");
            result.textContent = "Erro ao encontrar o tamanho da folha.";
            result.style = "background-color: #ff9393;"
            return;
        }
        result.textContent = "Primeiro PDF carregado.";
        result.style = "background-color: rgb(140 252 151);";


        // Mostrar o botão de inserir imagem
        document.getElementById('add-image').style.display = 'inline-block';

        document.getElementById('add-image').addEventListener('click', async () => {
            if (pdfBytes1) {
                try {
                    // Carregar a imagem da pasta 'img' com o nome 'qrcode.jpeg'
                    const imageBytes = await fetchImageAsArrayBuffer('./qrcode.jpeg');

                    // Inserir a imagem no PDF com rotação de 90 graus
                    const updatedPdfBytes1 = await insertJpegInPdf(pdfBytes1, imageBytes, temp.imgY, temp.imgX, temp.tm, (temp.tm + 100), 90);

                    // Atribuir pdfBytes1
                    pdfBytes1 = updatedPdfBytes1;

                    // Verifica se o segundo PDF foi carregado para compactar
                    if (pdfBytes2) {
                        await zipPdfs(pdfBytes1, pdfBytes2);
                        result.textContent = 'Arquivos PDF compactados com sucesso!';
                        result.style = "background-color: rgb(140 252 151);"
                    } else {
                        if (pdfBytes1 != "") {
                            const blob = new Blob([updatedPdfBytes1], { type: 'application/pdf' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = generateName("PROJETO") + '.pdf';
                            link.click();
                        }
                    }
                } catch (error) {
                    result.textContent = `Erro ao inserir imagem: ${error.message}`;
                    result.style = "background-color: #ff9393;"
                }
            } else {
                result.textContent = 'Por favor, selecione um PDF.';
                result.style = "background-color: #ff9393;"
            }
        });
    };
    reader.readAsArrayBuffer(file);
});

// Manipulação dos eventos de upload do PDF 2
uploadPdf2.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    console.warn(Math.floor(file.size / 1000));

    const reader = new FileReader();
    reader.onload = async () => {
        pdfBytes2 = reader.result;

        // Exibir mensagem que o segundo PDF foi carregado
        result.textContent = 'Segundo PDF carregado.';
        result.style = "background-color: rgb(140 252 151);"
    };
    reader.readAsArrayBuffer(file);
});
