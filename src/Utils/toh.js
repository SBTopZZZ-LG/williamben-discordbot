const { exec } = require("child_process");

// Constants
const outputTimeout = 20000; // 20 seconds

// Enable permissions to executable to avoid runtime errors
exec("chmod +rwx ./src/Utils/toh.out", () => { });

// Timeout variable
let deletionMgr = null;

module.exports = async (n) => new Promise((resolve, reject) => {
    exec(`./src/Utils/toh.out ${n}`, (error, stdout, stderr) => {
        if (error || stderr) {
            return reject(error ?? stderr);
        }
        if (deletionMgr)
            clearTimeout(deletionMgr);

        require("fs").writeFileSync("./src/Utils/toh.txt", stdout);
        deletionMgr = setTimeout(() => {
            require("fs").unlinkSync("./src/Utils/toh.txt");

            // Set deletionMgr to null
            deletionMgr = null;
        }, outputTimeout);

        return resolve("./src/Utils/toh.txt");
    });
});