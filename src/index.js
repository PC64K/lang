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
    const nextNewline = () => {
        const index = code.indexOf("\n");
        if(index === -1) return;
        code = code.slice(index + 1);
    }

    removeSpace();

    // Helpers
    const operation = (type06, opcode) => {
        removeSpace();
        const to = parseRegister(getToken());
        if(to === -1) throw new Error("Invalid target!");
        removeSpace();
        const value = getToken();
        const valueReg = parseRegister(value);
        const valueNum = parseNumber(value);
        if(valueReg !== -1) json.push({ type: "bytes", bytes: Buffer.from([opcode, (to << 4) | valueReg]) });
        else if(valueNum !== -1) json.push({ type: "bytes", bytes: Buffer.from([0x06, (type06 << 4) | to, valueNum]) });
        else throw new Error("Invalid value!");
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
        else throw new Error("Invalid comparison argument!");
    }

    /** @type {Token[]} */
    const json = [];
    while(code !== "") {
        const tok = getToken();
        if(!tok) throw new Error("Couldn't match token!"); // TODO: at which line?
        if(tok === ";")
            nextNewline();
        if(tok === "[") {
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
                throw new Error("Invalid print type! Supported: sys system custom");
            const char = getToken();
            const reg = parseRegister(char);
            if(reg !== -1) json.push({ type: "bytes", bytes: Buffer.from(`24${type === "custom" ? 1 : 0}${reg.toString(16)}`, "hex") });
            else {
                const num = parseNumber(char);
                if(Number.isNaN(num)) throw new Error("Invalid token!");
                json.push({ type: "bytes", bytes: Buffer.from([type === "custom" ? 0x1d : 0x1c, num], "hex") });
            }
        } else if(tok === "db") {
            removeSpace();
            const val = getToken();
            let bytes;
            if(val[0] === "\"") bytes = Buffer.from(JSON.parse(val), "ascii");
            else if(val[0] === "h" && val[1] === "\"") bytes = Buffer.from(val.slice(2, -1), "hex");
            else throw new Error("Invalid string! Must be h\"\" or \"\"")
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
            if(reg === -1) {
                if(to === "*" || to === "^") {
                    const addr = parseNumber(getToken());
                    removeSpace();
                    const reg = parseRegister(getToken());
                    if(Number.isNaN(addr)) throw new Error("Invalid dereference!");
                    if(reg === -1) throw new Error("Invalid value!");
                    json.push({ type: "bytes", bytes: Buffer.from([0x04, (addr >> 8) & 0xff, addr & 0xff, (reg << 4) | (to === "*" ? 0 : 2)]) });
                } else throw new Error("Invalid target");
            } else {
                const from = getToken();
                const fromReg = parseRegister(from);
                const fromNumber = parseNumber(from);
                if(fromReg !== -1) json.push({ type: "bytes", bytes: Buffer.from([0x03, (fromReg << 4) | reg]) });
                else if(from === "*" || from === "^") {
                    removeSpace();
                    const addr = parseNumber(getToken());
                    if(Number.isNaN(addr)) throw new Error("Invalid dereference");
                    json.push({ type: "bytes", bytes: Buffer.from([0x04, (addr >> 8) & 0xff, addr & 0xff, (reg << 4) | (from === "*" ? 1 : 3)]) });
                } else if(!Number.isNaN(fromNumber)) json.push({ type: "bytes", bytes: Buffer.from([0x06, 0x00 | reg, fromNumber]) });
            }
        } else if(tok === "disksize") {
            removeSpace();
            const addr = getToken();
            json.push({ type: "bytes", bytes: Buffer.from([0x05, (addr >> 8) & 0xff, addr & 0xff]) });
        } else if(tok === "add")
            operation(0x1, 0x07)
        else if(tok === "sub")
            operation(0x2, 0x08)
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
            if(reg1 === -1 || reg2 === -1) throw new Error("Invalid registers for colors!");
            json.push({ type: "bytes", bytes: Buffer.from([0x20, (reg1 << 4) | reg2]) });
        } else if(tok === "timfreq") { // TODO: a lot of repeating code...
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw new Error("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw new Error("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x00 : 0x10) | reg]) });
        } else if(tok === "timset") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw new Error("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw new Error("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x20 : 0x30) | reg]) });
        } else if(tok === "timget") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw new Error("Invalid timer!");
            removeSpace();
            const reg = parseRegister(getToken());
            if(reg === -1) throw new Error("Invalid register for timer control!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, (timer === "delay" ? 0x50 : 0x60) | reg]) });
        } else if(tok === "timjoin") {
            removeSpace();
            const timer = getToken();
            if(!["delay", "sound"].includes(timer)) throw new Error("Invalid timer!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1b, timer === "delay" ? 0x40 : 0x41]) });
        } else if(tok === "charset") {
            removeSpace();
            const char = parseNumber(getToken());
            if(Number.isNaN(char)) throw new Error("Invalid character!");
            removeSpace();
            const addr = parseNumber(getToken());
            if(Number.isNaN(addr)) throw new Error("Invalid character address!");
            json.push({ type: "bytes", bytes: Buffer.from([0x1e, char, (addr >> 8) & 0xff, addr & 0xff]) });
        } else if(tok === "keygo") {
            removeSpace();
            const charRaw = getToken();
            const charReg = parseRegister(charRaw);
            const char = parseNumber(charRaw);
            if(Number.isNaN(char) && charReg === -1) throw new Error("Invalid character!");
            removeSpace();
            const addr = parseNumber(getToken());
            if(Number.isNaN(addr)) throw new Error("Invalid address!");
            if(charReg === -1)
                json.push({ type: "bytes", bytes: Buffer.from([0x1f, char, (addr >> 8) & 0xff, addr & 0xff]) });
            else
                json.push({ type: "bytes", bytes: Buffer.from([0x25, charReg, (addr >> 8) & 0xff, addr & 0xff]) });
        } else if(tok === "clear")
            json.push({ type: "bytes", bytes: Buffer.from([0x21]) });
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