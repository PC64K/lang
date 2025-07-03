import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("print sys: constant values", () => {
    expect(compile("print sys 'a'")).toEqual(Buffer.from("1c61", "hex"));
    expect(compile("print sys 0x20")).toEqual(Buffer.from("1c20", "hex"));
});
test("print sys: registers", () => {
    expect(compile("print sys $5")).toEqual(Buffer.from("2405", "hex"));
});
test("print custom: constant values", () => {
    expect(compile("print custom 'a'")).toEqual(Buffer.from("1d61", "hex"));
    expect(compile("print custom 0x20")).toEqual(Buffer.from("1d20", "hex"));
});
test("print custom: registers", () => {
    expect(compile("print custom $5")).toEqual(Buffer.from("2415", "hex"));
});