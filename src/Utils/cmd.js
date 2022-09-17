const evalRegex = (regex, str) => {
    if (!(regex instanceof RegExp) || typeof str != "string")
        return;

    return regex.exec(str).groups ?? {};
}

module.exports = {
    evalRegex,
};