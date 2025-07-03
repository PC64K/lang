import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("timer: frequency change", () => {
    expect(compile("timfreq delay $5")).toEqual(Buffer.from("1b05", "hex"));
    expect(compile("timfreq sound $5")).toEqual(Buffer.from("1b15", "hex"));
});
test("timer: value change", () => {
    expect(compile("timset delay $5")).toEqual(Buffer.from("1b25", "hex"));
    expect(compile("timset sound $5")).toEqual(Buffer.from("1b35", "hex"));
});
test("timer: value fetch", () => {
    expect(compile("timget delay $5")).toEqual(Buffer.from("1b55", "hex"));
    expect(compile("timget sound $5")).toEqual(Buffer.from("1b65", "hex"));
});
test("timer: join", () => {
    expect(compile("timjoin delay")).toEqual(Buffer.from("1b40", "hex"));
    expect(compile("timjoin sound")).toEqual(Buffer.from("1b41", "hex"));
});