const { exec } = require("child_process");

module.exports = async (image) =>
    new Promise((resolve, reject) => {
        exec(
            `python3 ./src/Utils/manzae/manzae.py ${image}`,
            (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                if (stderr) {
                    return resolve(false);
                }

                return resolve(true);
            }
        );
    });
