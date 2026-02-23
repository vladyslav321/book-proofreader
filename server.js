const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({limit:"10mb"}));

app.post("/check", async (req, res) => {
    const { text } = req.body;

    try {
        const response = await axios.post(
            "https://api.languagetool.org/v2/check",
            new URLSearchParams({
                text: text,
                language: "en-US"
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Grammar API error" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
