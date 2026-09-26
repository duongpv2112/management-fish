import { test, expect, beforeEach, vi } from "vitest";

vi.mock("@/services/weighSessionAPI", () => ({ default: {} }));

import router from "@/router";
import { setSession, clearSession, getToken } from "@/common/auth";

const future = () => new Date(Date.now() + 3600 * 1000).toISOString();

beforeEach(async () => {
  clearSession();
});

test("chưa đăng nhập vào /danh-muc → chuyển sang /dang-nhap?redirect=/danh-muc", async () => {
  await router.push("/danh-muc");
  expect(router.currentRoute.value.name).toBe("login");
  expect(router.currentRoute.value.query.redirect).toBe("/danh-muc");
});

test("đã đăng nhập thì vào được trang", async () => {
  setSession({ token: "abc", expiresAt: future() });
  await router.push("/danh-muc");
  expect(router.currentRoute.value.name).toBe("catalog");
});

test("token đã quá hạn thì coi như chưa đăng nhập", async () => {
  setSession({ token: "abc", expiresAt: new Date(Date.now() - 1000).toISOString() });
  expect(getToken()).toBeNull();
  await router.push("/");
  expect(router.currentRoute.value.name).toBe("login");
});

test("setSession lưu token vào localStorage khóa token", () => {
  setSession({ token: "abc", expiresAt: future() });
  expect(localStorage.getItem("token")).toBe("abc");
  expect(getToken()).toBe("abc");
  clearSession();
  expect(localStorage.getItem("token")).toBeNull();
});
