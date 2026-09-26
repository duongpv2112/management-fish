import { test, expect, vi, beforeEach, describe } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/weighSessionAPI", () => ({
  default: {
    getWeighSessions: vi.fn(),
    createWeighSession: vi.fn(),
    closeWeighSession: vi.fn(),
    getSessionSummary: vi.fn(),
    updateSessionPrices: vi.fn(),
  },
}));
vi.mock("@/services/fishTypeAPI", () => ({
  default: { getDataFish: vi.fn(), getFishTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: { getBasketTypes: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn() } }));

import WeighSessionAPI from "@/services/weighSessionAPI";
import FishTypeAPI from "@/services/fishTypeAPI";
import SessionBar from "@/views/ManagementFish/components/SessionBar.vue";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";
import CPCombobox from "@/components/ComboboxComponent.vue";

const openSession = { _id: "s2", sessionName: "Phiên 26/09/2026", buyerName: "Anh Tuấn", status: "open" };
const closedSession = { _id: "s1", sessionName: "Phiên 25/09/2026", buyerName: "", status: "closed" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(FishTypeAPI.getFishTypes).mockResolvedValue({ data: [] });
  vi.mocked(FishTypeAPI.getDataFish).mockResolvedValue({ success: true, data: [] });
  vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({
    success: true,
    data: [openSession, closedSession],
  });
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({
    success: true,
    data: { session: openSession, lines: [], totalNet: 0, totalAmount: 0, missingPriceCount: 0 },
  });
});

describe("SessionBar", () => {
  const mountBar = (selectedId = "s2") =>
    mount(SessionBar, { props: { sessions: [openSession, closedSession], selectedId } });

  test("hiển thị phiên theo dạng 'tên — người mua (đang mở)'", async () => {
    const wrapper = mountBar();
    await flushPromises();
    const combobox = wrapper.findComponent(CPCombobox);
    expect(combobox.props("lstData").map((s) => s.label)).toEqual([
      "Phiên 26/09/2026 — Anh Tuấn (đang mở)",
      "Phiên 25/09/2026",
    ]);
    expect(wrapper.find("#sessionSelect").element.value).toBe("Phiên 26/09/2026 — Anh Tuấn (đang mở)");
  });

  test("chọn phiên → emit select", async () => {
    const wrapper = mountBar();
    wrapper.findComponent(CPCombobox).vm.$emit("update", "s1");
    expect(wrapper.emitted().select).toEqual([["s1"]]);
  });

  test("Phiên mới: hỏi tên người mua rồi tạo phiên", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("  Chị Lan ");
    vi.mocked(WeighSessionAPI.createWeighSession).mockResolvedValue({ success: true, data: { _id: "s3" } });
    const wrapper = mountBar();
    await wrapper.find(".btn-new-session button").trigger("click");
    await flushPromises();
    expect(WeighSessionAPI.createWeighSession).toHaveBeenCalledWith({ buyerName: "Chị Lan" });
    expect(wrapper.emitted().created[0][0]).toEqual({ _id: "s3" });
  });

  test("Phiên mới: bấm Hủy ở hộp hỏi tên → không tạo", async () => {
    vi.spyOn(window, "prompt").mockReturnValue(null);
    const wrapper = mountBar();
    await wrapper.find(".btn-new-session button").trigger("click");
    expect(WeighSessionAPI.createWeighSession).not.toHaveBeenCalled();
  });

  test("Kết thúc phiên: xác nhận → gọi closeWeighSession và emit closed", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(WeighSessionAPI.closeWeighSession).mockResolvedValue({ success: true, data: {} });
    const wrapper = mountBar();
    await wrapper.find(".btn-close-session button").trigger("click");
    await flushPromises();
    expect(confirmSpy).toHaveBeenCalledWith('Kết thúc phiên "Phiên 26/09/2026"?');
    expect(WeighSessionAPI.closeWeighSession).toHaveBeenCalledWith("s2");
    expect(wrapper.emitted().closed).toHaveLength(1);
  });

  test("đang xem phiên đã đóng → không có nút Kết thúc phiên", () => {
    const wrapper = mountBar("s1");
    expect(wrapper.find(".btn-close-session").exists()).toBe(false);
  });
});

describe("ManagementFishViews với phiên cân", () => {
  test("mặc định chọn phiên đang mở và tải dữ liệu của phiên đó", async () => {
    mount(ManagementFishViews);
    await flushPromises();
    expect(FishTypeAPI.getDataFish).toHaveBeenLastCalledWith("s2");
  });

  test("chọn phiên khác → getDataFish với id đó; phiên đã đóng thì ẩn form thêm cân", async () => {
    const wrapper = mount(ManagementFishViews);
    await flushPromises();
    expect(wrapper.findComponent(AddWeight).exists()).toBe(true);

    wrapper.findComponent(SessionBar).vm.$emit("select", "s1");
    await flushPromises();
    expect(FishTypeAPI.getDataFish).toHaveBeenLastCalledWith("s1");
    expect(wrapper.findComponent(AddWeight).exists()).toBe(false);
    expect(wrapper.text()).toContain("Phiên đã kết thúc");
  });

  test("kết thúc phiên → tải lại danh sách phiên", async () => {
    const wrapper = mount(ManagementFishViews);
    await flushPromises();
    wrapper.findComponent(SessionBar).vm.$emit("closed");
    await flushPromises();
    expect(WeighSessionAPI.getWeighSessions).toHaveBeenCalledTimes(2);
  });

  test("chưa có phiên nào → vẫn hiện form thêm cân (lần cân đầu tự tạo phiên)", async () => {
    vi.mocked(WeighSessionAPI.getWeighSessions).mockResolvedValue({ success: true, data: [] });
    const wrapper = mount(ManagementFishViews);
    await flushPromises();
    expect(FishTypeAPI.getDataFish).toHaveBeenLastCalledWith(undefined);
    expect(wrapper.findComponent(AddWeight).exists()).toBe(true);
  });
});

describe("tab Tiền / Biểu đồ", () => {
  test("mặc định hiện bảng tiền của phiên đang chọn; chuyển tab thì hiện biểu đồ", async () => {
    const { default: PriceSummary } = await import("@/views/ManagementFish/components/PriceSummary.vue");
    const { default: StatisticData } = await import("@/views/ManagementFish/components/StatisticData.vue");
    const wrapper = mount(ManagementFishViews);
    await flushPromises();
    expect(wrapper.findComponent(PriceSummary).props("sessionId")).toBe("s2");
    expect(wrapper.findComponent(StatisticData).exists()).toBe(false);

    await wrapper.find(".statistic-tabs__chart").trigger("click");
    expect(wrapper.findComponent(StatisticData).exists()).toBe(true);
    expect(wrapper.findComponent(PriceSummary).exists()).toBe(false);
  });

  test("thêm cân xong → bảng tiền tải lại", async () => {
    const wrapper = mount(ManagementFishViews);
    await flushPromises();
    const before = vi.mocked(WeighSessionAPI.getSessionSummary).mock.calls.length;
    wrapper.findComponent(AddWeight).vm.$emit("weightAdded", {});
    await flushPromises();
    expect(vi.mocked(WeighSessionAPI.getSessionSummary).mock.calls.length).toBe(before + 1);
  });
});
