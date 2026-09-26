import { test, expect } from "vitest";
import { parseWeightUtterance } from "@/voice/parseWeightUtterance";

const catalog = {
  fishTypes: [
    { _id: "f1", fishName: "Cá trắm" },
    { _id: "f2", fishName: "Cá trắm đen" },
    { _id: "f3", fishName: "Cá lăng" },
    { _id: "f4", fishName: "Cá mè" },
  ],
  basketTypes: [
    { _id: "b1", basketName: "Giỏ to" },
    { _id: "b2", basketName: "Giỏ nhỏ" },
  ],
};

test.each([
  ["cá trắm giỏ to 25,5 lưu", { fishTypeId: "f1", basketTypeId: "b1", weight: 25.5, command: "save" }],
  ["trắm đen hai lăm", { fishTypeId: "f2", basketTypeId: null, weight: 25, command: null }],
  ["cá lăng ba cân hai lạng", { fishTypeId: "f3", basketTypeId: null, weight: 3.2, command: null }],
  ["giỏ nhỏ", { fishTypeId: null, basketTypeId: "b2", weight: null, command: null }],
  ["34 xong", { fishTypeId: null, basketTypeId: null, weight: 34, command: "save" }],
  ["hủy", { fishTypeId: null, basketTypeId: null, weight: null, command: "cancel" }],
  ["CÁ MÈ   12.5", { fishTypeId: "f4", basketTypeId: null, weight: 12.5, command: null }],
])("%j", (t, expected) => expect(parseWeightUtterance(t, catalog)).toMatchObject(expected));

test("phần không hiểu được trả về trong unrecognized", () => {
  expect(parseWeightUtterance("cá rô 10", catalog)).toMatchObject({
    fishTypeId: null,
    weight: 10,
    unrecognized: "ca ro",
  });
});

test.each([
  ["trắm 25 phẩy 5", 25.5],
  ["trắm 25.5", 25.5],
  ["trắm hai mươi lăm phẩy năm", 25.5],
])("Chrome trả số theo nhiều kiểu: %j", (t, weight) => {
  expect(parseWeightUtterance(t, catalog)).toMatchObject({ fishTypeId: "f1", weight });
});

test("hai tên cá cùng khớp thì lấy tên dài nhất", () => {
  expect(parseWeightUtterance("cá trắm đen 10", catalog).fishTypeId).toBe("f2");
});

test('"lạng" sau số không bị hiểu là "Cá lăng"', () => {
  expect(parseWeightUtterance("trắm ba cân hai lạng", catalog)).toMatchObject({
    fishTypeId: "f1",
    weight: 3.2,
    unrecognized: "",
  });
});

test.each([
  ["25 sai", "cancel"],
  ["làm lại", "cancel"],
  ["ba mươi tư cân lưu", "save"],
])("lệnh cuối câu %j", (t, command) => {
  expect(parseWeightUtterance(t, catalog).command).toBe(command);
});

test("câu rỗng", () => {
  expect(parseWeightUtterance("", catalog)).toEqual({
    fishTypeId: null,
    basketTypeId: null,
    weight: null,
    command: null,
    unrecognized: "",
  });
});
