const express = require("express");
const path = require("path");
const Router = express.Router();
const quicksort = require("../../Utils/quicksort");

Router.get("/util/qs", async (req, res) => {
    try {
        const queries = req.query;

        const payload = queries.payload;
        if (!payload || payload.trim() === "")
            return res.status(400).send("<h2>Payload required</h2>");

        let htmltext = require("fs")
            .readFileSync(path.join(__dirname, "../../Models/html.output.html"))
            .toString();
        const resultText = require("fs")
            .readFileSync(await quicksort(payload))
            .toString();

        htmltext = htmltext
            .split("{{{title}}}")
            .join("Quicksort")
            .split("{{{input}}}")
            .join(payload.trim())
            .split("{{{output}}}")
            .join(resultText);

        return res.status(200).send(htmltext);
    } catch (e) {
        return res.status(500).send("<h1>Internal error</h1>");
    }
});

module.exports = Router;