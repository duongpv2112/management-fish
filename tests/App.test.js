import { test, expect, vi, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

import App from "@/App.vue";
import AppNav from "@/components/AppNav.vue";
import AppTopBar from "@/components/AppTopBar.vue";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

const mountApp = async (isMobile) => {
  window.matchMedia = vi.fn(() => ({
    matches: isMobile,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ["weigh", "crops", "expenses", "report", "catalog", "log", "login"].map((name, index) => ({
      path: index === 0 ? "/" : `/${name}`,
      name,
      component: { template: "<div />" },
    })),
  });
  router.push("/");
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
};

test("điện thoại dùng AppTopBar, không dùng AppNav", async () => {
  const wrapper = await mountApp(true);
  expect(wrapper.findComponent(AppTopBar).exists()).toBe(true);
  expect(wrapper.findComponent(AppNav).exists()).toBe(false);
});

test("máy tính dùng AppNav", async () => {
  const wrapper = await mountApp(false);
  expect(wrapper.findComponent(AppNav).exists()).toBe(true);
  expect(wrapper.findComponent(AppTopBar).exists()).toBe(false);
});
