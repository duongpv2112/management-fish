import { get, post, put, remove } from "./baseAPI";

const ExpenseAPI = {
  // params: { cropId?, common?: 1, categoryId?, from?, to?: "YYYY-MM-DD", page?, pageSize? }
  // → data: { items, total, totalAmount, page, pageSize }
  async getExpenses(params = {}) {
    return await get("/expenses/getExpenses", { params });
  },

  // data: { date?, categoryId, cropId? (null = chung), description?, quantity?, unit?, unitPrice?, kgPerUnit?, amount?, note? }
  async createExpense(data) {
    return await post("/expenses/createExpenses", data);
  },

  async updateExpense(id, data) {
    return await put(`/expenses/updateExpenses/${id}`, data);
  },

  async deleteExpense(id) {
    return await remove(`/expenses/deleteExpenses/${id}`);
  },

  // → data: [{ description, unit, unitPrice, kgPerUnit }], mới nhất trước
  async getExpenseSuggestions(categoryId) {
    return await get("/expenses/getExpenseSuggestions", { params: { categoryId } });
  },
};

export default ExpenseAPI;
