import { test, expect } from "vitest";
import { formatMoneyTyping, applyTypingFormat } from "@/common/moneyTyping";

test("VND: thêm dấu . ngăn cách hàng nghìn khi đang gõ", () => {
  expect(formatMoneyTyping("4")).toBe("4");
  expect(formatMoneyTyping("450")).toBe("450");
  expect(formatMoneyTyping("4500")).toBe("4.500");
  expect(formatMoneyTyping("45000")).toBe("45.000");
  expect(formatMoneyTyping("1234567")).toBe("1.234.567");
  // Gõ tiếp vào số đã có dấu → nhóm lại
  expect(formatMoneyTyping("45.0000")).toBe("450.000");
});

test("VND: bỏ ký tự không phải số và số 0 ở đầu; trống → chuỗi rỗng", () => {
  expect(formatMoneyTyping("40.000 đ")).toBe("40.000");
  expect(formatMoneyTyping("abc")).toBe("");
  expect(formatMoneyTyping("")).toBe("");
  expect(formatMoneyTyping("007500")).toBe("7.500");
  expect(formatMoneyTyping("0")).toBe("0");
  expect(formatMoneyTyping("1,5")).toBe("15");
});

test("USD: giữ nguyên chữ đang gõ (định dạng khi rời ô)", () => {
  expect(formatMoneyTyping("2,5", "USD")).toBe("2,5");
  expect(formatMoneyTyping("1250.5", "USD")).toBe("1250.5");
});

// Ô nhập giả: đủ value / selectionStart / setSelectionRange như <input>
const fakeInput = (value, caret = value.length) => ({
  value,
  selectionStart: caret,
  selectionEnd: caret,
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  },
});

test("applyTypingFormat: gõ ở cuối → con trỏ ở cuối", () => {
  const input = fakeInput("45000");
  expect(applyTypingFormat(input, formatMoneyTyping)).toBe("45.000");
  expect(input.value).toBe("45.000");
  expect(input.selectionStart).toBe(6);
});

test("applyTypingFormat: sửa ở giữa → con trỏ đứng sau đúng chữ số vừa gõ", () => {
  // "45.000" → gõ "9" sau "45" thành "459.000"; con trỏ đang sau "9" (vị trí 3 của "459.000")
  const input = fakeInput("459.000", 3);
  expect(applyTypingFormat(input, formatMoneyTyping)).toBe("459.000");
  expect(input.selectionStart).toBe(3);

  // "1.234" → gõ "5" sau "1" thành "15.234" (chữ đang là "15.234"): nhóm lại "15.234", con trỏ sau "5"
  const second = fakeInput("15.234", 2);
  expect(applyTypingFormat(second, formatMoneyTyping)).toBe("15.234");
  expect(second.selectionStart).toBe(2);

  // "999" → gõ "1" ở đầu thành "1999": nhóm "1.999", con trỏ sau "1" (vị trí 1)
  const third = fakeInput("1999", 1);
  expect(applyTypingFormat(third, formatMoneyTyping)).toBe("1.999");
  expect(third.selectionStart).toBe(1);
});

test("applyTypingFormat: xóa lùi qua dấu . vẫn đúng chỗ", () => {
  // "1.234.567" xóa "4" (chữ còn "1.23.567", con trỏ sau "3" = vị trí 4) → "123.567", con trỏ sau "3" = vị trí 3
  const input = fakeInput("1.23.567", 4);
  expect(applyTypingFormat(input, formatMoneyTyping)).toBe("123.567");
  expect(input.selectionStart).toBe(3);
});
