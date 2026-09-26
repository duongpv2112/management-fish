import { post, put, remove } from "./baseAPI";

const FishWeightAPI = {
  async saveFishWeight(data) {
    return await post("/fish-weights/createFishWeights", data);
  },

  async updateFishWeight(id, data) {
    return await put(`/fish-weights/updateFishWeights/${id}`, data);
  },

  async deleteFishWeight(id) {
    return await remove(`/fish-weights/deleteFishWeights/${id}`);
  },
};

export default FishWeightAPI;
