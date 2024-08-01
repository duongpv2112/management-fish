import { get, post, put, remove } from "../services/baseAPI";

const FishTypeAPI = {
  // Hàm GET
  async getFishTypes() {
    try {
      return await get("/fish-types/getFishTypes");
    } catch (error) {
      throw error;
    }
  },

  async getDataFish() {
    try {
      return await get("/fish-types/getDataFish");
    } catch (error) {
      throw error;
    }
  },
};

export default FishTypeAPI;
