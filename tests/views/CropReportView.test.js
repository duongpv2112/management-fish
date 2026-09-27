import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

vi.mock("@/services/cropAPI", () => ({
  default: { getCropReport: vi.fn(), closeCrop: vi.fn(), reopenCrop: vi.fn(), getCrops: vi.fn(async () => ({ data: [] })) },
}));
vi.mock("@/services/expenseAPI", () => ({
  default: {
    getExpenses: vi.fn(),
    deleteExpense: vi.fn(),
    getExpenseSuggestions: vi.fn(async () => ({ data: [] })),
  },
}));
vi.mock("@/services/expenseCategoryAPI", () => ({
  default: { getExpenseCategories: vi.fn(async () => ({ data: [] })) },
}));

import CropAPI from "@/services/cropAPI";
import ExpenseAPI from "@/services/expenseAPI";
import CropReportView from "@/views/Crops/CropReportView.vue";
import CropSheet from "@/views/Crops/components/CropSheet.vue";
import ExpenseForm from "@/views/Expenses/components/ExpenseForm.vue";
import ExpenseUndoBar from "@/views/Expenses/components/ExpenseUndoBar.vue";

const report = (overrides = {}) => ({
  crop: {
    _id: "c1",
    cropName: "Ao 1 · Vụ 09/2026",
    pond: { _id: "p1", pondName: "Ao 1" },
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: null,
    status: "open",
    days: 26,
  },
  revenue: {
    total: 12000000,
    sessions: [
      { _id: "s1", sessionName: "Phiên 20/09/2026", buyerName: "Anh Tuấn", createdAt: "2026-09-20T01:00:00Z", status: "closed", totalNet: 200, amount: 9000000, missingPrice: false },
      { _id: "s2", sessionName: "Phiên 25/09/2026", buyerName: "", createdAt: "2026-09-25T01:00:00Z", status: "closed", totalNet: 40, amount: 3000000, missingPrice: true },
    ],
    excludedForeignCurrency: 2,
  },
  expense: {
    total: 8000000,
    byCategory: [
      { category: { _id: "giong", categoryName: "Giống", metric: "seed" }, amount: 4000000, percent: 50, count: 1 },
      { category: { _id: "cam", categoryName: "Cám", metric: "feed" }, amount: 3500000, percent: 43.8, count: 2 },
    ],
  },
  profit: 4000000,
  metrics: {
    totalNetKg: 240,
    costPerKg: 33333,
    seedQuantities: [{ unit: "con", quantity: 5000 }],
    feedQuantities: [
      { unit: "bao", quantity: 10 },
      { unit: "kg", quantity: 50 },
    ],
    feedKg: 300,
    fcr: 1.25,
  },
  ...overrides,
});

const mountAt = async (cropId = "c1") => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "weigh", component: { template: "<div />" } },
      { path: "/vu-nuoi", name: "crops", component: { template: "<div />" } },
      { path: "/vu-nuoi/:cropId", name: "crop-report", component: CropReportView },
    ],
  });
  router.push(`/vu-nuoi/${cropId}`);
  await router.isReady();
  const wrapper = mount(CropReportView, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(CropAPI.getCropReport).mockResolvedValue({ data: report() });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [] });
  vi.mocked(ExpenseAPI.getExpenseSuggestions).mockResolvedValue({ data: [] });
});

test("đầu trang và ba ô số: thu, chi, lãi", async () => {
  const wrapper = await mountAt();
  expect(CropAPI.getCropReport).toHaveBeenCalledWith("c1");
  const header = wrapper.find(".report-header").text();
  expect(header).toContain("Ao 1");
  expect(header).toContain("Ao 1 · Vụ 09/2026");
  expect(header).toContain("Thả ngày 01/09/2026");
  expect(header).toContain("26 ngày");
  expect(header).toContain("đang nuôi");
  const kpis = wrapper.findAll(".report-kpi");
  expect(kpis.map((k) => k.text())).toEqual(["Tổng thu12.000.000 đ", "Tổng chi8.000.000 đ", "Lãi4.000.000 đ"]);
  expect(kpis[2].classes()).not.toContain("report-kpi--loss");
});

test("lỗ → ô thứ ba ghi Lỗ, không có dấu trừ", async () => {
  vi.mocked(CropAPI.getCropReport).mockResolvedValue({ data: report({ profit: -1500000 }) });
  const kpi = (await mountAt()).findAll(".report-kpi")[2];
  expect(kpi.text()).toBe("Lỗ1.500.000 đ");
  expect(kpi.classes()).toContain("report-kpi--loss");
});

