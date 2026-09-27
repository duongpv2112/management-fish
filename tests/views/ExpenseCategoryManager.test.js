import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { chooseOption } from "../helpers/select";

vi.mock("@/services/expenseCategoryAPI", () => ({
  default: {
    getExpenseCategories: vi.fn(),
    createExpenseCategory: vi.fn(),
    updateExpenseCategory: vi.fn(),
    deleteExpenseCategory: vi.fn(),
  },
}));

import ExpenseCategoryAPI from "@/services/expenseCategoryAPI";
import ExpenseCategoryManager from "@/views/Catalog/components/ExpenseCategoryManager.vue";

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(ExpenseCategoryAPI.getExpenseCategories).mockResolvedValue({
    data: [{ _id: "cam", categoryName: "Cám", metric: "feed" }],
  });
  vi.mocked(ExpenseCategoryAPI.createExpenseCategory).mockResolvedValue({ data: {} });
  vi.mocked(ExpenseCategoryAPI.updateExpenseCategory).mockResolvedValue({ data: {} });
});

const mountManager = async () => {
  const wrapper = mount(ExpenseCategoryManager);
  await flushPromises();
  return wrapper;
};

const clickAdd = async (wrapper) => {
  await wrapper.find(".catalog-add .catalog-add__button button").trigger("click");
  await flushPromises();
};

test("tiêu đề, cột và nhãn Dùng để tính", async () => {
  const wrapper = await mountManager();
  expect(wrapper.find("h2").text()).toBe("Nhóm chi");
  expect(wrapper.find("thead").text()).toContain("Tên nhóm chi");
  expect(wrapper.find("thead").text()).toContain("Dùng để tính");
  expect(wrapper.find("tbody tr").text()).toContain("Thức ăn");
  expect(wrapper.find("tbody tr").text()).not.toContain("feed");
});

test("thêm nhóm không đổi ô chọn → metric none", async () => {
  const wrapper = await mountManager();
  await wrapper.find("#expenseCategory-new-categoryName").setValue("Xăng dầu");
  await clickAdd(wrapper);
  expect(ExpenseCategoryAPI.createExpenseCategory).toHaveBeenCalledWith({ categoryName: "Xăng dầu", metric: "none" });
});

test("chọn Giống → gửi metric seed", async () => {
  const wrapper = await mountManager();
  await wrapper.find("#expenseCategory-new-categoryName").setValue("Giống rô");
  await chooseOption(wrapper, "#expenseCategory-new-metric", "seed");
  await clickAdd(wrapper);
  expect(ExpenseCategoryAPI.createExpenseCategory).toHaveBeenCalledWith({ categoryName: "Giống rô", metric: "seed" });
});

test("sửa dòng → ô chọn hiện giá trị đang có; lưu gửi metric", async () => {
  const wrapper = await mountManager();
  await wrapper.find(".btn-edit button").trigger("click");
  expect(wrapper.find("#expenseCategory-edit-metric").text()).toBe("Thức ăn");
  await chooseOption(wrapper, "#expenseCategory-edit-metric", "none");
  await wrapper.find(".btn-save button").trigger("click");
  await flushPromises();
  expect(ExpenseCategoryAPI.updateExpenseCategory).toHaveBeenCalledWith("cam", { categoryName: "Cám", metric: "none" });
});

test("lỗi server hiện nguyên văn", async () => {
  vi.mocked(ExpenseCategoryAPI.createExpenseCategory).mockRejectedValue(new Error("Tên nhóm chi đã tồn tại!"));
  const wrapper = await mountManager();
  await wrapper.find("#expenseCategory-new-categoryName").setValue("Cám");
  await clickAdd(wrapper);
  expect(wrapper.find(".error-message").text()).toBe("Tên nhóm chi đã tồn tại!");
});
