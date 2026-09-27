import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/expenseCategoryAPI", () => ({ default: { getExpenseCategories: vi.fn() } }));
vi.mock("@/services/cropAPI", () => ({ default: { getCrops: vi.fn() } }));
vi.mock("@/services/expenseAPI", () => ({
  default: {
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    getExpenseSuggestions: vi.fn(),
  },
}));

import ExpenseCategoryAPI from "@/services/expenseCategoryAPI";
import CropAPI from "@/services/cropAPI";
import ExpenseAPI from "@/services/expenseAPI";
import ExpenseForm from "@/views/Expenses/components/ExpenseForm.vue";
import { todayInputValue } from "@/common/dateInput";

const giong = { _id: "giong", categoryName: "Giống", metric: "seed" };
const cam = { _id: "cam", categoryName: "Cám", metric: "feed" };
const dien = { _id: "dien", categoryName: "Điện", metric: "none" };
const openCrop = { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", status: "open", pond: { _id: "p1", pondName: "Ao 1" } };
const closedCrop = { _id: "c0", cropName: "Ao 2 · Vụ 01/2026", status: "closed", pond: { _id: "p2", pondName: "Ao 2" } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(ExpenseCategoryAPI.getExpenseCategories).mockResolvedValue({ data: [giong, cam, dien] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [openCrop] });
  vi.mocked(ExpenseAPI.getExpenseSuggestions).mockResolvedValue({ data: [] });
  vi.mocked(ExpenseAPI.createExpense).mockResolvedValue({ data: { _id: "e9" } });
  vi.mocked(ExpenseAPI.updateExpense).mockResolvedValue({ data: { _id: "e1" } });
  vi.mocked(ExpenseAPI.deleteExpense).mockResolvedValue({ data: {} });
});

// Mở form (open false → true) để form tải nhóm chi, vụ
const mountForm = async (props = {}) => {
  const wrapper = mount(ExpenseForm, { props: { open: false, expense: null, ...props } });
  await wrapper.setProps({ open: true });
  await flushPromises();
  return wrapper;
};

const pick = async (wrapper, gridId, text) => {
  const button = wrapper
    .findAll(`#${gridId} .choice-grid__item`)
    .find((node) => node.find(".choice-grid__text").text() === text);
  await button.trigger("click");
  await flushPromises();
};

const pressed = (wrapper, gridId) => wrapper.find(`#${gridId} [aria-pressed="true"] .choice-grid__text`);
const saveButton = (wrapper) => wrapper.find(".btn-expense-save button");

test("lưới nhóm chi và lưới ao; chọn sẵn theo defaultCropId", async () => {
  let wrapper = await mountForm({ defaultCropId: "c1" });
  expect(wrapper.findAll("#expenseCategory .choice-grid__text").map((n) => n.text())).toEqual(["Giống", "Cám", "Điện"]);
  expect(wrapper.findAll("#expenseCrop .choice-grid__text").map((n) => n.text())).toEqual(["Ao 1", "Chung"]);
  expect(pressed(wrapper, "expenseCrop").text()).toBe("Ao 1");
  expect(CropAPI.getCrops).toHaveBeenCalledWith();

  wrapper = await mountForm({ defaultCropId: null });
  expect(pressed(wrapper, "expenseCrop").text()).toBe("Chung");
});

test("nút Lưu khóa khi chưa có nhóm hoặc số tiền ≤ 0", async () => {
  const wrapper = await mountForm({ defaultCropId: null });
  expect(saveButton(wrapper).attributes("disabled")).toBeDefined();
  await pick(wrapper, "expenseCategory", "Điện");
  expect(saveButton(wrapper).attributes("disabled")).toBeDefined();
  await wrapper.find("#expense-amount").setValue("0");
  expect(saveButton(wrapper).attributes("disabled")).toBeDefined();
  await wrapper.find("#expense-amount").setValue("600.000");
  expect(saveButton(wrapper).attributes("disabled")).toBeUndefined();
});

