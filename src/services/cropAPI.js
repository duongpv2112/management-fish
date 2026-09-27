import { get, post, put, remove } from "./baseAPI";

const CropAPI = {
  // params: { pondId?, status?: "open" | "closed" }; vụ đang nuôi đứng trước, kèm thông tin ao
  async getCrops(params = {}) {
    return await get("/crops/getCrops", { params });
  },

  // data: { pondId, cropName?, startDate?: "YYYY-MM-DD", note? }
  async createCrop(data) {
    return await post("/crops/createCrops", data);
  },

  async updateCrop(id, data) {
    return await put(`/crops/updateCrops/${id}`, data);
  },

  // data: { endDate?: "YYYY-MM-DD" } (mặc định hôm nay)
  async closeCrop(id, data = {}) {
    return await put(`/crops/closeCrops/${id}`, data);
  },

  async reopenCrop(id) {
    return await put(`/crops/reopenCrops/${id}`);
  },

  // → data: { crop, revenue, expense, profit, metrics } (xem getCropReport ở BE)
  async getCropReport(id) {
    return await get(`/crops/getCropReport/${id}`);
  },

  async deleteCrop(id) {
    return await remove(`/crops/deleteCrops/${id}`);
  },
};

export default CropAPI;
