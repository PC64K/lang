/**
 * @param {string} str Number as a string
 */
export const parseNumber = str => {
    if(str.startsWith("0x"))
        return parseInt(str.slice(2), 16);
    if(str.startsWith("0b"))
        return parseInt(str.slice(2), 2);
    if(str.startsWith("0o"))
        return parseInt(str.slice(2), 8);
    if(str.startsWith("'"))
        return JSON.parse(str.replace(/^'/, "\"").replace(/'$/, "\"")).charCodeAt(0);
    return parseInt(str);
};