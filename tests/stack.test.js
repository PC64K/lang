import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("functions", () => {
    expect(compile("call 0x1256")).toEqual(Buffer.from("111256", "hex"));
    expect(compile("ret")).toEqual(Buffer.from("10", "hex"));
});
test("stack", () => {
    expect(compile("push 0x5612")).toEqual(Buffer.from("135612", "hex"));
    expect(compile("pop 0x5612")).toEqual(Buffer.from("125612", "hex"));
});