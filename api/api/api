api/check.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { text } = req.body;

    try {
        const response = await fetch(
            "https://api.languagetool.org/v2/check",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    text: text,
                    language: "en-US"
                })
            }
        );

        const data = await response.json();
        res.status(200).json(data);

    } catch (err) {
        res.status(500).json({ error: "Grammar API error" });
    }
}
