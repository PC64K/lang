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
test("set: reg = *$i / ^$j", () => {
    expect(compile("set $7 ^$j")).toEqual(Buffer.from("2c17", "hex"));
    expect(compile("set $7 *$i")).toEqual(Buffer.from("2c07", "hex"));
});
test("set: $i / $j = reg reg", () => {
    expect(compile("set $i $8 $9")).toEqual(Buffer.from("2889", "hex"));
    expect(compile("set $j $9 $8")).toEqual(Buffer.from("2998", "hex"));
});
test("set: $i / $j = addr", () => {
    expect(compile("set $i 0x5000")).toEqual(Buffer.from("265000", "hex"));
    expect(compile("set $j 0x8000")).toEqual(Buffer.from("278000", "hex"));

    expect(compile("[test] set $i test")).toEqual(Buffer.from("260000", "hex"));
});