import { reactive } from "vue";

// Nút hành động bên phải thanh trên cùng (điện thoại), do trang đang mở đặt — ví dụ trang Cân đặt nút chọn phiên.
// chevron: hiện "▾" khi nút mở danh sách chọn; nút thêm mới ("＋ Chi phí") thì tắt
export const topBarAction = reactive({ label: "", onClick: null, chevron: true });

/**
 * @param {string} label
 * @param {() => void} onClick
 * @param {{ chevron?: boolean }} [options]
 */
export const setTopBarAction = (label, onClick, { chevron = true } = {}) => {
  topBarAction.label = label;
  topBarAction.onClick = onClick;
  topBarAction.chevron = chevron;
};

export const clearTopBarAction = () => {
  topBarAction.label = "";
  topBarAction.onClick = null;
  topBarAction.chevron = true;
};
