import { test, expect } from "vitest";
import { normalizeVi, parseVietnameseNumber, findNumberSpan } from "@/voice/vietnameseNumber";

test.each([
  ["25", 25], ["25,5", 25.5], ["25.5", 25.5], ["25 phẩy 5", 25.5],
  ["bảy", 7], ["mười", 10], ["mười lăm", 15], ["hai mươi", 20],
  ["hai mươi lăm", 25], ["hai mươi mốt", 21], ["ba mươi tư", 34], ["hai lăm", 25],
  ["hai mươi lăm phẩy năm", 25.5], ["không phẩy năm", 0.5], ["mười hai chấm hai lăm", 12.25],
  ["hai lăm rưỡi", 25.5], ["mười cân rưỡi", 10.5], ["3 cân 2 lạng", 3.2], ["ba ký hai", 3.2],
  ["một trăm linh năm", 105], ["một trăm lẻ năm", 105], ["một trăm hai mươi", 120], ["trăm hai", 120],
  ["hai mươi lăm cân", 25], ["25kg", 25], ["không có số nào", null], ["", null],
])("parseVietnameseNumber(%j) = %j", (input, expected) => {
  expect(parseVietnameseNumber(input)).toBe(expected);
});

test.each([
  ["Cá Trắm", "ca tram"],
  ["  Đặng   Ánh ", "dang anh"],
  ["25,5", "25.5"],
  ["25kg", "25 kg"],
  ["lưu.", "luu"],
  ["trắm, giỏ to", "tram gio to"],
])("normalizeVi(%j) = %j", (input, expected) => {
  expect(normalizeVi(input)).toBe(expected);
});

test("findNumberSpan trả vị trí phần số trong câu", () => {
  const tokens = normalizeVi("gio to hai muoi lam can nua").split(" ");
  expect(findNumberSpan(tokens)).toEqual({ start: 2, end: 6, value: 25 });
});

test("findNumberSpan không có số → null", () => {
  expect(findNumberSpan(["ca", "tram"])).toBeNull();
});
