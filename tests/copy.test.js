import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("copying data", () => {
    expect(compile("copy *0x1234 ^0x5678 $3")).toEqual(Buffer.from("231234567831", "hex"));
    expect(compile("copy ^0x1234 *0x5678 $5")).toEqual(Buffer.from("231234567850", "hex"));
});