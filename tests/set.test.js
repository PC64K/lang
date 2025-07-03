import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("set: reg = reg", () => {
    expect(compile("set $a $b")).toEqual(Buffer.from("03ba", "hex"));
});
test("set: reg = *addr", () => {
    expect(compile("set $5 *0x1234")).toEqual(Buffer.from("04123451", "hex"));
});
test("set: reg = number", () => {
    expect(compile("set $0 0x55")).toEqual(Buffer.from("060055", "hex"));
});
test("set: *addr = reg", () => {
    expect(compile("set *0x1234 $9")).toEqual(Buffer.from("04123490", "hex"));
});
test("set: reg = ^disk", () => {
    expect(compile("set $7 ^0x1234")).toEqual(Buffer.from("04123473", "hex"));
});
test("set: ^disk = reg", () => {
    expect(compile("set ^0x1234 $8")).toEqual(Buffer.from("04123482", "hex"));
});