import { reactive } from "vue";

// Nút hành động bên phải thanh trên cùng (điện thoại), do trang đang mở đặt — ví dụ trang Cân đặt nút chọn phiên
export const topBarAction = reactive({ label: "", onClick: null });

/**
 * @param {string} label
 * @param {() => void} onClick
 */
export const setTopBarAction = (label, onClick) => {
  topBarAction.label = label;
  topBarAction.onClick = onClick;
};

export const clearTopBarAction = () => {
  topBarAction.label = "";
  topBarAction.onClick = null;
};
