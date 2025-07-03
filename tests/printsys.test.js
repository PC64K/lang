import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("printsys: constant values", () => {
    expect(compile("printsys 'a'")).toEqual(Buffer.from("1c61", "hex"));
    expect(compile("printsys 0x20")).toEqual(Buffer.from("1c20", "hex"));
});
test("printsys: registers", () => {
    expect(compile("printsys $5")).toEqual(Buffer.from("2405", "hex"));
});