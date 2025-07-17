import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("invalid instruction", () => {
    expect(() => compile("invalidinstruction")).toThrow();
});
test("invalid arguments", () => {
    expect(() => compile("db ababababab")).toThrow();
    expect(() => compile("goto meow")).toThrow();
});
test("missing arguments", () => {
    expect(() => compile("charset")).toThrow();
    expect(() => compile("set")).toThrow();
});
test("invalid register", () => {
    expect(() => compile("set $z 1")).toThrow();
    expect(() => compile("set $x $y")).toThrow();
    expect(() => compile("printxy $w $v")).toThrow();
});