import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("equals", () => {
    expect(compile("eqgo $1 5 0x1234")).toEqual(Buffer.from("1a10051234", "hex"));
    expect(compile("eqgo $1 $8 0x1234")).toEqual(Buffer.from("14181234", "hex"));
});
test("not equals", () => {
    expect(compile("neqgo $1 5 0x1234")).toEqual(Buffer.from("1a11051234", "hex"));
    expect(compile("neqgo $1 $8 0x1234")).toEqual(Buffer.from("15181234", "hex"));
});
test("more than", () => {
    expect(compile("morego $1 5 0x1234")).toEqual(Buffer.from("1a12051234", "hex"));
    expect(compile("morego $1 $8 0x1234")).toEqual(Buffer.from("16181234", "hex"));
});
test("less than", () => {
    expect(compile("lessgo $1 5 0x1234")).toEqual(Buffer.from("1a13051234", "hex"));
    expect(compile("lessgo $1 $8 0x1234")).toEqual(Buffer.from("17181234", "hex"));
});
test("more than or equal", () => {
    expect(compile("moreeqgo $1 5 0x1234")).toEqual(Buffer.from("1a14051234", "hex"));
    expect(compile("moreeqgo $1 $8 0x1234")).toEqual(Buffer.from("18181234", "hex"));
});
test("less than or equal", () => {
    expect(compile("lesseqgo $1 5 0x1234")).toEqual(Buffer.from("1a15051234", "hex"));
    expect(compile("lesseqgo $1 $8 0x1234")).toEqual(Buffer.from("19181234", "hex"));
});

test("keyboard", () => {
    expect(compile("keygo 'a' 0x1234")).toEqual(Buffer.from("1f611234", "hex"));
    expect(compile("keygo 'A' 0x5678")).toEqual(Buffer.from("1f415678", "hex"));
});