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
import App from "@/App.vue";

test("điều hướng giữa trang Cân cá và Danh mục", async () => {
  router.push("/danh-muc");
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  expect(wrapper.find("h1.catalog-title").text()).toBe("Danh mục");

  await router.push("/");
  await flushPromises();
  expect(wrapper.text()).toContain("Quản lý cân cá nhà Đặng Ánh");

  const links = wrapper.findAll("nav a");
  expect(links.map((a) => a.text())).toEqual(["Cân cá", "Danh mục"]);
});

test("router dùng hash history", () => {
  expect(router.options.history.base).toContain("#");
});
