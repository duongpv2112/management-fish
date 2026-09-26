import { test, expect, vi, describe, beforeEach } from "vitest";

const routerMock = vi.hoisted(() => ({ push: vi.fn(), currentRoute: { value: { name: "weigh", fullPath: "/" } } }));
vi.mock("@/router", () => ({ default: routerMock }));

import { handleResponse, handleResponseError } from "@/services/baseAPI";

beforeEach(() => {
  routerMock.push.mockReset();
  localStorage.clear();
});

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

describe("401", () => {
  test("token hết hạn → xóa token, chuyển sang đăng nhập kèm redirect và expired=1", async () => {
    localStorage.setItem("token", "cu");
    localStorage.setItem("tokenExpiresAt", new Date(Date.now() + 86400000).toISOString());
    routerMock.currentRoute.value = { name: "catalog", fullPath: "/danh-muc" };

    await expect(
      handleResponseError({
        config: { url: "/fish-types/getFishTypes" },
        response: { status: 401, data: { message: "Vui lòng đăng nhập lại!" } },
      })
    ).rejects.toThrow("Vui lòng đăng nhập lại!");

    expect(localStorage.getItem("token")).toBeNull();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: "login",
      query: { redirect: "/danh-muc", expired: "1" },
    });
  });

  test("401 của chính API đăng nhập (sai mật khẩu) → không chuyển trang, giữ message", async () => {
    await expect(
      handleResponseError({
        config: { url: "/auth/login" },
        response: { status: 401, data: { message: "Mật khẩu không đúng!" } },
      })
    ).rejects.toThrow("Mật khẩu không đúng!");
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  test("đang ở trang đăng nhập thì không chuyển trang lần nữa", async () => {
    routerMock.currentRoute.value = { name: "login", fullPath: "/dang-nhap" };
    await expect(
      handleResponseError({ config: { url: "/x" }, response: { status: 401, data: {} } })
    ).rejects.toBeInstanceOf(Error);
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
