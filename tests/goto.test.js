import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("goto: address", () => {
    expect(compile("goto 0x0000")).toEqual(Buffer.from("000000", "hex"));
    expect(compile("goto 0x0123")).toEqual(Buffer.from("000123", "hex"));
});
test("goto: address in ram", () => {
    expect(compile("goto *0x0000")).toEqual(Buffer.from("010000", "hex"));
    expect(compile("goto *0x0123")).toEqual(Buffer.from("010123", "hex"));
});
test("goto: registers", () => {
    expect(compile("goto $5 $6")).toEqual(Buffer.from("0256", "hex"));
});
test("goto: section", () => {
    expect(compile("[start] goto start")).toEqual(Buffer.from("000000", "hex"));
    expect(compile("goto test [test] goto 0x0000")).toEqual(Buffer.from("000003000000", "hex"));
});
test("goto: section with set address", () => {
    expect(compile("[start] goto loop [loop:0x0010] goto loop")).toEqual(Buffer.from("00001000000000000000000000000000000010", "hex"));
});
test("goto: loops", () => {
    expect(compile("[start] print sys 'a' goto start")).toEqual(Buffer.from("1c61000000", "hex"));
});