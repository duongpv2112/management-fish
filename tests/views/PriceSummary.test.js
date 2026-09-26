import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/weighSessionAPI", () => ({
  default: { getSessionSummary: vi.fn(), updateSessionPrices: vi.fn(), updateSessionCurrency: vi.fn() },
}));

import WeighSessionAPI from "@/services/weighSessionAPI";
import PriceSummary from "@/views/ManagementFish/components/PriceSummary.vue";

const summary = () => ({
  session: {
    _id: "s1",
    sessionName: "Phiên 26/09/2026",
    buyerName: "Anh Tuấn",
    status: "open",
    createdAt: "2026-09-26T01:00:00.000Z",
    currency: "VND",
  },
  lines: [
    { fishTypeId: "f2", fishName: "Cá mè", count: 1, totalGross: 12, totalNet: 10, unitPrice: null, amount: null },
    {
      fishTypeId: "f1",
      fishName: "Cá trắm",
      count: 2,
      totalGross: 57.75,
      totalNet: 53.75,
      unitPrice: 45000,
      amount: 2418750,
    },
  ],
  totalNet: 63.75,
  totalAmount: 2418750,
  missingPriceCount: 1,
});

const mountSummary = async (props = { sessionId: "s1" }) => {
  const wrapper = mount(PriceSummary, { props });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: summary() });
});

test("hiển thị thành tiền, 'Chưa nhập giá' và ghi chú thiếu giá", async () => {
  const wrapper = await mountSummary();
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledWith("s1");
  const rows = wrapper.findAll("tbody tr");
  expect(rows[0].text()).toContain("Cá mè");
  expect(rows[0].text()).toContain("Chưa nhập giá");
  expect(rows[1].text()).toContain("57,75");
  expect(rows[1].text()).toContain("53,75");
  expect(rows[1].text()).toContain("2.418.750 đ");
  const total = wrapper.find("tfoot").text();
  expect(total).toContain("Tổng cộng");
  expect(total).toContain("63,75");
  expect(total).toContain("2.418.750 đ");
  expect(total).toContain("(thiếu giá 1 loại cá)");
  expect(wrapper.text()).toContain("Anh Tuấn");
  expect(wrapper.find("#price-f1").element.value).toBe("45.000");
});

test('nhập giá "40000" cho mè rồi rời ô → gửi đầy đủ bảng giá và tải lại', async () => {
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountSummary();
  const input = wrapper.find("#price-f2");
  await input.setValue("40000");
  await input.trigger("blur");
  await flushPromises();

  expect(WeighSessionAPI.updateSessionPrices).toHaveBeenCalledWith("s1", [
    { fishType: "f2", unitPrice: 40000 },
    { fishType: "f1", unitPrice: 45000 },
  ]);
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledTimes(2);
});

test("giá gõ có dấu chấm ngăn cách nghìn vẫn hiểu đúng", async () => {
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountSummary();
  const input = wrapper.find("#price-f2");
  await input.setValue("40.000");
  await input.trigger("blur");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionPrices.mock.calls[0][1][0]).toEqual({ fishType: "f2", unitPrice: 40000 });
});

test("rời ô mà không đổi giá → không gọi API", async () => {
  const wrapper = await mountSummary();
  await wrapper.find("#price-f1").trigger("blur");
  expect(WeighSessionAPI.updateSessionPrices).not.toHaveBeenCalled();
});

test("server lỗi → hiện message, ô trở về giá cũ", async () => {
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockRejectedValue(new Error("Đơn giá không hợp lệ!"));
  const wrapper = await mountSummary();
  const input = wrapper.find("#price-f1");
  await input.setValue("50000");
  await input.trigger("blur");
  await flushPromises();

  expect(wrapper.find(".error-message").text()).toBe("Đơn giá không hợp lệ!");
  expect(wrapper.find("#price-f1").element.value).toBe("45.000");
});

test("In phiếu gọi window.print", async () => {
  const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
  const wrapper = await mountSummary();
  await wrapper.find(".btn-print button").trigger("click");
  expect(printSpy).toHaveBeenCalledTimes(1);
});

test("chưa có phiên → không gọi API", async () => {
  const wrapper = await mountSummary({ sessionId: null });
  expect(WeighSessionAPI.getSessionSummary).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Chưa có phiên cân");
});

