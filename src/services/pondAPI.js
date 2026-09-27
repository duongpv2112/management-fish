import { get, post, put, remove } from "./baseAPI";

const PondAPI = {
  async getPonds() {
    return await get("/ponds/getPonds");
  },

  async createPond(data) {
    return await post("/ponds/createPonds", data);
  },

  async updatePond(id, data) {
    return await put(`/ponds/updatePonds/${id}`, data);
  },

  async deletePond(id) {
    return await remove(`/ponds/deletePonds/${id}`);
  },
};

export default PondAPI;
