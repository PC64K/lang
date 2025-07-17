#!/usr/bin/env node
import { compile, fnameIndicator } from "../src/index.js";
import { parseArgs } from "util";
import fs from "fs";

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
        output: {
            type: "string",
            default: "",
            short: "o"
        },
        format: {
            type: "string",
            default: "binary",
            short: "f"
        }
    }
});

if(positionals.length === 0) {
    console.error("No input!");
    process.exit(1);
}
if(!["binary", "hex", "c"].includes(values.format)) {
    console.error("Invalid format! Must be binary, hex or c.");
    process.exit(1);
}
const code = positionals.map(x => `${fnameIndicator}${x}\n` + fs.readFileSync(x, "utf-8")).join("\n");
const compiled = compile(code);
const out = values.format === "binary"
    ? compiled
    : values.format === "c"
    ? `uint8_t rom[] = { ${Array.from(compiled).map(x => `0x${x.toString(16).padStart(2, "0")}`).join(", ")} };\n`
    : compiled.toString("hex");
if(!values.output) process.stdout.write(out);
else fs.writeFileSync(values.output, out);