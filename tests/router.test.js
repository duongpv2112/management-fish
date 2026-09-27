import { test, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/weighSessionAPI", () => ({
  default: {
    getWeighSessions: vi.fn(async () => ({ data: [] })),
    getSessionSummary: vi.fn(async () => ({ data: null })),
  },
}));
vi.mock("@/services/fishTypeAPI", () => ({
  default: {
    getDataFish: vi.fn(async () => ({ data: [] })),
    getFishTypes: vi.fn(async () => ({ data: [] })),
  },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: { getBasketTypes: vi.fn(async () => ({ data: [] })) },
}));

import router from "@/router";
import { setSession } from "@/common/auth";
import App from "@/App.vue";

test("điều hướng giữa trang Cân cá và Danh mục", async () => {
  setSession({ token: "t", expiresAt: new Date(Date.now() + 3600000).toISOString() });
  router.push("/danh-muc");
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  expect(wrapper.find("h1.catalog-title").text()).toBe("Danh mục");

  await router.push("/");
  await flushPromises();
  expect(wrapper.text()).toContain("Lưu số cân");
  expect(wrapper.find(".management-fish__heading").exists()).toBe(false);

  const links = wrapper.findAll("nav a");
  expect(links.map((a) => a.text())).toEqual(["Cân cá", "Vụ nuôi", "Chi phí", "Báo cáo", "Danh mục", "Nhật ký"]);
});

test("nút Đăng xuất xóa token và về trang đăng nhập; trang đăng nhập không hiện thanh điều hướng", async () => {
  setSession({ token: "t", expiresAt: new Date(Date.now() + 3600000).toISOString() });
  await router.push("/");
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  await wrapper.find(".app-nav__logout").trigger("click");
  await flushPromises();
  expect(localStorage.getItem("token")).toBeNull();
  expect(router.currentRoute.value.name).toBe("login");
  expect(wrapper.find("nav").exists()).toBe(false);
});

test("router dùng hash history", () => {
  expect(router.options.history.base).toContain("#");
});
