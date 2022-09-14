const express = require("express");
const Router = express.Router();

Router.get("/", async (_, res) => res.status(200).send("OK"));

module.exports = Router;