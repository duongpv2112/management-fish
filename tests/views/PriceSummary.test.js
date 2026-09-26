import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/weighSessionAPI", () => ({
  default: { getSessionSummary: vi.fn(), updateSessionPrices: vi.fn() },
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
  expect(wrapper.find("#price-f1").element.value).toBe("45000");
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
  expect(wrapper.find("#price-f1").element.value).toBe("45000");
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
