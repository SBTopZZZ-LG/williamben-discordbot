const { exec } = require("child_process");

// Enable permissions to executable to avoid runtime errors
exec("chmod +rwx ./src/Utils/quicksort.out", () => {});

module.exports = async (payload) =>
    new Promise((resolve, reject) => {
        let args = "";
        if (/[\d ]+/.test(payload)) {
            // Numbers as input
            args = `1 ${payload.split(" ").length} ${payload}`;
        } else if (/[^\d ]+/.test(payload)) {
            // Text as input
            args = `2 ${payload}`;
        } else return reject("Error: Unknown input format!");

        exec(`./src/Utils/quicksort.out ${args}`, (error, stdout, stderr) => {
            if (error || stderr) {
                return reject(error ?? stderr);
            }

            return resolve(stdout);
        });
    });
