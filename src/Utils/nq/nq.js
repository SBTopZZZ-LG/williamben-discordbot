const { exec } = require("child_process");

// Enable permissions to executable to avoid runtime errors
exec("chmod +rwx ./src/Utils/nq/nq.out", () => { });

module.exports = async (n) =>
    new Promise((resolve, reject) => {
        exec(`./src/Utils/nq/nq.out ${n}`, (error, stdout, stderr) => {
            if (error || stderr) {
                return reject(error ?? stderr);
            }

            return resolve(stdout);
        });
    });
