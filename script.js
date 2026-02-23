const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

let lastMatches = [];
let lastText = "";

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", e=>{
    e.preventDefault();
});

dropZone.addEventListener("drop", e=>{
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", ()=>{
    handleFile(fileInput.files[0]);
});

function handleFile(file){
    const reader = new FileReader();
    const name = file.name.toLowerCase();

    if(name.endsWith(".txt")){
        reader.onload = e=>{
            document.getElementById("textInput").value = e.target.result;
        };
        reader.readAsText(file);
    }

    else if(name.endsWith(".docx")){
        reader.onload = function(event) {
            mammoth.extractRawText({arrayBuffer: event.target.result})
                .then(result=>{
                    document.getElementById("textInput").value = result.value;
                });
        };
        reader.readAsArrayBuffer(file);
    }

else if(name.endsWith(".pdf")){
    reader.onload = async function(e){

        const progressContainer = document.getElementById("progressContainer");
        const progressBar = document.getElementById("progressBar");

        progressContainer.style.display = "block";
        progressBar.style.width = "0%";

        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({data: typedArray}).promise;

        let fullText = "";

        for(let i = 1; i <= pdf.numPages; i++){

            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);

            fullText += strings.join(" ") + "\n\n";

            const progress = Math.round((i / pdf.numPages) * 100);
            progressBar.style.width = progress + "%";
        }

        document.getElementById("textInput").value = fullText;

        setTimeout(()=>{
            progressContainer.style.display = "none";
        },500);
    };

    reader.readAsArrayBuffer(file);
}
        
    else if(name.endsWith(".epub")){
        const book = ePub(file);
        book.loaded.spine.then(() => {
            let fullText = "";
            book.spine.each(item => {
                item.load(book.load.bind(book)).then(contents => {
                    fullText += contents.document.body.innerText + "\n";
                    item.unload();
                    document.getElementById("textInput").value = fullText;
                });
            });
        });
    }

    else if(name.endsWith(".fb2")){
        reader.onload = function(e){
            const parser = new DOMParser();
            const xml = parser.parseFromString(e.target.result, "text/xml");
            const body = xml.querySelector("body");
            if(body){
                document.getElementById("textInput").value = body.textContent;
            }
        };
        reader.readAsText(file);
    }

    else{
        alert("Unsupported format");
    }
}

async function chunkedGrammarCheck(text){

    const chunkSize = 20000;
    const chunks = [];
    let offset = 0;

    while(offset < text.length){
        chunks.push(text.substring(offset, offset + chunkSize));
        offset += chunkSize;
    }

    let allMatches = [];
    let globalOffset = 0;

    for(const chunk of chunks){

        const response = await fetch("/api/check",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({text:chunk})
        });

        const data = await response.json();

        data.matches.forEach(match=>{
            match.offset += globalOffset;
            allMatches.push(match);
        });

        globalOffset += chunk.length;
    }

    return allMatches;
}

async function checkText(){
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");

    const text = document.getElementById("textInput").value;

    const matches = await chunkedGrammarCheck(text);

    loader.classList.add("hidden");

    lastMatches = matches;
    lastText = text;

    highlightErrors(text, matches);
}

function highlightErrors(text, matches){
    let result = "";
    let lastIndex = 0;

    matches.forEach(match=>{
        const start = match.offset;
        const end = start + match.length;

        result += text.substring(lastIndex, start);

        const wrong = text.substring(start, end);

        result += `<span class="error">${wrong}</span>`;

        lastIndex = end;
    });

    result += text.substring(lastIndex);

    document.getElementById("output").innerHTML = result;
}

function applyFixes(){
    let corrected = lastText;

    lastMatches.reverse().forEach(match=>{
        if(match.replacements.length > 0){
            const suggestion = match.replacements[0].value;
            corrected =
                corrected.substring(0, match.offset) +
                suggestion +
                corrected.substring(match.offset + match.length);
        }
    });

    document.getElementById("textInput").value = corrected;
    document.getElementById("output").innerText = corrected;
}

function downloadText(){
    const text = document.getElementById("textInput").value;
    const blob = new Blob([text], {type:"text/plain"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "corrected.txt";
    link.click();
}
