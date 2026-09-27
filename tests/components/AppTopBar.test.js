import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

import AppTopBar from "@/components/AppTopBar.vue";
import { setTopBarAction, clearTopBarAction, topBarAction } from "@/common/topBarAction";

const Empty = { template: "<div />" };

const mountAt = async (path) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "weigh", component: Empty },
      { path: "/vu-nuoi", name: "crops", component: Empty },
      { path: "/chi-phi", name: "expenses", component: Empty },
      { path: "/danh-muc", name: "catalog", component: Empty },
      { path: "/nhat-ky", name: "log", component: Empty },
      { path: "/dang-nhap", name: "login", component: Empty },
    ],
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount(AppTopBar, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
};

beforeEach(() => {
  clearTopBarAction();
  localStorage.clear();
});

test("tiêu đề theo trang", async () => {
  expect((await mountAt("/")).wrapper.find(".app-top-bar__title").text()).toBe("Cân cá");
  expect((await mountAt("/danh-muc")).wrapper.find(".app-top-bar__title").text()).toBe("Danh mục");
  expect((await mountAt("/nhat-ky")).wrapper.find(".app-top-bar__title").text()).toBe("Nhật ký");
  expect((await mountAt("/vu-nuoi")).wrapper.find(".app-top-bar__title").text()).toBe("Vụ nuôi");
  expect((await mountAt("/chi-phi")).wrapper.find(".app-top-bar__title").text()).toBe("Chi phí");
});

test("nút hành động bên phải theo store; bấm gọi onClick; xóa thì biến mất", async () => {
  const onClick = vi.fn();
  const { wrapper } = await mountAt("/");
  expect(wrapper.find(".app-top-bar__action").exists()).toBe(false);

  setTopBarAction("Phiên 26/09/2026 · đang mở", onClick);
  await flushPromises();
  expect(topBarAction.label).toBe("Phiên 26/09/2026 · đang mở");
  const action = wrapper.find(".app-top-bar__action");
  expect(action.text()).toContain("Phiên 26/09/2026 · đang mở");
  await action.trigger("click");
  expect(onClick).toHaveBeenCalledTimes(1);

  clearTopBarAction();
  await flushPromises();
  expect(wrapper.find(".app-top-bar__action").exists()).toBe(false);
});

test("menu ☰ mở danh sách trang và Đăng xuất", async () => {
  const { wrapper } = await mountAt("/");
  expect(wrapper.find(".app-top-bar__menu").attributes("aria-label")).toBe("Mở menu");
  await wrapper.find(".app-top-bar__menu").trigger("click");
  const sheetText = wrapper.find(".bottom-sheet").text();
  expect(sheetText).toContain("Cân cá");
  expect(sheetText).toContain("Danh mục");
  expect(sheetText).toContain("Nhật ký");
  expect(sheetText).toContain("Đăng xuất");
});

test("chọn trang trong menu → chuyển trang và đóng menu", async () => {
  const { wrapper, router } = await mountAt("/");
  await wrapper.find(".app-top-bar__menu").trigger("click");
  const link = wrapper.findAll(".app-top-bar__link").find((node) => node.text() === "Nhật ký");
  await link.trigger("click");
  await flushPromises();
  expect(router.currentRoute.value.name).toBe("log");
  expect(wrapper.find(".bottom-sheet").exists()).toBe(false);
});

test("Đăng xuất → xóa phiên đăng nhập và về trang đăng nhập", async () => {
  localStorage.setItem("token", "abc");
  localStorage.setItem("tokenExpiresAt", String(Date.now() + 100000));
  const { wrapper, router } = await mountAt("/");
  await wrapper.find(".app-top-bar__menu").trigger("click");
  await wrapper.find(".app-top-bar__logout").trigger("click");
  await flushPromises();
  expect(localStorage.getItem("token")).toBeNull();
  expect(router.currentRoute.value.name).toBe("login");
});

test("trang đăng nhập không có thanh trên", async () => {
  const { wrapper } = await mountAt("/dang-nhap");
  expect(wrapper.find(".app-top-bar").exists()).toBe(false);
});

test("nút hành động dạng thêm mới không có mũi tên ▾", async () => {
  setTopBarAction("＋ Chi phí", () => {}, { chevron: false });
  const { wrapper } = await mountAt("/chi-phi");
  expect(wrapper.find(".app-top-bar__action").text()).toBe("＋ Chi phí");
  setTopBarAction("Phiên 1", () => {});
  await flushPromises();
  expect(wrapper.find(".app-top-bar__action").text()).toBe("Phiên 1 ▾");
});

test("trang không có trong menu dùng route.meta.title", async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "weigh", component: Empty },
      { path: "/vu-nuoi/:cropId", name: "crop-report", component: Empty, meta: { title: "Báo cáo vụ" } },
    ],
  });
  router.push("/vu-nuoi/c1");
  await router.isReady();
  const wrapper = mount(AppTopBar, { global: { plugins: [router] } });
  await flushPromises();
  expect(wrapper.find(".app-top-bar__title").text()).toBe("Báo cáo vụ");
});
