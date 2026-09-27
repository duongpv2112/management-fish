import { test, expect } from "vitest";
import { todayInputValue, daysBetween, formatDateOnly, parseDateText, maskDateTyping } from "@/common/dateInput";

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

test("parseDateText: ngày/tháng/năm → YYYY-MM-DD", () => {
  expect(parseDateText("27/09/2026")).toBe("2026-09-27");
  expect(parseDateText("1/9/2026")).toBe("2026-09-01");
  expect(parseDateText(" 1-9-2026 ")).toBe("2026-09-01");
  expect(parseDateText("1.9.26")).toBe("2026-09-01");
  expect(parseDateText("27092026")).toBe("2026-09-27");
  expect(parseDateText("29/02/2028")).toBe("2028-02-29");
});

test("parseDateText: trống → chuỗi rỗng; sai → null", () => {
  expect(parseDateText("")).toBe("");
  expect(parseDateText("   ")).toBe("");
  expect(parseDateText("31/02/2026")).toBeNull();
  expect(parseDateText("29/02/2026")).toBeNull();
  expect(parseDateText("00/09/2026")).toBeNull();
  expect(parseDateText("12/13/2026")).toBeNull();
  expect(parseDateText("27/09")).toBeNull();
  expect(parseDateText("27/09/202")).toBeNull();
  expect(parseDateText("abc")).toBeNull();
});

test("maskDateTyping: tự chèn / khi gõ toàn số", () => {
  expect(maskDateTyping("2")).toBe("2");
  expect(maskDateTyping("27")).toBe("27/");
  expect(maskDateTyping("270")).toBe("27/0");
  expect(maskDateTyping("2709")).toBe("27/09/");
  expect(maskDateTyping("27092026")).toBe("27/09/2026");
  expect(maskDateTyping("270920261")).toBe("27/09/2026");
});

test("maskDateTyping: tự gõ dấu phân cách (/ - . khoảng trắng) → đổi thành /", () => {
  expect(maskDateTyping("1/")).toBe("1/");
  expect(maskDateTyping("1/9")).toBe("1/9");
  expect(maskDateTyping("1-9-2026")).toBe("1/9/2026");
  expect(maskDateTyping("1.9.26")).toBe("1/9/26");
  expect(maskDateTyping("27//")).toBe("27/");
  expect(maskDateTyping("27/09/2026/")).toBe("27/09/2026");
});

test("maskDateTyping: đang xóa thì không tự chèn /", () => {
  expect(maskDateTyping("27", { deleting: true })).toBe("27");
  expect(maskDateTyping("27/09", { deleting: true })).toBe("27/09");
});
