import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/fishTypeAPI", () => ({
  default: { getDataFish: vi.fn(), getFishTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: { getBasketTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn() } }));

import FishTypeAPI from "@/services/fishTypeAPI";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";
import StatisticData from "@/views/ManagementFish/components/StatisticData.vue";

beforeEach(() => {
  localStorage.clear();
  vi.mocked(FishTypeAPI.getDataFish).mockReset();
});

test("DB trống: không crash, bảng hiện Trang 1 / 1", async () => {
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ success: true, data: [] });
  const wrapper = mount(ManagementFishViews);
  await flushPromises();
  expect(wrapper.find(".pagination span").text()).toBe("Trang 1 / 1");
  expect(wrapper.find(".skeleton-loader").exists()).toBe(false);
});

test("API lỗi: hiện thông báo, skeleton biến mất", async () => {
  vi.mocked(FishTypeAPI.getDataFish).mockRejectedValue(new Error("Network"));
  const wrapper = mount(ManagementFishViews);
  await flushPromises();
  expect(wrapper.text()).toContain("Không thể tải dữ liệu, vui lòng thử lại sau.");
  expect(wrapper.find(".skeleton-loader").exists()).toBe(false);
});

test("sau khi thêm cân: tải lại một lần và truyền dữ liệu xuống biểu đồ", async () => {
  const data = [{ _id: "f1", fishName: "Cá trắm", fishWeights: [25.5] }];
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ success: true, data });
  const wrapper = mount(ManagementFishViews);
  await flushPromises();
  expect(FishTypeAPI.getDataFish).toHaveBeenCalledTimes(1);
  expect(wrapper.findComponent(StatisticData).props("fishData")).toEqual(data);

  wrapper.findComponent(AddWeight).vm.$emit("weightAdded", { _id: "w1" });
  await flushPromises();
  expect(FishTypeAPI.getDataFish).toHaveBeenCalledTimes(2);
});
