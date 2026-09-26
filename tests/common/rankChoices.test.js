import { test, expect } from "vitest";
import { rankChoices } from "@/common/rankChoices";

const items = [{ _id: "a" }, { _id: "b" }, { _id: "c" }, { _id: "d" }];

test("xếp theo số lần cân trong phiên, rồi dùng gần đây, rồi thứ tự danh mục", () => {
  expect(
    rankChoices({ items, valueField: "_id", sessionCounts: { c: 3, b: 1 }, recentIds: ["d", "b"] })
  ).toEqual(["c", "b", "d", "a"]);
});

test("không có số lần cân và dùng gần đây → giữ thứ tự danh mục", () => {
  expect(rankChoices({ items, valueField: "_id" })).toEqual(["a", "b", "c", "d"]);
});

test("id trong recentIds không có trong danh mục bị bỏ qua", () => {
  expect(rankChoices({ items, valueField: "_id", recentIds: ["zz", "c"] })).toEqual(["c", "a", "b", "d"]);
});

test("danh mục rỗng → mảng rỗng", () => {
  expect(rankChoices({ items: [], valueField: "_id", sessionCounts: { a: 1 }, recentIds: ["a"] })).toEqual([]);
});

test("cùng số lần cân → loại dùng gần đây hơn đứng trước", () => {
  expect(
    rankChoices({ items, valueField: "_id", sessionCounts: { a: 2, d: 2 }, recentIds: ["d"] })
  ).toEqual(["d", "a", "b", "c"]);
});
