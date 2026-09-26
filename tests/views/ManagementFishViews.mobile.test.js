import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/weighSessionAPI", () => ({
  default: {
    getWeighSessions: vi.fn(),
    getSessionSummary: vi.fn(async () => ({ data: null })),
  },
}));
vi.mock("@/services/fishTypeAPI", () => ({
  default: { getDataFish: vi.fn(async () => ({ data: [] })), getFishTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: { getBasketTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn(), deleteFishWeight: vi.fn() } }));

import WeighSessionAPI from "@/services/weighSessionAPI";
import FishTypeAPI from "@/services/fishTypeAPI";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";
import MobileTabBar from "@/views/ManagementFish/components/MobileTabBar.vue";
import PriceSummary from "@/views/ManagementFish/components/PriceSummary.vue";
import DataViewer from "@/views/ManagementFish/components/DataViewer.vue";
import SessionSheet from "@/views/ManagementFish/components/SessionSheet.vue";
import { topBarAction, clearTopBarAction } from "@/common/topBarAction";

const openSession = { _id: "s2", sessionName: "Phiên 26/09/2026", status: "open", createdAt: "2026-09-26T01:00:00Z" };
const closedSession = { _id: "s1", sessionName: "Phiên 25/09/2026", status: "closed", createdAt: "2026-09-25T01:00:00Z" };

const originalMatchMedia = window.matchMedia;

const setMobile = (matches) => {
  window.matchMedia = vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
};

const mountAt = async (path = "/") => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", name: "weigh", component: { template: "<div />" } }],
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount(ManagementFishViews, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
};

beforeEach(() => {
  localStorage.clear();
  clearTopBarAction();
  setMobile(true);
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({ data: [openSession, closedSession] });
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ data: [] });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

test("điện thoại: mặc định tab Cân có form cân và thanh tab, chưa có bảng", async () => {
  const { wrapper } = await mountAt("/");
  expect(wrapper.findComponent(MobileTabBar).props("modelValue")).toBe("can");
  expect(wrapper.findComponent(AddWeight).exists()).toBe(true);
  expect(wrapper.findComponent(DataViewer).exists()).toBe(false);
  expect(wrapper.findComponent(PriceSummary).exists()).toBe(false);
});

test("?tab=tien → mở tab Tiền", async () => {
  const { wrapper } = await mountAt("/?tab=tien");
  expect(wrapper.findComponent(MobileTabBar).props("modelValue")).toBe("tien");
  expect(wrapper.findComponent(PriceSummary).exists()).toBe(true);
});

test("?tab lạ → về tab Cân", async () => {
  const { wrapper } = await mountAt("/?tab=abc");
  expect(wrapper.findComponent(MobileTabBar).props("modelValue")).toBe("can");
});

test("bấm tab Bảng → ghi ?tab=bang; về tab Cân → bỏ tab khỏi URL", async () => {
  const { wrapper, router } = await mountAt("/");
  wrapper.findComponent(MobileTabBar).vm.$emit("update:modelValue", "bang");
  await flushPromises();
  expect(router.currentRoute.value.query.tab).toBe("bang");
  expect(wrapper.findComponent(DataViewer).exists()).toBe(true);

  wrapper.findComponent(MobileTabBar).vm.$emit("update:modelValue", "can");
  await flushPromises();
  expect(router.currentRoute.value.query.tab).toBeUndefined();
});

test("form cân vẫn giữ nguyên (không bị tạo lại) khi chuyển tab", async () => {
  const { wrapper } = await mountAt("/");
  wrapper.findComponent(AddWeight).vm.setFormValues({ fishWeight: 12 });
  wrapper.findComponent(MobileTabBar).vm.$emit("update:modelValue", "tien");
  await flushPromises();
  wrapper.findComponent(MobileTabBar).vm.$emit("update:modelValue", "can");
  await flushPromises();
  expect(wrapper.find("#fishWeight").element.value).toBe("12");
});

test("AddWeight nhận dữ liệu phiên để xếp hạng", async () => {
  const data = [{ _id: "f1", fishName: "Cá trắm", fishWeights: [], fishWeightItems: [] }];
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ data });
  const { wrapper } = await mountAt("/");
  expect(wrapper.findComponent(AddWeight).props("sessionFishData")).toEqual(data);
});

test("thanh trên cùng hiện phiên đang chọn; bấm → mở danh sách phiên", async () => {
  const { wrapper } = await mountAt("/");
  expect(topBarAction.label).toBe("Phiên 26/09/2026 · đang mở");
  topBarAction.onClick();
  await flushPromises();
  expect(wrapper.findComponent(SessionSheet).props("open")).toBe(true);
});

test("rời trang → xóa nút phiên trên thanh trên cùng", async () => {
  const { wrapper } = await mountAt("/");
  wrapper.unmount();
  expect(topBarAction.label).toBe("");
});

test("phiên đã kết thúc: tab Cân hiện thông báo, nút về phiên đang mở", async () => {
  const { wrapper } = await mountAt("/");
  wrapper.findComponent(SessionSheet).vm.$emit("select", "s1");
  await flushPromises();
  const panel = wrapper.find(".session-closed-panel");
  expect(panel.text()).toContain("Phiên đã kết thúc.");
  expect(wrapper.findComponent(AddWeight).exists()).toBe(false);
  expect(topBarAction.label).toBe("Phiên 25/09/2026 · đã kết thúc");

  await panel.find(".btn-go-open").trigger("click");
  await flushPromises();
  expect(wrapper.find(".session-closed-panel").exists()).toBe(false);
  expect(FishTypeAPI.getDataFish).toHaveBeenLastCalledWith("s2");
});

test("phiên đã kết thúc, không còn phiên mở: chỉ có nút Phiên mới (mở danh sách phiên)", async () => {
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({ data: [closedSession] });
  const { wrapper } = await mountAt("/");
  const panel = wrapper.find(".session-closed-panel");
  expect(panel.find(".btn-go-open").exists()).toBe(false);
  await panel.find(".btn-new-session-mobile").trigger("click");
  expect(wrapper.findComponent(SessionSheet).props("open")).toBe(true);
});

test("máy tính: không có thanh tab, có cả bảng và form cân", async () => {
  setMobile(false);
  const { wrapper } = await mountAt("/");
  expect(wrapper.findComponent(MobileTabBar).exists()).toBe(false);
  expect(wrapper.findComponent(DataViewer).exists()).toBe(true);
  expect(wrapper.findComponent(AddWeight).exists()).toBe(true);
  expect(topBarAction.label).toBe("");
});
