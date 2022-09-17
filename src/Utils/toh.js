const { exec } = require("child_process");
exec("chmod +rwx ./src/Utils/toh.out", () => { });

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
        }, 20000);

        return resolve("./src/Utils/toh.txt");
    });
});