test("số lượng × đơn giá → tự tính, ẩn ô số tiền; lưu gửi đủ trường", async () => {
  const wrapper = await mountForm({ defaultCropId: "c1" });
  await pick(wrapper, "expenseCategory", "Giống");
  await wrapper.find("#expense-description").setValue(" Cá trắm giống ");
  await wrapper.find("#expense-quantity").setValue("10");
  await wrapper.find("#expense-unit").setValue("con");
  await wrapper.find("#expense-unitPrice").setValue("350.000");
  expect(wrapper.find(".expense-form__auto-amount").text()).toContain("3.500.000 đ");
  expect(wrapper.find("#expense-amount").exists()).toBe(false);

  await saveButton(wrapper).trigger("click");
  await flushPromises();
  expect(ExpenseAPI.createExpense).toHaveBeenCalledWith({
    categoryId: "giong",
    cropId: "c1",
    date: todayInputValue(),
    description: "Cá trắm giống",
    quantity: 10,
    unit: "con",
    unitPrice: 350000,
    kgPerUnit: null,
    amount: 3500000,
    note: "",
  });
  expect(wrapper.emitted("saved")).toEqual([[{ expense: { _id: "e9" }, isNew: true }]]);
});

test("chỉ nhập số tiền → khoản chung, quantity/unitPrice null", async () => {
  const wrapper = await mountForm({ defaultCropId: null });
  await pick(wrapper, "expenseCategory", "Điện");
  await wrapper.find("#expense-amount").setValue("600.000");
  await saveButton(wrapper).trigger("click");
  await flushPromises();
  expect(ExpenseAPI.createExpense).toHaveBeenCalledWith(
    expect.objectContaining({ categoryId: "dien", cropId: null, amount: 600000, quantity: null, unitPrice: null })
  );
});

test("nhóm Cám: điền sẵn đơn vị từ gợi ý, hiện ô kg/đơn vị; nhóm Điện không có ô này", async () => {
  vi.mocked(ExpenseAPI.getExpenseSuggestions).mockResolvedValue({
    data: [{ description: "Cám viên", unit: "bao", unitPrice: 350000, kgPerUnit: 25 }],
  });
  const wrapper = await mountForm({ defaultCropId: "c1" });
  await pick(wrapper, "expenseCategory", "Cám");
  expect(ExpenseAPI.getExpenseSuggestions).toHaveBeenCalledWith("cam");
  expect(wrapper.find("#expense-unit").element.value).toBe("bao");
  expect(wrapper.find("#expense-kgPerUnit").exists()).toBe(true);
  expect(wrapper.text()).toContain("kg / 1 bao");

  await wrapper.find("#expense-unit").setValue("kg");
  expect(wrapper.find("#expense-kgPerUnit").exists()).toBe(false);

  await pick(wrapper, "expenseCategory", "Điện");
  await wrapper.find("#expense-unit").setValue("bao");
  expect(wrapper.find("#expense-kgPerUnit").exists()).toBe(false);
});

test("chọn gợi ý mô tả → điền mô tả, đơn vị, đơn giá, kg/bao", async () => {
  vi.mocked(ExpenseAPI.getExpenseSuggestions).mockResolvedValue({
    data: [
      { description: "Cám viên", unit: "bao", unitPrice: 350000, kgPerUnit: 25 },
      { description: "Cám bột", unit: "kg", unitPrice: 12000, kgPerUnit: null },
    ],
  });
  const wrapper = await mountForm({ defaultCropId: "c1" });
  await pick(wrapper, "expenseCategory", "Cám");
  await wrapper.find("#expense-description").setValue("vien");
  const suggestions = wrapper.findAll(".expense-form__suggestion");
  expect(suggestions.map((n) => n.text())).toEqual(["Cám viên"]);
  await suggestions[0].trigger("click");
  expect(wrapper.find("#expense-description").element.value).toBe("Cám viên");
  expect(wrapper.find("#expense-unit").element.value).toBe("bao");
  expect(wrapper.find("#expense-unitPrice").element.value).toBe("350.000");
  expect(wrapper.find("#expense-kgPerUnit").element.value).toBe("25");
});

test("sửa khoản chi của vụ đã kết thúc: vẫn chọn đúng vụ đó; lưu gọi updateExpense", async () => {
  const expense = {
    _id: "e1",
    date: "2026-06-15T00:00:00.000Z",
    category: cam,
    crop: closedCrop,
    description: "Cám cũ",
    quantity: 2,
    unit: "bao",
    unitPrice: 300000,
    kgPerUnit: 25,
    amount: 600000,
    note: "",
  };
  const wrapper = await mountForm({ expense });
  expect(wrapper.findAll("#expenseCrop .choice-grid__text").map((n) => n.text())).toEqual(["Ao 1", "Ao 2", "Chung"]);
  expect(pressed(wrapper, "expenseCrop").text()).toBe("Ao 2");
  expect(pressed(wrapper, "expenseCategory").text()).toBe("Cám");
  expect(wrapper.find("#expense-date").element.value).toBe("2026-06-15");

  await saveButton(wrapper).trigger("click");
  await flushPromises();
  expect(ExpenseAPI.updateExpense).toHaveBeenCalledWith(
    "e1",
    expect.objectContaining({ cropId: "c0", categoryId: "cam", quantity: 2, unitPrice: 300000, kgPerUnit: 25, amount: 600000, date: "2026-06-15" })
  );
  expect(wrapper.emitted("saved")[0][0].isNew).toBe(false);
});

