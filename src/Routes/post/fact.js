const express = require("express");
const Router = express.Router();

module.exports = (callback) => {
    Router.head("/post/fact", async (_, res) => {
        callback();
        return res.status(200).send();
    });

    return Router;
};
