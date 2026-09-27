import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { chooseOption } from "../helpers/select";

vi.mock("@/services/expenseAPI", () => ({
  default: {
    getExpenses: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    getExpenseSuggestions: vi.fn(async () => ({ data: [] })),
  },
}));
vi.mock("@/services/cropAPI", () => ({ default: { getCrops: vi.fn() } }));
vi.mock("@/services/expenseCategoryAPI", () => ({
  default: { getExpenseCategories: vi.fn(async () => ({ data: [] })) },
}));

import ExpenseAPI from "@/services/expenseAPI";
import CropAPI from "@/services/cropAPI";
import ExpensesView from "@/views/Expenses/ExpensesView.vue";
import ExpenseForm from "@/views/Expenses/components/ExpenseForm.vue";
import ExpenseUndoBar from "@/views/Expenses/components/ExpenseUndoBar.vue";

const pond = { _id: "p1", pondName: "Ao 1" };
const crop = { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", status: "open", pond };
const items = [
  {
    _id: "e1",
    date: "2026-09-20T00:00:00.000Z",
    category: { _id: "cam", categoryName: "Cám" },
    crop,
    description: "Cám viên",
    amount: 3500000,
  },
  { _id: "e2", date: "2026-09-10T00:00:00.000Z", category: { _id: "dien", categoryName: "Điện" }, crop: null, description: "", amount: 600000 },
];

const page = (overrides = {}) => ({ data: { items, total: 2, totalAmount: 4100000, page: 1, pageSize: 20, ...overrides } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ExpenseAPI.getExpenses).mockResolvedValue(page());
  vi.mocked(ExpenseAPI.getExpenseSuggestions).mockResolvedValue({ data: [] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [crop] });
});

const mountView = async () => {
  const wrapper = mount(ExpensesView);
  await flushPromises();
  return wrapper;
};

test("mỗi khoản một dòng: ngày, nhóm, mô tả, ao hoặc Chung, số tiền; có dòng tổng", async () => {
  const wrapper = await mountView();
  expect(ExpenseAPI.getExpenses).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  const rows = wrapper.findAll(".expense-row");
  expect(rows).toHaveLength(2);
  expect(rows[0].text()).toContain("20/09/2026");
  expect(rows[0].text()).toContain("Cám");
  expect(rows[0].text()).toContain("Cám viên");
  expect(rows[0].text()).toContain("Ao 1");
  expect(rows[0].text()).toContain("3.500.000 đ");
  expect(rows[1].text()).toContain("Chung");
  expect(wrapper.find(".expenses__total").text()).toBe("Tổng: 4.100.000 đ");
});

test("lọc theo Chung / theo vụ", async () => {
  const wrapper = await mountView();
  await chooseOption(wrapper, "#expenseScope", "common");
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenLastCalledWith({ common: 1, page: 1, pageSize: 20 });

  await chooseOption(wrapper, "#expenseScope", "crop:c1");
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenLastCalledWith({ cropId: "c1", page: 1, pageSize: 20 });
  expect(wrapper.find("#expenseScope").text()).toBe("Ao 1 · Vụ 09/2026");
});

test("lọc theo tháng → gửi ngày đầu và cuối tháng", async () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const wrapper = await mountView();
  await chooseOption(wrapper, "#expenseMonth", month);
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenLastCalledWith({
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
    page: 1,
    pageSize: 20,
  });
  expect(wrapper.find("#expenseMonth").text()).toBe(`${month.slice(5)}/${month.slice(0, 4)}`);
});

test("phân trang", async () => {
  vi.mocked(ExpenseAPI.getExpenses).mockResolvedValue(page({ total: 45 }));
  const wrapper = await mountView();
  expect(wrapper.find(".expenses__page").text()).toBe("Trang 1 / 3");
  expect(wrapper.find(".btn-prev-page button").attributes("disabled")).toBeDefined();
  vi.mocked(ExpenseAPI.getExpenses).mockResolvedValue(page({ total: 45, page: 2 }));
  await wrapper.find(".btn-next-page button").trigger("click");
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 });
  expect(wrapper.find(".expenses__page").text()).toBe("Trang 2 / 3");
});

test("＋ Chi phí mở form thêm; lưu mới → tải lại và hiện Hoàn tác; hoàn tác → tải lại", async () => {
  const wrapper = await mountView();
  await wrapper.find(".btn-add-expense button").trigger("click");
  const form = wrapper.findComponent(ExpenseForm);
  expect(form.props("open")).toBe(true);
  expect(form.props("expense")).toBeNull();

  const saved = { _id: "e9", description: "Cám", amount: 1000 };
  form.vm.$emit("saved", { expense: saved, isNew: true });
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenCalledTimes(2);
  expect(wrapper.findComponent(ExpenseForm).props("open")).toBe(false);
  expect(wrapper.findComponent(ExpenseUndoBar).props("expense")).toEqual(saved);

  wrapper.findComponent(ExpenseUndoBar).vm.$emit("undone");
  await flushPromises();
  expect(ExpenseAPI.getExpenses).toHaveBeenCalledTimes(3);
});

test("bấm một dòng → form sửa khoản đó; sửa xong không hiện Hoàn tác", async () => {
  const wrapper = await mountView();
  await wrapper.findAll(".expense-row")[1].trigger("click");
  const form = wrapper.findComponent(ExpenseForm);
  expect(form.props("open")).toBe(true);
  expect(form.props("expense")._id).toBe("e2");
  form.vm.$emit("saved", { expense: { _id: "e2" }, isNew: false });
  await flushPromises();
  expect(wrapper.findComponent(ExpenseUndoBar).props("expense")).toBeNull();
});

test("danh sách trống", async () => {
  vi.mocked(ExpenseAPI.getExpenses).mockResolvedValue(page({ items: [], total: 0, totalAmount: 0 }));
  const wrapper = await mountView();
  expect(wrapper.text()).toContain("Chưa có khoản chi.");
});

test("lỗi tải", async () => {
  vi.mocked(ExpenseAPI.getExpenses).mockRejectedValue(new Error("Mất kết nối"));
  const wrapper = await mountView();
  expect(wrapper.find(".expenses__error").text()).toBe("Không thể tải danh sách khoản chi, vui lòng thử lại sau.");
});

test("điện thoại: thanh trên cùng có nút ＋ Chi phí (không mũi tên), rời trang thì xóa", async () => {
  const { topBarAction } = await import("@/common/topBarAction");
  const original = window.matchMedia;
  window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const wrapper = await mountView();
  expect(topBarAction.label).toBe("＋ Chi phí");
  expect(topBarAction.chevron).toBe(false);
  topBarAction.onClick();
  await flushPromises();
  expect(wrapper.findComponent(ExpenseForm).props("open")).toBe(true);
  wrapper.unmount();
  expect(topBarAction.label).toBe("");
  window.matchMedia = original;
});
