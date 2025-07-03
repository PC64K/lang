import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("colors", () => {
    expect(compile("color $5 $9")).toEqual(Buffer.from("2059", "hex"));
});