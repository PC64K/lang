/**
 * @param {string} str Register as a string
 */
export const parseRegister = str => {
    if(!str.startsWith("r") && !str.startsWith("R")) return -1;
    if(str.length !== 2) return -1;
    const no = parseInt(str[1], 16);
    return Number.isNaN(no) ? -1 : no;
}