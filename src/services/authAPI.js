import { post } from "./baseAPI";

const AuthAPI = {
  // Trả { data: { token, expiresAt } }
  async login(password) {
    return await post("/auth/login", { password });
  },
};

export default AuthAPI;
