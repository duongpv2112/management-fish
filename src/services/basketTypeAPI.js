import { get, post, put, remove } from "../services/baseAPI";

const BasketTypeAPI = {
  // Hàm GET
  async getBasketTypes() {
    try {
      return await get("/basket-types/getBasketTypes");
    } catch (error) {
      throw error;
    }
  },
};

export default BasketTypeAPI;
