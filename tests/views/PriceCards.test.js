import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/weighSessionAPI", () => ({
  default: { getSessionSummary: vi.fn(), updateSessionPrices: vi.fn(), updateSessionCurrency: vi.fn() },
}));

import WeighSessionAPI from "@/services/weighSessionAPI";
import PriceCards from "@/views/ManagementFish/components/PriceCards.vue";
import StatisticData from "@/views/ManagementFish/components/StatisticData.vue";
import SummaryPrintTable from "@/views/ManagementFish/components/SummaryPrintTable.vue";

const summary = () => ({
  session: { _id: "s1", sessionName: "Phiên 26/09/2026", createdAt: "2026-09-26T01:00:00.000Z", currency: "VND" },
  lines: [
    { fishTypeId: "f1", fishName: "Cá trắm", count: 3, totalGross: 52, totalNet: 46, unitPrice: 400000, amount: 18400000 },
    { fishTypeId: "f2", fishName: "Cá mè", count: 2, totalGross: 15.5, totalNet: 11.5, unitPrice: null, amount: null },
  ],
  totalNet: 57.5,
  totalAmount: 18400000,
  missingPriceCount: 1,
});

const mountCards = async (props = {}) => {
  const wrapper = mount(PriceCards, { props: { sessionId: "s1", refreshKey: 0, fishData: [], ...props } });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: summary() });
});

test("mỗi loại cá một thẻ: thành tiền, thiếu giá, dòng kg × giá", async () => {
  const wrapper = await mountCards();
  const cards = wrapper.findAll(".price-card");
  expect(cards).toHaveLength(2);
  expect(cards[0].find(".price-card__name").text()).toBe("Cá trắm");
  expect(cards[0].find(".price-card__amount").text()).toBe("18.400.000 đ");
  expect(cards[0].text()).toContain("46 kg ×");
  expect(cards[0].text()).toContain("đ/kg");
  expect(wrapper.find("#price-card-f1").element.value).toBe("400.000");
  expect(cards[1].find(".price-card__missing").text()).toBe("Chưa nhập giá");
});

test("thanh tổng: tổng kg, tổng tiền, ghi chú thiếu giá", async () => {
  const total = (await mountCards()).find(".price-cards__total").text();
  expect(total).toContain("Tổng · 57,5 kg");
  expect(total).toContain("18.400.000 đ");
  expect(total).toContain("(thiếu giá 1 loại cá)");
});

test("nhập giá rồi rời ô → lưu toàn bộ bảng giá", async () => {
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockResolvedValue({ success: true });
  const wrapper = await mountCards();
  const input = wrapper.find("#price-card-f2");
  await input.setValue("40.000");
  await input.trigger("blur");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionPrices).toHaveBeenCalledWith("s1", [
    { fishType: "f1", unitPrice: 400000 },
    { fishType: "f2", unitPrice: 40000 },
  ]);
});

test("ô giá bàn phím số theo loại tiền", async () => {
  const wrapper = await mountCards();
  expect(wrapper.find("#price-card-f1").attributes("inputmode")).toBe("numeric");
});

test("đổi loại tiền khi đã có giá → hỏi xác nhận rồi gọi API", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(WeighSessionAPI.updateSessionCurrency).mockResolvedValue({ success: true });
  const wrapper = await mountCards();
  await wrapper.find("#currencySelectMobile").setValue("USD");
  await flushPromises();
  expect(confirmSpy).toHaveBeenCalledWith("Đổi loại tiền sẽ xóa đơn giá đã nhập của phiên này. Tiếp tục?");
  expect(WeighSessionAPI.updateSessionCurrency).toHaveBeenCalledWith("s1", "USD");
});

test("In phiếu gọi window.print; có bảng phiếu in ẩn trên màn hình", async () => {
  const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
  const wrapper = await mountCards();
  await wrapper.find(".btn-print").trigger("click");
  expect(printSpy).toHaveBeenCalledTimes(1);
  const printTable = wrapper.findComponent(SummaryPrintTable);
  expect(printTable.exists()).toBe(true);
  expect(printTable.classes()).toContain("screen-hidden");
});

test("nút Biểu đồ bật/tắt biểu đồ", async () => {
  const fishData = [{ _id: "f1", fishName: "Cá trắm", fishWeights: [20] }];
  const wrapper = await mountCards({ fishData });
  expect(wrapper.findComponent(StatisticData).exists()).toBe(false);
  await wrapper.find(".btn-chart").trigger("click");
  expect(wrapper.findComponent(StatisticData).props("fishData")).toEqual(fishData);
  expect(wrapper.find(".btn-chart").text()).toContain("Ẩn biểu đồ");
  await wrapper.find(".btn-chart").trigger("click");
  expect(wrapper.findComponent(StatisticData).exists()).toBe(false);
});

test("chưa có phiên → thông báo, không gọi API", async () => {
  const wrapper = await mountCards({ sessionId: null });
  expect(WeighSessionAPI.getSessionSummary).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Chưa có phiên cân.");
});
