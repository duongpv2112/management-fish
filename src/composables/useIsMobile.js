import { getCurrentInstance, onBeforeUnmount, ref } from "vue";

// Dưới 900px là bố cục điện thoại (thẻ, tab dưới, nút Lưu ghim đáy)
export const MOBILE_QUERY = "(max-width: 899.98px)";

/**
 * @returns {import("vue").Ref<boolean>} true khi màn hình hẹp hơn 900px; cập nhật khi đổi kích thước
 */
export const useIsMobile = () => {
  const isMobile = ref(false);
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return isMobile;

  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  isMobile.value = mediaQuery.matches;
  const handleChange = (event) => {
    isMobile.value = event.matches;
  };
  mediaQuery.addEventListener("change", handleChange);

  if (getCurrentInstance()) {
    onBeforeUnmount(() => mediaQuery.removeEventListener("change", handleChange));
  }
  return isMobile;
};
