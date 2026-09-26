import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/authAPI", () => ({ default: { login: vi.fn() } }));

import AuthAPI from "@/services/authAPI";
import router from "@/router";
import { clearSession, getToken } from "@/common/auth";
import LoginView from "@/views/Login/LoginView.vue";

const mountLogin = async (path) => {
  await router.push(path);
  const wrapper = mount(LoginView, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  clearSession();
  vi.mocked(AuthAPI.login).mockReset();
});

test("đăng nhập đúng → lưu token và quay lại trang cũ", async () => {
  vi.mocked(AuthAPI.login).mockResolvedValue({
    success: true,
    data: { token: "tok", expiresAt: new Date(Date.now() + 86400000).toISOString() },
  });
  const wrapper = await mountLogin("/dang-nhap?redirect=/danh-muc");
  await wrapper.find("#loginPassword").setValue("mat-khau");
  await wrapper.find("form").trigger("submit");
  await flushPromises();

  expect(AuthAPI.login).toHaveBeenCalledWith("mat-khau");
  expect(getToken()).toBe("tok");
  expect(router.currentRoute.value.fullPath).toBe("/danh-muc");
});

test("không có redirect → về trang Cân cá", async () => {
  vi.mocked(AuthAPI.login).mockResolvedValue({
    success: true,
    data: { token: "tok", expiresAt: new Date(Date.now() + 86400000).toISOString() },
  });
  const wrapper = await mountLogin("/dang-nhap");
  await wrapper.find("#loginPassword").setValue("mat-khau");
  await wrapper.find("form").trigger("submit");
  await flushPromises();
  expect(router.currentRoute.value.name).toBe("weigh");
});

test("sai mật khẩu → hiện message server, không lưu token", async () => {
  vi.mocked(AuthAPI.login).mockRejectedValue(new Error("Mật khẩu không đúng!"));
  const wrapper = await mountLogin("/dang-nhap");
  await wrapper.find("#loginPassword").setValue("sai");
  await wrapper.find("form").trigger("submit");
  await flushPromises();

  expect(wrapper.find(".error-message").text()).toBe("Mật khẩu không đúng!");
  expect(getToken()).toBeNull();
  expect(router.currentRoute.value.name).toBe("login");
});

test("mật khẩu rỗng → không gọi API", async () => {
  const wrapper = await mountLogin("/dang-nhap");
  await wrapper.find("form").trigger("submit");
  expect(AuthAPI.login).not.toHaveBeenCalled();
  expect(wrapper.find(".error-message").text()).toBe("Vui lòng nhập mật khẩu.");
});

test("expired=1 → báo phiên đăng nhập đã hết hạn", async () => {
  const wrapper = await mountLogin("/dang-nhap?expired=1&redirect=/");
  expect(wrapper.text()).toContain("Phiên đăng nhập đã hết hạn");
});
