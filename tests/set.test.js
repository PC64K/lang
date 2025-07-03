import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("set: reg = reg", () => {
    expect(compile("set $a $b")).toEqual(Buffer.from("03ba", "hex"));
});
test("set: reg = *addr", () => {
    expect(compile("set $5 *0x1234")).toEqual(Buffer.from("04123451", "hex"));
});