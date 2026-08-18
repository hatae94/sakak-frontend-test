import { describe, expect, it } from "vitest";
import { getMiddleTwoDigits, nthTerm } from "./lookAndSay";

describe("nthTerm", () => {
  it.each([
    [3, "21"],
    [4, "1211"],
    [5, "111221"],
    [6, "312211"],
    [7, "13112221"],
    [8, "1113213211"],
  ])("n=%i -> %i", (n, expected) => {
    expect(nthTerm(n)).toBe(expected);
  });
});

describe("getMiddleTwoDigits", () => {
  it("n=5 -> L5=111221, m=12", () => {
    expect(getMiddleTwoDigits(5)).toBe("12");
  });

  it("n=8 -> L8=1113213211, m=21", () => {
    expect(getMiddleTwoDigits(8)).toBe("21");
  });

  it("n=50 -> L50=..., m=21", () => {
    expect(getMiddleTwoDigits(50)).toBe("21");
  });
});
