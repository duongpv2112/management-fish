import { test, expect } from "vitest";
import { todayInputValue, daysBetween, formatDateOnly } from "@/common/dateInput";

test("todayInputValue có dạng YYYY-MM-DD theo giờ máy", () => {
  const now = new Date();
  const expected = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  expect(todayInputValue()).toBe(expected);
});

test("daysBetween tính theo ngày lịch", () => {
  expect(daysBetween("2026-09-01", "2026-09-27")).toBe(26);
  expect(daysBetween("2026-09-27", "2026-09-27")).toBe(0);
  // Ngày từ API (00:00 UTC)
  expect(daysBetween("2026-09-01T00:00:00.000Z", "2026-09-02T00:00:00.000Z")).toBe(1);
  expect(daysBetween("2026-09-27", "2026-09-01")).toBe(0);
  expect(daysBetween(todayInputValue())).toBe(0);
});

test("formatDateOnly đọc ngày lịch từ API, không lệch múi giờ", () => {
  expect(formatDateOnly("2026-09-01T00:00:00.000Z")).toBe("01/09/2026");
  expect(formatDateOnly(null)).toBe("");
});
