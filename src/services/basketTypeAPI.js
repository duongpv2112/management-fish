import { get, post, put, remove } from "../services/baseAPI";

const BasketTypeAPI = {
  // Hàm GET
  async getBasketTypes() {
    return await get("/basket-types/getBasketTypes");
  },

  async createBasketType(data) {
    return await post("/basket-types/createBasketTypes", data);
  },

  async updateBasketType(id, data) {
    return await put(`/basket-types/updateBasketTypes/${id}`, data);
  },

  async deleteBasketType(id) {
    return await remove(`/basket-types/deleteBasketTypes/${id}`);
  },
};

export default BasketTypeAPI;
