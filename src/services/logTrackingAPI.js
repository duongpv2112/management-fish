import { get } from "./baseAPI";

const LogTrackingAPI = {
  // Trả { data: { items, total, page, pageSize } }, mới nhất trước
  async getLogTrackings({ fishType, page, pageSize } = {}) {
    return await get("/log-trackings/getLogTrackings", {
      params: { fishType: fishType || undefined, page, pageSize },
    });
  },
};

export default LogTrackingAPI;
