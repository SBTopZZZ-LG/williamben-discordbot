const { exec } = require("child_process");

// Constants
const outputTimeout = 20000; // 20 seconds

// Enable permissions to executable to avoid runtime errors
exec("chmod +rwx ./src/Utils/quicksort.out", () => {});

// Timeout variable
let deletionMgr = null;

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
            if (deletionMgr) clearTimeout(deletionMgr);

            const ts = Date.now();
            require("fs").writeFileSync(
                `./src/Utils/quicksort_${ts}.txt`,
                stdout
            );
            deletionMgr = setTimeout(() => {
                require("fs").unlinkSync(`./src/Utils/quicksort_${ts}.txt`);

                // Set deletionMgr to null
                deletionMgr = null;
            }, outputTimeout);

            return resolve(`./src/Utils/quicksort_${ts}.txt`);
        });
    });
