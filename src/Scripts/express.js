const express = require("express");
const app = express();

app.use(express.json());
app.use(require("cors")());

module.exports = (PORT) => {
    app.listen(PORT, () => console.log(`Express server up! Port=${PORT}`));
    return app;
};
