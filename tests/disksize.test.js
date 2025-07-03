import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("disksize", () => {
    expect(compile("disksize 0x5678")).toEqual(Buffer.from("055678", "hex"));
});