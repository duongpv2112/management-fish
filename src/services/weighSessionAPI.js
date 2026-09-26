import { get, post, put } from "./baseAPI";

const WeighSessionAPI = {
  async getWeighSessions() {
    return await get("/weigh-sessions/getWeighSessions");
  },

  async getOpenWeighSession() {
    return await get("/weigh-sessions/getOpenWeighSession");
  },

  async createWeighSession(data) {
    return await post("/weigh-sessions/createWeighSessions", data);
  },

  async closeWeighSession(id) {
    return await put(`/weigh-sessions/closeWeighSessions/${id}`);
  },

  async updateSessionPrices(id, prices) {
    return await put(`/weigh-sessions/updateSessionPrices/${id}`, { prices });
  },

  async getSessionSummary(id) {
    return await get(`/weigh-sessions/getSessionSummary/${id}`);
  },
};

export default WeighSessionAPI;
