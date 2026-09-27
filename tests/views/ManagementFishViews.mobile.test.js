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
vi.mock("@/services/pondAPI", () => ({ default: { getPonds: vi.fn(async () => ({ data: [] })) } }));
vi.mock("@/services/cropAPI", () => ({ default: { getCrops: vi.fn(async () => ({ data: [] })) } }));

import WeighSessionAPI from "@/services/weighSessionAPI";
import FishTypeAPI from "@/services/fishTypeAPI";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";
import MobileTabBar from "@/views/ManagementFish/components/MobileTabBar.vue";
import PriceSummary from "@/views/ManagementFish/components/PriceSummary.vue";
import DataViewer from "@/views/ManagementFish/components/DataViewer.vue";
import SessionSheet from "@/views/ManagementFish/components/SessionSheet.vue";
import SessionBar from "@/views/ManagementFish/components/SessionBar.vue";
import NewSessionSheet from "@/views/ManagementFish/components/NewSessionSheet.vue";
import SessionCropSheet from "@/views/ManagementFish/components/SessionCropSheet.vue";
import FishWeightCards from "@/views/ManagementFish/components/FishWeightCards.vue";
import PriceCards from "@/views/ManagementFish/components/PriceCards.vue";
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

test("?tab=tien → mở tab Tiền dạng thẻ (không dùng bảng tiền máy tính)", async () => {
  const data = [{ _id: "f1", fishName: "Cá trắm", fishWeights: [20], fishWeightItems: [] }];
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ data });
  const { wrapper } = await mountAt("/?tab=tien");
  expect(wrapper.findComponent(MobileTabBar).props("modelValue")).toBe("tien");
  const cards = wrapper.findComponent(PriceCards);
  expect(cards.exists()).toBe(true);
  expect(cards.props()).toMatchObject({ sessionId: "s2", refreshKey: 0, fishData: data });
  expect(wrapper.findComponent(PriceSummary).exists()).toBe(false);
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
  expect(wrapper.findComponent(FishWeightCards).exists()).toBe(true);
  expect(wrapper.findComponent(DataViewer).exists()).toBe(false);

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

test("phiên đã kết thúc, không còn phiên mở: chỉ có nút Phiên mới (mở thẳng sheet chọn ao)", async () => {
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({ data: [closedSession] });
  const { wrapper } = await mountAt("/");
  const panel = wrapper.find(".session-closed-panel");
  expect(panel.find(".btn-go-open").exists()).toBe(false);
  await panel.find(".btn-new-session-mobile").trigger("click");
  expect(wrapper.findComponent(NewSessionSheet).props("open")).toBe(true);
});

test("điện thoại: Phiên mới trong danh sách phiên → mở sheet chọn ao; tạo xong tải lại và chọn phiên mở", async () => {
  const { wrapper } = await mountAt("/");
  wrapper.findComponent(SessionSheet).vm.$emit("requestNew");
  await flushPromises();
  expect(wrapper.findComponent(NewSessionSheet).props("open")).toBe(true);

  const s3 = { _id: "s3", sessionName: "Phiên 27/09/2026", status: "open" };
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({ data: [s3, { ...openSession, status: "closed" }] });
  wrapper.findComponent(NewSessionSheet).vm.$emit("created", s3);
  await flushPromises();
  expect(FishTypeAPI.getDataFish).toHaveBeenLastCalledWith("s3");
});

test("điện thoại: Chọn ao → mở sheet gán ao cho phiên đang chọn; gán xong tải lại, giữ phiên đang xem", async () => {
  const { wrapper } = await mountAt("/");
  wrapper.findComponent(SessionSheet).vm.$emit("select", "s1");
  await flushPromises();
  wrapper.findComponent(SessionSheet).vm.$emit("requestCrop");
  await flushPromises();
  const cropSheet = wrapper.findComponent(SessionCropSheet);
  expect(cropSheet.props("open")).toBe(true);
  expect(cropSheet.props("session")._id).toBe("s1");

  const pond = { _id: "p1", pondName: "Ao 1" };
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({
    data: [openSession, { ...closedSession, crop: { _id: "c1", cropName: "Vụ", pond } }],
  });
  const calls = vi.mocked(WeighSessionAPI.getWeighSessions).mock.calls.length;
  cropSheet.vm.$emit("updated");
  await flushPromises();
  expect(WeighSessionAPI.getWeighSessions).toHaveBeenCalledTimes(calls + 1);
  expect(topBarAction.label).toBe("Phiên 25/09/2026 · Ao 1 · đã kết thúc");
});

test("máy tính: SessionBar Phiên mới / Chọn ao mở đúng sheet", async () => {
  setMobile(false);
  const { wrapper } = await mountAt("/");
  const bar = wrapper.findComponent(SessionBar);
  bar.vm.$emit("requestNew");
  await flushPromises();
  expect(wrapper.findComponent(NewSessionSheet).props("open")).toBe(true);

  bar.vm.$emit("requestCrop");
  await flushPromises();
  expect(wrapper.findComponent(SessionCropSheet).props("open")).toBe(true);
  expect(wrapper.findComponent(SessionCropSheet).props("session")._id).toBe("s2");
});

test("máy tính: không có thanh tab, có cả bảng và form cân", async () => {
  setMobile(false);
  const { wrapper } = await mountAt("/");
  expect(wrapper.findComponent(MobileTabBar).exists()).toBe(false);
  expect(wrapper.findComponent(DataViewer).exists()).toBe(true);
  expect(wrapper.findComponent(AddWeight).exists()).toBe(true);
  expect(topBarAction.label).toBe("");
});

test("tab Bảng: thẻ nhận dữ liệu phiên; chạm số cân → mở hộp thoại sửa", async () => {
  const data = [
    {
      _id: "f1",
      fishName: "Cá trắm",
      fishWeights: [20],
      fishWeightItems: [{ _id: "w1", fishWeight: 20, netWeight: 18, basketType: "b1", createdAt: "2026-09-26T01:00:00Z" }],
    },
  ];
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ data });
  const { wrapper } = await mountAt("/?tab=bang");
  const cards = wrapper.findComponent(FishWeightCards);
  expect(cards.props("fishData")).toEqual(data);
  expect(cards.props("readOnly")).toBe(false);

  cards.vm.$emit("editItem", { _id: "w1", fishType: "f1", fishWeight: 20 });
  await flushPromises();
  expect(wrapper.findComponent({ name: "WeightEditDialog" }).exists()).toBe(true);
});
