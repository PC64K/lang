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
        if(tok === "[") {
            removeSpace();
            const name = getToken();
            removeSpace();
            getToken(); // Closing bracket
            json.push({ type: "section", name });
        } else if(tok === "printsys") {
            removeSpace();
            const char = getToken();
            const reg = parseRegister(char);
            if(reg !== -1) json.push({ type: "bytes", bytes: Buffer.from(`240${reg.toString(16)}`, "hex") });
            else {
                const num = parseNumber(char);
                if(Number.isNaN(num)) throw new Error("Invalid token!");
                json.push({ type: "bytes", bytes: Buffer.from(`1c${num.toString(16).slice(0, 2).padStart(2, "0")}`, "hex") });
            }
        } else if(tok === "db") {
            removeSpace();
            const val = getToken();
            let bytes;
            if(str[0] === "\"") bytes = Buffer.from(JSON.parse(val), "ascii");
            else if(str[0] === "h" && str[1] === "\"") bytes = Buffer.from(val.slice(2, -1), "hex");
            json.push({ type: "bytes", bytes });
        } else if(tok === "goto") {
            removeSpace();
            const addr = getToken();
            const numAddr = parseNumber(addr);
            if(addr === "*") {
                removeSpace();
                const trueAddr = getToken();
                const numAddr = parseNumber(trueAddr);
                if(Number.isNaN(numAddr)) throw new Error("Invalid dereference");
                json.push({ type: "bytes", bytes: Buffer.from([0x01, (numAddr >> 8) & 0xff, numAddr & 0xff]) });
            } else if(!Number.isNaN(numAddr)) json.push({ type: "bytes", bytes: Buffer.from([0x00, (numAddr >> 8) & 0xff, numAddr & 0xff]) });
            else {
                const reg = parseRegister(addr);
                if(reg !== -1) {
                    removeSpace();
                    const reg2 = parseRegister(getToken());
                    if(reg === -1) throw new Error("Invalid register");
                    json.push({ type: "bytes", bytes: Buffer.from([0x02, (reg << 4) | reg2]) });
                } else json.push({ type: "bytes", bytes: Buffer.from("00", "hex") }, { type: "addr", name: addr });
            }
        } else if(tok === "set") {
            removeSpace();
            const to = getToken();
            removeSpace();
            const reg = parseRegister(to);
            if(reg === -1) throw new Error("Invalid target");
            
            const from = getToken();
            const fromReg = parseRegister(from);
            if(fromReg !== -1) json.push({ type: "bytes", bytes: Buffer.from([0x03, (fromReg << 4) | reg]) });
            else if(from === "*") {
                removeSpace();
                const addr = parseNumber(getToken());
                if(Number.isNaN(addr)) throw new Error("Invalid dereference");
                json.push({ type: "bytes", bytes: Buffer.from([0x04, (addr >> 8) & 0xff, addr & 0xff, (reg << 4) | 1]) });
            }
        }
        removeSpace();
    }

    const getSectionAddr = name => {
        let n = 0;
        for(const part of json)
            if(part.type === "section" && part.name === name) return n;
            else if(part.type === "bytes") n += part.bytes.length;
            else if(part.type === "addr") n += 2;
        return -1;
    };

    return Buffer.concat(json
        .map(x => {
            if(x.type === "addr") {
                const addr = getSectionAddr(x.name);
                if(addr === -1) throw new Error("Can't find section: " + x.name);
                return {
                    type: "bytes",
                    bytes: Buffer.from([(addr >> 8) & 0xff, addr & 0xff])
                };
            }
            return x;
        })
        .filter(x => x.type === "bytes")
        .map(x => x.bytes));
}