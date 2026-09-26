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

  // Khi in, trình duyệt đo media query theo khổ giấy (A4 dọc < 900px) → không được đổi bố cục giữa lúc in,
  // nếu không bảng tiền trên máy tính bị gỡ và phiếu in ra trang trắng
  let isPrinting = false;
  const handleChange = (event) => {
    if (!isPrinting) isMobile.value = event.matches;
  };
  const handleBeforePrint = () => {
    isPrinting = true;
  };
  const handleAfterPrint = () => {
    isPrinting = false;
    isMobile.value = mediaQuery.matches;
  };

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    });
  }
  return isMobile;
};
