import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import SummaryPrintTable from "@/views/ManagementFish/components/SummaryPrintTable.vue";

const summary = {
  session: {
    _id: "s1",
    sessionName: "Phiên 26/09/2026",
    buyerName: "Anh Tuấn",
    createdAt: "2026-09-26T01:00:00.000Z",
    currency: "VND",
  },
  lines: [
    { fishTypeId: "f2", fishName: "Cá mè", count: 1, totalGross: 12, totalNet: 10, unitPrice: null, amount: null },
    { fishTypeId: "f1", fishName: "Cá trắm", count: 2, totalGross: 57.75, totalNet: 53.75, unitPrice: 45000, amount: 2418750 },
  ],
  totalNet: 63.75,
  totalAmount: 2418750,
  missingPriceCount: 1,
};

test("vùng in: tiêu đề phiên, người mua, ngày và bảng 6 cột không có ô nhập", () => {
  const wrapper = mount(SummaryPrintTable, { props: { summary, currency: "VND" } });
  const area = wrapper.find(".price-summary__print-area");
  expect(area.exists()).toBe(true);
  expect(area.text()).toContain("Phiên 26/09/2026");
  expect(area.text()).toContain("Người mua: Anh Tuấn");
  expect(area.text()).toContain("Ngày: 26/09/2026");
  expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual([
    "Loại cá",
    "Số lần cân",
    "Tổng cân (kg)",
    "Trừ giỏ còn (kg)",
    "Đơn giá (đ/kg)",
    "Thành tiền",
  ]);
  expect(wrapper.find("input").exists()).toBe(false);
});

test("đơn giá và thành tiền theo loại tiền; dòng thiếu giá; tổng", () => {
  const wrapper = mount(SummaryPrintTable, { props: { summary, currency: "VND" } });
  const rows = wrapper.findAll("tbody tr");
  expect(rows[0].text()).toContain("Chưa nhập giá");
  expect(rows[1].text()).toContain("45.000 đ");
  expect(rows[1].text()).toContain("2.418.750 đ");
  expect(wrapper.find("tfoot").text()).toContain("63,75");
  expect(wrapper.find("tfoot").text()).toContain("2.418.750 đ");
});
