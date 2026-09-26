import { get, post, put, remove } from "../services/baseAPI";

const FishTypeAPI = {
  // Hàm GET
  async getFishTypes() {
    return await get("/fish-types/getFishTypes");
  },

  // Không truyền sessionId thì server lấy phiên đang mở
  async getDataFish(sessionId) {
    return await get("/fish-types/getDataFish", sessionId ? { params: { sessionId } } : {});
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
