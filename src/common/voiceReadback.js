import { ref } from "vue";

// Công tắc "Đọc xác nhận" khi nhập bằng giọng nói: mặc định bật, nhớ trong localStorage.
// Dùng chung giữa ô tick trên máy tính (VoiceInput) và mục trong menu ☰ trên điện thoại (AppTopBar).
const STORAGE_KEY = "voiceReadback";

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

export const isVoiceReadbackOn = ref(readStored());

// Đọc lại từ localStorage (gọi khi component dựng, phòng khi giá trị đổi ở tab khác)
export const loadVoiceReadback = () => {
  isVoiceReadbackOn.value = readStored();
};

export const setVoiceReadback = (value) => {
  isVoiceReadbackOn.value = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Trình duyệt chặn localStorage: chỉ nhớ trong phiên hiện tại
  }
};
