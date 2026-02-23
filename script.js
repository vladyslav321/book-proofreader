fetch("/api/check"
function highlightErrors(text, matches) {
    let offset = 0;
    let html = text;

    matches.forEach(match => {
        const start = match.offset + offset;
        const end = start + match.length;

        const wrong = html.substring(start, end);
        const suggestion = match.replacements[0]?.value || "";

        const replacementHTML =
            `<span class="error" data-suggestion="${suggestion}">
                ${wrong}
            </span>`;

        html =
            html.substring(0, start) +
            replacementHTML +
            html.substring(end);

        offset += replacementHTML.length - match.length;
    });

    document.getElementById("output").innerHTML = html;
}