test("mục Thu: phiên thiếu giá có cảnh báo và link sang phiên; cảnh báo phiên USD", async () => {
  const wrapper = await mountAt();
  const rows = wrapper.findAll(".report-session");
  expect(rows).toHaveLength(2);
  expect(rows[0].text()).toContain("Phiên 20/09/2026");
  expect(rows[0].text()).toContain("9.000.000 đ");
  expect(rows[0].text()).not.toContain("Chưa có giá");
  expect(rows[1].text()).toContain("⚠ Chưa có giá, chưa tính vào thu");
  expect(rows[1].find("a").attributes("href")).toBe("#/?session=s2");
  expect(wrapper.text()).toContain("Có 2 phiên bằng USD không được tính");
});

test("mục Chi: bấm nhóm → tải và hiện khoản chi của nhóm trong vụ; bấm lại → thu gọn", async () => {
  vi.mocked(ExpenseAPI.getExpenses).mockResolvedValue({
    data: {
      items: [{ _id: "e1", date: "2026-09-05T00:00:00.000Z", description: "Cám viên", amount: 3500000, category: { _id: "cam" }, crop: null }],
      total: 1,
      totalAmount: 3500000,
      page: 1,
      pageSize: 100,
    },
  });
  const wrapper = await mountAt();
  const categories = wrapper.findAll(".report-category");
  expect(categories[1].text()).toContain("Cám · 43,8%");
  expect(categories[1].text()).toContain("3.500.000 đ");
  await categories[1].trigger("click");
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenCalledWith({ cropId: "c1", categoryId: "cam", page: 1, pageSize: 100 });
  expect(wrapper.find(".report-category__items").text()).toContain("05/09/2026");
  expect(wrapper.find(".report-category__items").text()).toContain("Cám viên");

  await wrapper.findAll(".report-category")[1].trigger("click");
  expect(wrapper.find(".report-category__items").exists()).toBe(false);
});

test("mục Chỉ số", async () => {
  const metrics = (await mountAt()).find(".report-metrics").text();
  expect(metrics).toContain("Giá vốn / kg");
  expect(metrics).toContain("33.333 đ");
  expect(metrics).toContain("Giống: 5.000 con");
  expect(metrics).toContain("Thức ăn: 10 bao · 50 kg");
  expect(metrics).toContain("Hệ số thức ăn: 1,25");
});

test("không tính được hệ số thức ăn / giá vốn", async () => {
  const base = report();
  vi.mocked(CropAPI.getCropReport).mockResolvedValue({
    data: report({ metrics: { ...base.metrics, fcr: null, feedKg: null, costPerKg: null } }),
  });
  const metrics = (await mountAt()).find(".report-metrics").text();
  expect(metrics).not.toContain("Hệ số thức ăn");
  expect(metrics).toContain("Giá vốn / kg: —");
});

test("vụ đang nuôi: Kết thúc vụ mở CropSheet; vụ đã kết thúc: Mở lại vụ", async () => {
  let wrapper = await mountAt();
  await wrapper.find(".btn-close-crop button").trigger("click");
  const sheet = wrapper.findComponent(CropSheet);
  expect(sheet.props("open")).toBe(true);
  expect(sheet.props("mode")).toBe("close");
  expect(sheet.props("crop")._id).toBe("c1");

  const base = report();
  vi.mocked(CropAPI.getCropReport).mockResolvedValue({
    data: report({ crop: { ...base.crop, status: "closed", endDate: "2026-09-27T00:00:00.000Z" } }),
  });
  vi.mocked(CropAPI.reopenCrop).mockResolvedValue({ data: {} });
  wrapper = await mountAt();
  expect(wrapper.find(".report-header").text()).toContain("đã kết thúc");
  expect(wrapper.find(".btn-close-crop").exists()).toBe(false);
  await wrapper.find(".btn-reopen-crop button").trigger("click");
  await flushPromises();
  expect(CropAPI.reopenCrop).toHaveBeenCalledWith("c1");
  expect(CropAPI.getCropReport).toHaveBeenCalledTimes(3);
});

test("＋ Chi phí mở form với vụ chọn sẵn; lưu → tải lại báo cáo và hiện Hoàn tác", async () => {
  const wrapper = await mountAt();
  await wrapper.find(".btn-add-expense button").trigger("click");
  const form = wrapper.findComponent(ExpenseForm);
  expect(form.props("open")).toBe(true);
  expect(form.props("defaultCropId")).toBe("c1");
  const saved = { _id: "e9", description: "", amount: 1000 };
  form.vm.$emit("saved", { expense: saved, isNew: true });
  await flushPromises();
  expect(CropAPI.getCropReport).toHaveBeenCalledTimes(2);
  expect(wrapper.findComponent(ExpenseUndoBar).props("expense")).toEqual(saved);
});

test("lỗi tải", async () => {
  vi.mocked(CropAPI.getCropReport).mockRejectedValue(new Error("Không tìm thấy dữ liệu!"));
  const wrapper = await mountAt();
  expect(wrapper.find(".report__error").text()).toBe("Không thể tải báo cáo vụ, vui lòng thử lại sau.");
});