test("đổi refreshKey → tải lại", async () => {
  const wrapper = await mountSummary({ sessionId: "s1", refreshKey: 0 });
  await wrapper.setProps({ refreshKey: 1 });
  await flushPromises();
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledTimes(2);
});

const usdSummary = () => ({
  ...summary(),
  session: { ...summary().session, currency: "USD" },
  lines: [
    { fishTypeId: "f1", fishName: "Cá trắm", count: 2, totalGross: 17.43, totalNet: 15.43, unitPrice: 1.75, amount: 27 },
  ],
  totalNet: 15.43,
  totalAmount: 27,
  missingPriceCount: 0,
});

test("VND: tiêu đề cột đ/kg, ô đơn giá có ký hiệu đ, loại tiền đang chọn là VND", async () => {
  const wrapper = await mountSummary();
  expect(wrapper.find("thead").text()).toContain("Đơn giá (đ/kg)");
  expect(wrapper.find(".price-input-wrapper .price-input-symbol").text()).toBe("đ");
  expect(wrapper.find("#currencySelect").element.value).toBe("VND");
});

test("USD: tiêu đề $/kg, ô đơn giá 1.75 kèm $, thành tiền $27.00", async () => {
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: usdSummary() });
  const wrapper = await mountSummary();
  expect(wrapper.find("thead").text()).toContain("Đơn giá ($/kg)");
  expect(wrapper.find("#price-f1").element.value).toBe("1.75");
  expect(wrapper.find(".price-input-symbol").text()).toBe("$");
  expect(wrapper.find("tbody").text()).toContain("$27.00");
  expect(wrapper.find("tfoot").text()).toContain("$27.00");
  expect(wrapper.find("#currencySelect").element.value).toBe("USD");
});

test('USD: nhập "2,5" → gửi 2.5', async () => {
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: usdSummary() });
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountSummary();
  const input = wrapper.find("#price-f1");
  await input.setValue("2,5");
  await input.trigger("blur");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionPrices).toHaveBeenCalledWith("s1", [{ fishType: "f1", unitPrice: 2.5 }]);
});

test("đổi loại tiền khi đã có giá: hỏi xác nhận, đồng ý thì gọi API và tải lại", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(WeighSessionAPI.updateSessionCurrency).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountSummary();
  await wrapper.find("#currencySelect").setValue("USD");
  await flushPromises();

  expect(confirmSpy).toHaveBeenCalledWith("Đổi loại tiền sẽ xóa đơn giá đã nhập của phiên này. Tiếp tục?");
  expect(WeighSessionAPI.updateSessionCurrency).toHaveBeenCalledWith("s1", "USD");
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledTimes(2);
});

test("đổi loại tiền nhưng bấm Hủy: không gọi API, ô chọn trở về VND", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = await mountSummary();
  await wrapper.find("#currencySelect").setValue("USD");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionCurrency).not.toHaveBeenCalled();
  expect(wrapper.find("#currencySelect").element.value).toBe("VND");
});

test("chưa có giá nào thì đổi loại tiền không cần xác nhận", async () => {
  const confirmSpy = vi.spyOn(window, "confirm");
  vi.mocked(WeighSessionAPI.updateSessionCurrency).mockResolvedValue({ success: true, data: {} });
  const noPrice = summary();
  noPrice.lines = noPrice.lines.map((line) => ({ ...line, unitPrice: null, amount: null }));
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: noPrice });
  const wrapper = await mountSummary();
  await wrapper.find("#currencySelect").setValue("USD");
  await flushPromises();
  expect(confirmSpy).not.toHaveBeenCalled();
  expect(WeighSessionAPI.updateSessionCurrency).toHaveBeenCalledWith("s1", "USD");
});

test("đổi loại tiền lỗi: hiện message, ô chọn trở về loại cũ", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(WeighSessionAPI.updateSessionCurrency).mockRejectedValue(new Error("Loại tiền không hợp lệ!"));
  const wrapper = await mountSummary();
  await wrapper.find("#currencySelect").setValue("USD");
  await flushPromises();
  expect(wrapper.find(".error-message").text()).toBe("Loại tiền không hợp lệ!");
  expect(wrapper.find("#currencySelect").element.value).toBe("VND");
});
