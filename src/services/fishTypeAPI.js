import { get, post, put, remove } from "../services/baseAPI";

const FishTypeAPI = {
  // Hàm GET
  async getFishTypes() {
    return await get("/fish-types/getFishTypes");
  },

  async getDataFish() {
    return await get("/fish-types/getDataFish");
  },

  async createFishType(data) {
    return await post("/fish-types/createFishTypes", data);
  },

  async updateFishType(id, data) {
    return await put(`/fish-types/updateFishTypes/${id}`, data);
  },

  async deleteFishType(id) {
    return await remove(`/fish-types/deleteFishTypes/${id}`);
  },
};

export default FishTypeAPI;
