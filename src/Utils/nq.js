const { exec } = require("child_process");

// Constants
const outputTimeout = 20000; // 20 seconds

// Enable permissions to executable to avoid runtime errors
exec("chmod +rwx ./src/Utils/nq.out", () => { });

// Timeout variable
let deletionMgr = null;

module.exports = async (n) => new Promise((resolve, reject) => {
    exec(`./src/Utils/nq.out ${n}`, (error, stdout, stderr) => {
        if (error || stderr) {
            return reject(error ?? stderr);
        }
        if (deletionMgr)
            clearTimeout(deletionMgr);

        require("fs").writeFileSync("./src/Utils/nq.txt", stdout);
        deletionMgr = setTimeout(() => {
            require("fs").unlinkSync("./src/Utils/nq.txt");

            // Set deletionMgr to null
            deletionMgr = null;
        }, outputTimeout);

        return resolve("./src/Utils/nq.txt");
    });
});