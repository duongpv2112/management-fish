import { test, expect } from "vitest";
import { computeDropdownPlacement } from "@/common/dropdownPlacement";

const viewport = { width: 400, height: 800 };
const trigger = (left, top, width = 140, height = 40) => ({ left, right: left + width, top, bottom: top + height });

test("đủ chỗ → căn phải và mở xuống như cũ", () => {
  expect(
    computeDropdownPlacement({ trigger: trigger(200, 100), list: { width: 200, height: 200 }, viewport })
  ).toEqual({ horizontal: "end", vertical: "down", maxWidth: null, maxHeight: null });
});

test("bên trái không đủ chỗ → căn trái (danh sách mở sang phải)", () => {
  // Ô sát mép trái: căn phải thì danh sách tràn ra ngoài màn hình bên trái
  const result = computeDropdownPlacement({ trigger: trigger(12, 100), list: { width: 260, height: 100 }, viewport });
  expect(result.horizontal).toBe("start");
  expect(result.maxWidth).toBeNull();
});

test("bên phải không đủ chỗ → căn phải (danh sách mở sang trái)", () => {
  const result = computeDropdownPlacement({ trigger: trigger(250, 100), list: { width: 300, height: 100 }, viewport });
  expect(result.horizontal).toBe("end");
});

test("hai bên đều thiếu → chọn bên rộng hơn và giới hạn chiều rộng", () => {
  // Căn trái còn 400 − 8 − 100 = 292px, căn phải còn 240 − 8 = 232px
  const result = computeDropdownPlacement({ trigger: trigger(100, 100), list: { width: 500, height: 100 }, viewport });
  expect(result).toMatchObject({ horizontal: "start", maxWidth: 292 });
  // Ô lệch phải: căn phải còn 390 − 8 = 382px, căn trái còn 400 − 8 − 250 = 142px
  expect(
    computeDropdownPlacement({ trigger: trigger(250, 100), list: { width: 500, height: 100 }, viewport })
  ).toMatchObject({ horizontal: "end", maxWidth: 382 });
});

test("phía dưới không đủ chỗ → mở lên trên", () => {
  // Dưới còn 800 − 8 − 740 − 4 = 48px, trên còn 700 − 4 − 8 = 688px
  const result = computeDropdownPlacement({ trigger: trigger(100, 700), list: { width: 100, height: 200 }, viewport });
  expect(result).toMatchObject({ vertical: "up", maxHeight: null });
});

test("trên dưới đều thiếu → chọn phía rộng hơn và giới hạn chiều cao", () => {
  // Dưới: 800 − 8 − 440 − 4 = 348px; trên: 400 − 4 − 8 = 388px
  expect(
    computeDropdownPlacement({ trigger: trigger(100, 400), list: { width: 100, height: 900 }, viewport })
  ).toMatchObject({ vertical: "up", maxHeight: 388 });
  // Ô ở trên cao: dưới 800 − 8 − 140 − 4 = 648px
  expect(
    computeDropdownPlacement({ trigger: trigger(100, 100), list: { width: 100, height: 900 }, viewport })
  ).toMatchObject({ vertical: "down", maxHeight: 648 });
});

test("chưa đo được kích thước (0) → giữ mặc định", () => {
  expect(
    computeDropdownPlacement({ trigger: trigger(0, 0, 0, 0), list: { width: 0, height: 0 }, viewport })
  ).toEqual({ horizontal: "end", vertical: "down", maxWidth: null, maxHeight: null });
});
