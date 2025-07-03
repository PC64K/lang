import { parseNumber } from "./numbers.js";
import { SPACE_REGEX, TOKEN_REGEX } from "./regex.js";
import { parseRegister } from "./registers.js";

/** @typedef {{ type: "bytes" | "addr" | "section", bytes?: Buffer, name?: string }} Token */

/**
 * @param {string} code Initial lang64K code
 * @returns {Buffer} Compiled bytecode
 */
export function compile(code) {
    const getToken = () => {
        const tok = code.match(TOKEN_REGEX)?.[0];
        code = code.replace(tok, "");
        return tok;
    }
    const removeSpace = () => code = code.replace(SPACE_REGEX, "");

    removeSpace();

    /** @type {Token[]} */
    const json = [];
    while(code !== "") {
        const tok = getToken();
        if(!tok) throw new Error("Couldn't match token!"); // TODO: at which line?
        if(tok === "printsys") {
            removeSpace();
            const char = getToken();
            const reg = parseRegister(char);
            if(reg !== -1) json.push({ type: "bytes", bytes: Buffer.from(`240${reg.toString(16)}`, "hex") });
            else {
                const num = parseNumber(char);
                if(Number.isNaN(num)) throw new Error("Invalid token!");
                json.push({ type: "bytes", bytes: Buffer.from(`1c${num.toString(16).slice(0, 2).padStart(2, "0")}`, "hex") });
            }
        }
        removeSpace();
    }

    return Buffer.concat(json.filter(x => x.type === "bytes").map(x => x.bytes));
}