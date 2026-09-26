// src/axios.js
import axios from "axios";
import { clearSession, getToken } from "@/common/auth";

// Tạo instance của axios
const instance = axios.create({
  baseURL: window.config?.BaseApi || "https://management-fish.vercel.app/api", // URL gốc cho các yêu cầu
  timeout: 10000, // Thời gian chờ cho mỗi yêu cầu
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm một bộ interceptor để thêm token vào tất cả các yêu cầu nếu cần
instance.interceptors.request.use(
  (config) => {
    // Token đăng nhập còn hạn (xem common/auth.js)
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lỗi nghiệp vụ trả HTTP 200 kèm { success: false, message }: coi là lỗi
const handleResponse = (response) => {
  if (response?.data?.success === false) {
    throw new Error(response.data.message || "Có lỗi xảy ra");
  }
  return response;
};

// Hết phiên đăng nhập: xóa token và chuyển sang trang đăng nhập, sau đó quay lại đúng trang cũ.
// Import router lúc cần để tránh vòng import router → views → services → baseAPI → router
const redirectToLogin = async () => {
  clearSession();
  const { default: router } = await import("@/router");
  const current = router.currentRoute.value;
  if (current?.name === "login") return;
  router.push({ name: "login", query: { redirect: current?.fullPath ?? "/", expired: "1" } });
};

// Xử lý lỗi chung (ví dụ: thông báo lỗi, xử lý 401, 403)
const handleResponseError = async (error) => {
  if (!error?.response) {
    // Mất mạng hoặc server không phản hồi: không có error.response
    return Promise.reject(
      new Error("Không thể kết nối đến máy chủ, vui lòng thử lại sau.")
    );
  }
  // 401 của API đăng nhập là sai mật khẩu, không phải hết phiên
  const isLoginRequest = error.config?.url?.includes("/auth/login");
  if (error.response.status === 401 && !isLoginRequest) {
    await redirectToLogin();
  }
  return Promise.reject(
    new Error(
      error.response.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau."
    )
  );
};

// Xử lý các phản hồi và lỗi
instance.interceptors.response.use(handleResponse, handleResponseError);

// Hàm GET
const get = async (url, config = {}) => {
  try {
    const response = await instance.get(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hàm POST
const post = async (url, data, config = {}) => {
  try {
    const response = await instance.post(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hàm PUT
const put = async (url, data, config = {}) => {
  try {
    const response = await instance.put(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hàm DELETE
const remove = async (url, config = {}) => {
  try {
    const response = await instance.delete(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { get, post, put, remove, handleResponse, handleResponseError };
