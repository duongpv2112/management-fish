import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/expenseAPI", () => ({ default: { deleteExpense: vi.fn() } }));

import ExpenseAPI from "@/services/expenseAPI";
import ExpenseUndoBar from "@/views/Expenses/components/ExpenseUndoBar.vue";

const expense = { _id: "e1", description: "Cám viên", amount: 3500000 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  vi.mocked(ExpenseAPI.deleteExpense).mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

test("không có khoản chi → không hiện gì", () => {
  const wrapper = mount(ExpenseUndoBar, { props: { expense: null } });
  expect(wrapper.find(".expense-undo").exists()).toBe(false);
});

test("hiện mô tả và số tiền; bấm Hoàn tác → xóa và emit undone", async () => {
  const wrapper = mount(ExpenseUndoBar, { props: { expense: null } });
  await wrapper.setProps({ expense });
  expect(wrapper.find(".expense-undo").text()).toContain("Đã lưu Cám viên · 3.500.000 đ");
  await wrapper.find(".btn-expense-undo").trigger("click");
  await flushPromises();
  expect(ExpenseAPI.deleteExpense).toHaveBeenCalledWith("e1");
  expect(wrapper.emitted("undone")).toHaveLength(1);
  expect(wrapper.find(".expense-undo").exists()).toBe(false);
});

test("không có mô tả → 'khoản chi'", async () => {
  const wrapper = mount(ExpenseUndoBar, { props: { expense: null } });
  await wrapper.setProps({ expense: { _id: "e2", description: "", amount: 600000 } });
  expect(wrapper.find(".expense-undo").text()).toContain("Đã lưu khoản chi · 600.000 đ");
});

test("sau 10 giây tự ẩn và emit expired", async () => {
  const wrapper = mount(ExpenseUndoBar, { props: { expense: null } });
  await wrapper.setProps({ expense });
  vi.advanceTimersByTime(9999);
  await flushPromises();
  expect(wrapper.find(".expense-undo").exists()).toBe(true);
  vi.advanceTimersByTime(1);
  await flushPromises();
  expect(wrapper.find(".expense-undo").exists()).toBe(false);
  expect(wrapper.emitted("expired")).toHaveLength(1);
});
