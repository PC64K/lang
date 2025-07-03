import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("db", () => {
    expect(compile("db h\"abcdef01234567\"")).toEqual(Buffer.from("abcdef01234567", "hex"));
    expect(compile("db \"Hello\"")).toEqual(Buffer.from("Hello", "ascii"));
});