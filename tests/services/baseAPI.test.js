import { test, expect } from "vitest";
import { handleResponse, handleResponseError } from "@/services/baseAPI";

test("success:false bị coi là lỗi", () => {
  expect(() =>
    handleResponse({ data: { success: false, message: "Thêm cân cá không thành công!" } })
  ).toThrow("Thêm cân cá không thành công!");
});

test("success:false không có message dùng câu mặc định", () => {
  expect(() => handleResponse({ data: { success: false } })).toThrow("Có lỗi xảy ra");
});

test("success:true đi qua", () => {
  const r = { data: { success: true, data: [] } };
  expect(handleResponse(r)).toBe(r);
});

test("lỗi mạng không crash", async () => {
  await expect(handleResponseError({ message: "Network Error" })).rejects.toThrow(
    "Không thể kết nối đến máy chủ"
  );
});

test("lỗi HTTP có response vẫn trả Error", async () => {
  await expect(
    handleResponseError({ message: "Request failed", response: { status: 500, data: {} } })
  ).rejects.toBeInstanceOf(Error);
});
