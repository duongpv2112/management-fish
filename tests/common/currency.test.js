import { test, expect } from "vitest";
import { CURRENCIES, formatMoney, formatPriceInput, parseMoney } from "@/common/currency";

test("danh sách loại tiền: VND và USD", () => {
  expect(Object.keys(CURRENCIES)).toEqual(["VND", "USD"]);
  expect(CURRENCIES.VND.symbol).toBe("đ");
  expect(CURRENCIES.USD.symbol).toBe("$");
});

test("formatMoney VND: dấu chấm ngăn cách nghìn, ký hiệu đ phía sau", () => {
  expect(formatMoney(2418750, "VND")).toBe("2.418.750 đ");
  expect(formatMoney(0, "VND")).toBe("0 đ");
  expect(formatMoney(null, "VND")).toBe("0 đ");
});

test("formatMoney USD: $ phía trước, dấu phẩy ngăn cách nghìn, 2 chữ số thập phân", () => {
  expect(formatMoney(1250.5, "USD")).toBe("$1,250.50");
  expect(formatMoney(27, "USD")).toBe("$27.00");
  expect(formatMoney(null, "USD")).toBe("$0.00");
});

test("không truyền loại tiền hoặc loại lạ thì coi là VND", () => {
  expect(formatMoney(40000)).toBe("40.000 đ");
  expect(formatMoney(40000, "XYZ")).toBe("40.000 đ");
});

test("formatPriceInput: chỉ số, không ký hiệu; null → rỗng", () => {
  expect(formatPriceInput(45000, "VND")).toBe("45.000");
  expect(formatPriceInput(1.75, "USD")).toBe("1.75");
  expect(formatPriceInput(1250, "USD")).toBe("1,250.00");
  expect(formatPriceInput(null, "USD")).toBe("");
});

test.each([
  ["40000", 40000],
  ["40.000", 40000],
  ["40.000 đ", 40000],
  ["", null],
  ["  ", null],
])("parseMoney VND %j → %j", (text, expected) => {
  expect(parseMoney(text, "VND")).toBe(expected);
});

test.each([
  ["1.75", 1.75],
  ["$1,250.50", 1250.5],
  ["1,250", 1250],
  ["2,5", 2.5],
  ["2,75", 2.75],
  ["12", 12],
  ["", null],
  ["abc", null],
])("parseMoney USD %j → %j", (text, expected) => {
  expect(parseMoney(text, "USD")).toBe(expected);
});
