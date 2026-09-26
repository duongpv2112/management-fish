import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/logTrackingAPI", () => ({ default: { getLogTrackings: vi.fn() } }));
vi.mock("@/services/fishTypeAPI", () => ({
  default: {
    getFishTypes: vi.fn(async () => ({
      data: [
        { _id: "f1", fishName: "Cá trắm" },
        { _id: "f2", fishName: "Cá mè" },
      ],
    })),
  },
}));

import LogTrackingAPI from "@/services/logTrackingAPI";
import ManagementTracking from "@/views/ManagementTracking/ManagementTracking.vue";
import CPCombobox from "@/components/ComboboxComponent.vue";

const page = (items, total, pageNumber = 1) => ({
  success: true,
  data: { items, total, page: pageNumber, pageSize: 20 },
});

const logs = [
  {
    _id: "l1",
    fishTypeName: "Cá trắm",
    stepName: "Thêm mới bản ghi cân cá: 'Cá trắm' thành công",
    createdAt: new Date(2026, 8, 26, 7, 5).toISOString(),
  },
  {
    _id: "l2",
    fishTypeName: "",
    stepName: "Xóa bản ghi cân cá: 'x' không thành công",
    createdAt: new Date(2026, 8, 25, 18, 30).toISOString(),
  },
];

beforeEach(() => {
  vi.mocked(LogTrackingAPI.getLogTrackings).mockReset();
  vi.mocked(LogTrackingAPI.getLogTrackings).mockResolvedValue(page(logs, 45));
});

const mountPage = async () => {
  const wrapper = mount(ManagementTracking);
  await flushPromises();
  return wrapper;
};

test("mount gọi API trang 1 và hiển thị bảng", async () => {
  const wrapper = await mountPage();
  expect(LogTrackingAPI.getLogTrackings).toHaveBeenCalledWith({ fishType: "", page: 1, pageSize: 20 });
  const rows = wrapper.findAll("tbody tr");
  expect(rows).toHaveLength(2);
  expect(rows[0].text()).toContain("26/09/2026 07:05");
  expect(rows[0].text()).toContain("Cá trắm");
  expect(wrapper.find(".pagination span").text()).toBe("Trang 1 / 3");
});

test("dòng 'không thành công' được tô màu lỗi", async () => {
  const wrapper = await mountPage();
  const rows = wrapper.findAll("tbody tr");
  expect(rows[0].classes()).not.toContain("log-row--error");
  expect(rows[1].classes()).toContain("log-row--error");
});

test("bấm Sau → gọi trang 2", async () => {
  const wrapper = await mountPage();
  await wrapper.findAll(".page-btn")[1].trigger("click");
  await flushPromises();
  expect(LogTrackingAPI.getLogTrackings).toHaveBeenLastCalledWith({ fishType: "", page: 2, pageSize: 20 });
});

test("chọn loại cá → về trang 1 kèm fishType", async () => {
  const wrapper = await mountPage();
  await wrapper.findAll(".page-btn")[1].trigger("click");
  await flushPromises();
  wrapper.findComponent(CPCombobox).vm.$emit("update", "Cá trắm");
  await flushPromises();
  expect(LogTrackingAPI.getLogTrackings).toHaveBeenLastCalledWith({
    fishType: "Cá trắm",
    page: 1,
    pageSize: 20,
  });
});

test("bộ lọc có lựa chọn 'Tất cả' và các loại cá", async () => {
  const wrapper = await mountPage();
  expect(wrapper.findComponent(CPCombobox).props("lstData").map((o) => o.text)).toEqual([
    "Tất cả",
    "Cá trắm",
    "Cá mè",
  ]);
});

test("không có dữ liệu", async () => {
  vi.mocked(LogTrackingAPI.getLogTrackings).mockResolvedValue(page([], 0));
  const wrapper = await mountPage();
  expect(wrapper.text()).toContain("Chưa có nhật ký.");
  expect(wrapper.find(".pagination span").text()).toBe("Trang 1 / 1");
});

describe("điện thoại", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test("nhật ký là danh sách từng dòng thay cho bảng; dòng lỗi tô đỏ", async () => {
    const wrapper = await mountPage();
    expect(wrapper.find("table.log-table").exists()).toBe(false);
    const items = wrapper.findAll(".log-list .log-item");
    expect(items).toHaveLength(2);
    expect(items[0].find(".log-item__meta").text()).toBe("26/09/2026 07:05 · Cá trắm");
    expect(items[0].find(".log-item__text").text()).toBe("Thêm mới bản ghi cân cá: 'Cá trắm' thành công");
    expect(items[0].classes()).not.toContain("log-item--error");
    expect(items[1].classes()).toContain("log-item--error");
    expect(items[1].find(".log-item__meta").text()).toBe("25/09/2026 18:30");
  });

  test("chưa có dữ liệu → thông báo trống trong danh sách", async () => {
    vi.mocked(LogTrackingAPI.getLogTrackings).mockResolvedValue(page([], 0));
    const wrapper = await mountPage();
    expect(wrapper.find(".log-list__empty").text()).toBe("Chưa có nhật ký.");
  });
});
