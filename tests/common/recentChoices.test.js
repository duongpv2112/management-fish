import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { getRecent, pushRecent, RECENT_FISH_KEY, RECENT_BASKET_KEY } from "@/common/recentChoices";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("khóa lưu trữ", () => {
  expect(RECENT_FISH_KEY).toBe("recentFishTypes");
  expect(RECENT_BASKET_KEY).toBe("recentBasketTypes");
});

test("mới nhất đứng đầu, chọn lại thì đưa lên đầu, không trùng", () => {
  pushRecent("k", "x");
  pushRecent("k", "y");
  expect(getRecent("k")).toEqual(["y", "x"]);
  expect(pushRecent("k", "x")).toEqual(["x", "y"]);
  expect(getRecent("k")).toEqual(["x", "y"]);
});

test("giữ tối đa 20 id", () => {
  for (let i = 0; i < 25; i++) pushRecent("k", `id${i}`);
  const recent = getRecent("k");
  expect(recent).toHaveLength(20);
  expect(recent[0]).toBe("id24");
});

test("dữ liệu hỏng hoặc không phải mảng → rỗng", () => {
  localStorage.setItem("k", "{");
  expect(getRecent("k")).toEqual([]);
  localStorage.setItem("k", '"abc"');
  expect(getRecent("k")).toEqual([]);
});

test("setItem ném lỗi → pushRecent không ném", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceeded");
  });
  expect(() => pushRecent("k", "x")).not.toThrow();
});
