import { expect, test } from "@jest/globals";
import { compile } from "../src/index.js";

test("addition", () => {
    expect(compile("set $1 10 add $1 1")).toEqual(Buffer.from("06010a061101", "hex"));
    expect(compile("set $1 10 set $2 5 add $1 $2")).toEqual(Buffer.from("06010a0602050712", "hex"));
});
test("subtraction", () => {
    expect(compile("set $1 10 sub $1 1")).toEqual(Buffer.from("06010a062101", "hex"));
    expect(compile("set $1 10 set $2 5 sub $1 $2")).toEqual(Buffer.from("06010a0602050812", "hex"));
});
test("inverse subtraction", () => {
    expect(compile("set $1 10 subi $1 1")).toEqual(Buffer.from("06010a063101", "hex"));
    expect(compile("set $1 10 set $2 5 subi $1 $2")).toEqual(Buffer.from("06010a0602050912", "hex"));
});
test("multiplication", () => {
    expect(compile("set $1 10 mul $1 1")).toEqual(Buffer.from("06010a064101", "hex"));
    expect(compile("set $1 10 set $2 5 mul $1 $2")).toEqual(Buffer.from("06010a0602050a12", "hex"));
});
test("logical or", () => {
    expect(compile("set $1 10 or $1 1")).toEqual(Buffer.from("06010a065101", "hex"));
    expect(compile("set $1 10 set $2 5 or $1 $2")).toEqual(Buffer.from("06010a0602050b12", "hex"));
});
test("logical and", () => {
    expect(compile("set $1 10 and $1 1")).toEqual(Buffer.from("06010a066101", "hex"));
    expect(compile("set $1 10 set $2 5 and $1 $2")).toEqual(Buffer.from("06010a0602050c12", "hex"));
});
test("logical xor", () => {
    expect(compile("set $1 10 xor $1 1")).toEqual(Buffer.from("06010a067101", "hex"));
    expect(compile("set $1 10 set $2 5 xor $1 $2")).toEqual(Buffer.from("06010a0602050d12", "hex"));
});
test("bitwise right shift", () => {
    expect(compile("set $1 10 rshift $1 1")).toEqual(Buffer.from("06010a068101", "hex"));
    expect(compile("set $1 10 set $2 5 rshift $1 $2")).toEqual(Buffer.from("06010a0602050e12", "hex"));
});
test("bitwise left shift", () => {
    expect(compile("set $1 10 lshift $1 1")).toEqual(Buffer.from("06010a069101", "hex"));
    expect(compile("set $1 10 set $2 5 lshift $1 $2")).toEqual(Buffer.from("06010a0602050f12", "hex"));
});