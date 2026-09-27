import { get, post, put, remove } from "./baseAPI";

const ExpenseCategoryAPI = {
  async getExpenseCategories() {
    return await get("/expense-categories/getExpenseCategories");
  },

  // data: { categoryName, metric: "seed" | "feed" | "none" }
  async createExpenseCategory(data) {
    return await post("/expense-categories/createExpenseCategories", data);
  },

  async updateExpenseCategory(id, data) {
    return await put(`/expense-categories/updateExpenseCategories/${id}`, data);
  },

  async deleteExpenseCategory(id) {
    return await remove(`/expense-categories/deleteExpenseCategories/${id}`);
  },
};

export default ExpenseCategoryAPI;
