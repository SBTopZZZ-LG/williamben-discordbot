const express = require("express");
const path = require("path");
const Router = express.Router();
const quicksort = require("../../Utils/quicksort");

Router.get("/util/qs", async (req, res) => {
    try {
        const queries = req.query;

        let payload = queries.payload;
        if (!payload || payload.trim() === "")
            return res.status(400).send("<h2>Payload required</h2>");

        // Replace multiple spaces with single space to avoid errors
        payload = payload.replace(/ +/g, " ");

        let htmltext = require("fs")
            .readFileSync(path.join(__dirname, "../../Models/html.output.html"))
            .toString();
        const resultText = await quicksort(payload);

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
