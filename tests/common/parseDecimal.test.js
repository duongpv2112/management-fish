import { test, expect } from "vitest";
import { common } from "@/common/common";

test.each([
  ["25,5", 25.5],
  ["25.5", 25.5],
  [25.5, 25.5],
  [" 25 ", 25],
  ["", null],
  [null, null],
  [undefined, null],
  ["abc", null],
  ["2,5,1", null],
  ["2.5.1", null],
  ["25,5kg", null],
])("parseDecimal(%j) = %j", (input, expected) => {
  expect(common.parseDecimal(input)).toBe(expected);
});