test("xóa khoản chi: hỏi xác nhận rồi xóa", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  const expense = { _id: "e1", date: "2026-09-01T00:00:00.000Z", category: dien, crop: null, amount: 1000, quantity: null, unitPrice: null, kgPerUnit: null, unit: "", description: "", note: "" };
  const wrapper = await mountForm({ expense });
  expect(pressed(wrapper, "expenseCrop").text()).toBe("Chung");
  await wrapper.find(".btn-expense-delete button").trigger("click");
  await flushPromises();
  expect(confirmSpy).toHaveBeenCalledWith("Xóa khoản chi này?");
  expect(ExpenseAPI.deleteExpense).toHaveBeenCalledWith("e1");
  expect(wrapper.emitted("deleted")).toEqual([[expense]]);
});

test("thêm mới không có nút Xóa", async () => {
  const wrapper = await mountForm({ defaultCropId: null });
  expect(wrapper.find(".btn-expense-delete").exists()).toBe(false);
});

test("lỗi server → hiện message, không emit", async () => {
  vi.mocked(ExpenseAPI.createExpense).mockRejectedValue(new Error("Số tiền phải lớn hơn 0!"));
  const wrapper = await mountForm({ defaultCropId: null });
  await pick(wrapper, "expenseCategory", "Điện");
  await wrapper.find("#expense-amount").setValue("1");
  await saveButton(wrapper).trigger("click");
  await flushPromises();
  expect(wrapper.find(".expense-form__error").text()).toBe("Số tiền phải lớn hơn 0!");
  expect(wrapper.emitted("saved")).toBeUndefined();
});

test("thêm từ vụ đã kết thúc (defaultCropId) → vụ đó có trong lưới và được chọn", async () => {
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [openCrop, closedCrop] });
  const wrapper = await mountForm({ defaultCropId: "c0" });
  expect(wrapper.findAll("#expenseCrop .choice-grid__text").map((n) => n.text())).toEqual(["Ao 1", "Ao 2", "Chung"]);
  expect(pressed(wrapper, "expenseCrop").text()).toBe("Ao 2");
});

test("vụ đã kết thúc khác không hiện trong lưới khi thêm mới", async () => {
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [openCrop, closedCrop] });
  const wrapper = await mountForm({ defaultCropId: null });
  expect(wrapper.findAll("#expenseCrop .choice-grid__text").map((n) => n.text())).toEqual(["Ao 1", "Chung"]);
});

test.each([
  ["5.000", 5000],
  ["12.500", 12500],
  ["2,5", 2.5],
  ["1.5", 1.5],
])('số lượng "%s" → %s', async (text, expected) => {
  const wrapper = await mountForm({ defaultCropId: null });
  await pick(wrapper, "expenseCategory", "Giống");
  await wrapper.find("#expense-quantity").setValue(text);
  await wrapper.find("#expense-unitPrice").setValue("800");
  await saveButton(wrapper).trigger("click");
  await flushPromises();
  expect(ExpenseAPI.createExpense).toHaveBeenCalledWith(
    expect.objectContaining({ quantity: expected, amount: Math.round(expected * 800) })
  );
});

test("sửa khoản chi có nhóm chi đã xóa → nhóm đó vẫn hiện và được chọn", async () => {
  const deletedCategory = { _id: "old", categoryName: "Xăng dầu", metric: "none" };
  const expense = { _id: "e1", date: "2026-09-01T00:00:00.000Z", category: deletedCategory, crop: null, amount: 1000, quantity: null, unitPrice: null, kgPerUnit: null, unit: "", description: "", note: "" };
  const wrapper = await mountForm({ expense });
  expect(pressed(wrapper, "expenseCategory").text()).toBe("Xăng dầu");
});

test("thêm từ vụ đã kết thúc: đổi sang Chung rồi vẫn chọn lại được vụ đó", async () => {
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [openCrop, closedCrop] });
  const wrapper = await mountForm({ defaultCropId: "c0" });
  await pick(wrapper, "expenseCrop", "Chung");
  expect(wrapper.findAll("#expenseCrop .choice-grid__text").map((n) => n.text())).toContain("Ao 2");
});
