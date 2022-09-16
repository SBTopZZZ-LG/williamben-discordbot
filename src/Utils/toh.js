const { exec } = require("child_process");
exec("chmod +rwx ./src/Utils/toh.out", () => { });

module.exports = async (n) => new Promise((resolve, reject) => {
    exec(`./src/Utils/toh.out ${n}`, (error, stdout, stderr) => {
        if (error || stderr) {
            return reject(error ?? stderr);
        }

        require("fs").writeFileSync("./src/Utils/toh.txt", stdout);

        return resolve("./src/Utils/toh.txt");
    });
});