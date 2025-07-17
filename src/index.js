import { parseNumber } from "./numbers.js";
import { SPACE_REGEX, TOKEN_REGEX } from "./regex.js";
import { parseRegister } from "./registers.js";

/** @typedef {{ type: "bytes" | "addr" | "section", bytes?: Buffer, name?: string }} Token */

export const fnameIndicator = `;_compiler_fname=`;

/**
 * @param {string} code Initial lang64K code
 * @returns {Buffer} Compiled bytecode
 */
export function compile(code) {
    const original = code;
    let index = 0;
    const makeError = err => {
        let fname = "input";
        if(err instanceof Error) err = err.message;
        const split = original.slice(0, index).split("\n").filter(x => {
            const isFilename = x.startsWith(fnameIndicator);
            if(isFilename) {
                fname = x.replace(fnameIndicator, "");
                return false;
            }
            return true;
        });
        const line = split.length;
        const char = split.at(-1).length + 1;
        throw new Error(`${err}\nat ${fname}:${line}:${char}`);
    }
    const getToken = () => {
        let lengthBefore = code.length;
        const tok = code.match(TOKEN_REGEX)?.[0];
        code = code.replace(tok, "");
        index += lengthBefore - code.length;
        return tok;
    }
    const removeSpace = () => {
        let lengthBefore = code.length;
        code = code.replace(SPACE_REGEX, "");
        index += lengthBefore - code.length;
    }
    const nextNewline = () => {
        let lengthBefore = code.length;
        const idx = code.indexOf("\n");
        if(idx === -1) return;
        code = code.slice(idx + 1);
        index += lengthBefore - code.length;
    }

    removeSpace();

    // Helpers
    const operation = (type06, opcode, allowPointers = false) => {
        removeSpace();
        const toRaw = getToken();
        removeSpace();
        if(["$i", "$j"].includes(toRaw) && allowPointers !== false) {
            const reg = parseRegister(getToken());
            if(reg === -1) throw makeError("You can only do operations with Ri and Rj with registers!");
            json.push({ type: "bytes", bytes: Buffer.from([allowPointers, (toRaw === "$i" ? 0x00 : 0x10) | reg]) });
            return;
        }
        const to = parseRegister(toRaw);
        if(to === -1) throw makeError("Invalid target!");
        const value = getToken();
        const valueReg = parseRegister(value);
        const valueNum = parseNumber(value);
        if(valueReg !== -1) json.push({ type: "bytes", bytes: Buffer.from([opcode, (to << 4) | valueReg]) });
        else if(valueNum !== -1) json.push({ type: "bytes", bytes: Buffer.from([0x06, (type06 << 4) | to, valueNum]) });
        else throw makeError("Invalid value!");
    }
    const comparison = (type1a, opcode) => {
        removeSpace();
        const cmp1 = parseRegister(getToken());
        removeSpace();
        const cmp2Raw = getToken();
        const cmp2Reg = parseRegister(cmp2Raw);
        const cmp2Num = parseNumber(cmp2Raw);
        removeSpace();
        const goto = getToken();
        const addr = parseNumber(goto);
        const part2 = Number.isNaN(addr) ? { type: "addr", name: goto } : { type: "bytes", bytes: Buffer.from([(addr >> 8) & 0xff, addr & 0xff]) };
        if(cmp2Reg !== -1) json.push({ type: "bytes", bytes: Buffer.from([opcode, (cmp1 << 4) | cmp2Reg]) }, part2);
        else if(!Number.isNaN(cmp2Num)) json.push({ type: "bytes", bytes: Buffer.from([0x1a, (cmp1 << 4) | type1a, cmp2Num]) }, part2);
        else throw makeError("Invalid comparison argument!");
    }

    /** @type {Token[]} */
    const json = [];
    while(code !== "") {
        const tok = getToken();
        if(!tok) throw makeError("Couldn't match token!");
        if(tok === ";")
            nextNewline();
        else if(tok === "[") {
            removeSpace();
            const name = getToken();
            removeSpace();
            getToken(); // Closing bracket
            json.push({ type: "section", name });
        } else if(tok === "print") {
            removeSpace();
            const type = getToken();
            removeSpace();
            if(!["sys", "system", "custom"].includes(type))
                throw makeError("Invalid print type! Supported: sys system custom");
            const char = getToken();
            const reg = parseRegister(char);
            if(reg !== -1) json.push({ type: "bytes", bytes: Buffer.from(`24${type === "custom" ? 1 : 0}${reg.toString(16)}`, "hex") });
            else {
                const num = parseNumber(char);
                if(Number.isNaN(num)) throw makeError("Invalid token!");
                json.push({ type: "bytes", bytes: Buffer.from([type === "custom" ? 0x1d : 0x1c, num], "hex") });
            }
        } else if(tok === "db") {
            removeSpace();
            const val = getToken();
            let bytes;
            if(val[0] === "\"") bytes = Buffer.from(JSON.parse(val), "ascii");
            else if(val[0] === "h" && val[1] === "\"") bytes = Buffer.from(val.slice(2, -1), "hex");
            else throw makeError("Invalid string! Must be h\"\" or \"\"")
            json.push({ type: "bytes", bytes });
        } else if(tok === "goto") {
            removeSpace();
            const addr = getToken();
            const numAddr = parseNumber(addr);
            if(addr === "*") {
                removeSpace();
                const trueAddr = getToken();
                const numAddr = parseNumber(trueAddr);
                if(Number.isNaN(numAddr)) throw makeError("Invalid dereference");
                json.push({ type: "bytes", bytes: Buffer.from([0x01, (numAddr >> 8) & 0xff, numAddr & 0xff]) });
            } else if(!Number.isNaN(numAddr)) json.push({ type: "bytes", bytes: Buffer.from([0x00, (numAddr >> 8) & 0xff, numAddr & 0xff]) });
            else {
                const reg = parseRegister(addr);
                if(reg !== -1) {
                    removeSpace();
                    const reg2 = parseRegister(getToken());
                    if(reg === -1) throw makeError("Invalid register");
                    json.push({ type: "bytes", bytes: Buffer.from([0x02, (reg << 4) | reg2]) });
                } else json.push({ type: "bytes", bytes: Buffer.from("00", "hex") }, { type: "addr", name: addr });
            }
        } else if(tok === "set") {
            removeSpace();
            const to = getToken();
            removeSpace();
            const reg = parseRegister(to);
            if(reg === -1) {
                if(["$i", "$j"].includes(to.toLowerCase())) {
                    const val = getToken();
                    const addr = parseNumber(val);
                    if(val[0] === "$") {
                        const reg1 = parseRegister(val);
                        removeSpace();
                        const reg2 = parseRegister(getToken());
                        if(reg1 === -1 || reg2 === -1) throw makeError("Invalid registers!");
                        json.push({ type: "bytes", bytes: Buffer.from([to.toLowerCase() === "$i" ? 0x28 : 0x29, (reg1 << 4) | reg2]) });
                    } else if(Number.isNaN(addr)) {
                        json.push({ type: "bytes", bytes: Buffer.from([to.toLowerCase() === "$i" ? 0x26 : 0x27]) }, { type: "addr", name: val });
                    } else
                        json.push({ type: "bytes", bytes: Buffer.from([to.toLowerCase() === "$i" ? 0x26 : 0x27, (addr >> 8) & 0xff, addr & 0xff]) });
                } else if(to === "*" || to === "^") {
                    const addrRaw = getToken();
                    const addr = parseNumber(addrRaw);
                    removeSpace();
                    const reg = parseRegister(getToken());
                    if(["$i", "$j"].includes(addrRaw.toLowerCase())) {
                        json.push({ type: "bytes", bytes: Buffer.from([0x2c, (addrRaw.toLowerCase() === "$i" ? 0x20 : 0x30) | reg]) })
                    } else {
                        if(Number.isNaN(addr)) throw makeError("Invalid dereference!");
                        if(reg === -1) throw makeError("Invalid value!");
                        json.push({ type: "bytes", bytes: Buffer.from([0x04, (addr >> 8) & 0xff, addr & 0xff, (reg << 4) | (to === "*" ? 0 : 2)]) });
                    }
                } else throw makeError("Invalid target");
            } else {
                const from = getToken();
                const fromReg = parseRegister(from);
                const fromNumber = parseNumber(from);
                if(fromReg !== -1) json.push({ type: "bytes", bytes: Buffer.from([0x03, (fromReg << 4) | reg]) });
                else if(from === "*" || from === "^") {
                    removeSpace();
                    const addrRaw = getToken();
                    if(["$i", "$j"].includes(addrRaw.toLowerCase())) {
                        json.push({ type: "bytes", bytes: Buffer.from([0x2c, (addrRaw.toLowerCase() === "$i" ? 0x00 : 0x10) | reg]) });
                    } else {
                        const addr = parseNumber(addrRaw);
                        if(Number.isNaN(addr)) throw makeError("Invalid dereference");
                        json.push({ type: "bytes", bytes: Buffer.from([0x04, (addr >> 8) & 0xff, addr & 0xff, (reg << 4) | (from === "*" ? 1 : 3)]) });
                    }
                } else if(!Number.isNaN(fromNumber)) json.push({ type: "bytes", bytes: Buffer.from([0x06, 0x00 | reg, fromNumber]) });
            }
        } else if(tok === "disksize") {
            removeSpace();
            const addr = getToken();
            json.push({ type: "bytes", bytes: Buffer.from([0x05, (addr >> 8) & 0xff, addr & 0xff]) });
        } else if(tok === "add")
            operation(0x1, 0x07, 0x2a)
        else if(tok === "sub")
            operation(0x2, 0x08, 0x2b)
        else if(tok === "subi")
            operation(0x3, 0x09)
        else if(tok === "mul")
            operation(0x4, 0x0a)
        else if(tok === "or")
            operation(0x5, 0x0b)
        else if(tok === "and")
            operation(0x6, 0x0c)
        else if(tok === "xor")
            operation(0x7, 0x0d)
        else if(tok === "rshift")
            operation(0x8, 0x0e)
        else if(tok === "lshift")
            operation(0x9, 0x0f)
        else if(tok === "ret")
            json.push({ type: "bytes", bytes: Buffer.from([0x10]) });
        else if(tok === "call") {
            removeSpace();
            const name = getToken();
            const addr = parseNumber(name);
            if(!Number.isNaN(addr)) json.push({ type: "bytes", bytes: Buffer.from([0x11, (addr >> 8) & 0xff, addr & 0xff]) });
            else json.push({ type: "bytes", bytes: Buffer.from([0x11]) }, { type: "addr", name });
        } else if(tok === "pop") { // TODO: parseAddr
            removeSpace();
            const name = getToken();
            const addr = parseNumber(name);
            if(!Number.isNaN(addr)) json.push({ type: "bytes", bytes: Buffer.from([0x12, (addr >> 8) & 0xff, addr & 0xff]) });
            else json.push({ type: "bytes", bytes: Buffer.from([0x12]) }, { type: "addr", name });
        } else if(tok === "push") {
            removeSpace();
            const name = getToken();
            const addr = parseNumber(name);
            if(!Number.isNaN(addr)) json.push({ type: "bytes", bytes: Buffer.from([0x13, (addr >> 8) & 0xff, addr & 0xff]) });
            else json.push({ type: "bytes", bytes: Buffer.from([0x13]) }, { type: "addr", name });
        } else if(tok === "eqgo")
            comparison(0x0, 0x14);
        else if(tok === "neqgo")
            comparison(0x1, 0x15);
        else if(tok === "morego")
            comparison(0x2, 0x16);
        else if(tok === "lessgo")
            comparison(0x3, 0x17);
        else if(tok === "moreeqgo")
            comparison(0x4, 0x18);
        else if(tok === "lesseqgo")
            comparison(0x5, 0x19);
        else if(tok === "color") {
            removeSpace();
            const reg1 = parseRegister(getToken());
            removeSpace();
            const reg2 = parseRegister(getToken());
            if(reg1 === -1 || reg2 === -1) throw makeError("Invalid registers for colors!");
            json.push({ type: "bytes", bytes: Buffer.from([0x20, (reg1 << 4) | reg2]) });
        } else if(tok === "timfreq") { // TODO: a lot of repeating code...
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw makeError("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw makeError("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x00 : 0x10) | reg]) });
        } else if(tok === "timset") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw makeError("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw makeError("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x20 : 0x30) | reg]) });
        } else if(tok === "timget") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw makeError("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw makeError("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x50 : 0x60) | reg]) });
        } else if(tok === "timjoin") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw makeError("Invalid timer!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, timer === "delay" ? 0x40 : 0x41]) });
        } else if(tok === "charset") {
            removeSpace();
            const char = parseNumber(getToken());
            if(Number.isNaN(char)) throw makeError("Invalid character!");
            removeSpace();
            const addr = parseNumber(getToken());
            if(Number.isNaN(addr)) throw makeError("Invalid character address!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1e, char, (addr >> 8) & 0xff, addr & 0xff]) });
        } else if(tok === "keygo") {
            removeSpace();
            const charRaw = getToken();
            const charReg = parseRegister(charRaw);
            const char = parseNumber(charRaw);
            if(Number.isNaN(char) && charReg === -1) throw makeError("Invalid character!");
            removeSpace();
            const addrRaw = getToken();
            const addr = parseNumber(addrRaw);
            const addrPart = Number.isNaN(addr) ? { type: "addr", name: addrRaw } : { type: "bytes", bytes: Buffer.from([(addr >> 8) & 0xff, addr & 0xff]) };
            if(charReg === -1)
                json.push({ type: "bytes", bytes: Buffer.from([0x1f, char]) }, addrPart);
            else
                json.push({ type: "bytes", bytes: Buffer.from([0x25, charReg]) }, addrPart);
        } else if(tok === "clear")
            json.push({ type: "bytes", bytes: Buffer.from([0x21]) });
        else if(tok === "printxy") {
            removeSpace();
            const reg1 = parseRegister(getToken());
            removeSpace();
            const reg2 = parseRegister(getToken());
            if(reg1 === -1 || reg2 === -1) throw makeError("Invalid registers!");
            json.push({ type: "bytes", bytes: Buffer.from([0x22, (reg1 << 4) | reg2]) });
        } else if(tok === "copy") {
            removeSpace();
            const allowedTypes = ["*", "^"];
            const type1 = getToken();
            if(!allowedTypes.includes(type1)) throw makeError("Invalid type!");
            removeSpace();
            const addr1 = parseNumber(getToken());
            removeSpace();
            const type2 = getToken();
            if(!allowedTypes.includes(type2)) throw makeError("Invalid type!");
            if(type1 === type2) throw makeError("Same types aren't supported for copy (for now)!");
            const addr2 = parseNumber(getToken());
            if(Number.isNaN(addr1) || Number.isNaN(addr2)) throw makeError("Invalid addresses!");
            removeSpace();

            const reg = parseRegister(getToken());
            if(reg === -1) throw makeError("Invalid register!");
            json.push({ type: "bytes", bytes: Buffer.from([0x23, (addr1 >> 8) & 0xff, addr1 & 0xff, (addr2 >> 8) & 0xff, addr2 & 0xff, (reg << 4) | (type1 === "^" ? 0 : 1)]) });
        } else {
            throw makeError("Unknown instruction!");
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
                if(addr === -1) throw makeError("Can't find section: " + x.name);
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