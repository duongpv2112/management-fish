import { get, post, put, remove } from "./baseAPI";

const FishWeightAPI = {
  // Hàm GET
  async saveFishWeight(data) {
    try {
      return await post("/fish-weights/createFishWeights", data);
    } catch (error) {
      throw error;
    }
  },
};

export default FishWeightAPI;
