const express = require("express");
const path = require("path");
const Router = express.Router();
const nq = require("../../Utils/nq");

Router.get("/util/nq", async (req, res) => {
    try {
        const queries = req.query;

        let payload = queries.payload;
        if (!payload || payload.trim() === "")
            return res.status(400).send("<h2>Payload required</h2>");
        try {
            payload = parseInt(payload);
            if (payload < 1 || payload > 9)
                throw new Error(
                    "Payload cannot be less than 1 or greater than 9"
                );
        } catch (e) {
            return res.status(400).send("Error: " + e.message);
        }

        let htmltext = require("fs")
            .readFileSync(path.join(__dirname, "../../Models/html.output.html"))
            .toString();
        const resultText = require("fs")
            .readFileSync(await nq(payload))
            .toString();

        htmltext = htmltext
            .split("{{{title}}}")
            .join("N-Queens")
            .split("{{{input}}}")
            .join(payload)
            .split("{{{output}}}")
            .join(resultText);

        return res.status(200).send(htmltext);
    } catch (e) {
        return res.status(500).send("<h1>Internal error</h1>");
    }
});

module.exports = Router;
