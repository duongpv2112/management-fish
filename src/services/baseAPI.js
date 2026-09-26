// src/axios.js
import axios from "axios";

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
    // Lấy token từ localStorage hoặc state của ứng dụng
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Server luôn trả HTTP 200 kèm { success, data, message }: coi success === false là lỗi
const handleResponse = (response) => {
  if (response?.data?.success === false) {
    throw new Error(response.data.message || "Có lỗi xảy ra");
  }
  return response;
};

// Xử lý lỗi chung (ví dụ: thông báo lỗi, xử lý 401, 403)
const handleResponseError = (error) => {
  if (!error?.response) {
    // Mất mạng hoặc server không phản hồi: không có error.response
    return Promise.reject(
      new Error("Không thể kết nối đến máy chủ, vui lòng thử lại sau.")
    );
  }
  if (error.response.status === 401) {
    // Ví dụ: Điều hướng đến trang đăng nhập
    // router.push('/login');
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
