import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

import { computeDropdownPlacement } from "@/common/dropdownPlacement";

const DEFAULT_PLACEMENT = { horizontal: "end", vertical: "down", maxWidth: null, maxHeight: null };

/**
 * Tự chọn hướng mở danh sách thả xuống (trái/phải, lên/xuống) theo chỗ trống trên màn hình.
 * Tính lại mỗi lần mở và khi đổi cỡ màn hình / cuộn trang trong lúc đang mở.
 * @param {import("vue").Ref<HTMLElement|null>} anchorRef ô bấm để mở
 * @param {import("vue").Ref<HTMLElement|null>} listRef danh sách
 * @param {import("vue").Ref<boolean>} isOpen
 */
export const useDropdownPlacement = (anchorRef, listRef, isOpen) => {
  const placement = ref({ ...DEFAULT_PLACEMENT });

  const update = async () => {
    // Bỏ giới hạn cũ trước khi đo để lấy kích thước thật của danh sách
    placement.value = { ...DEFAULT_PLACEMENT };
    await nextTick();
    if (!isOpen.value || !anchorRef.value || !listRef.value) return;
    const trigger = anchorRef.value.getBoundingClientRect();
    const list = listRef.value.getBoundingClientRect();
    placement.value = computeDropdownPlacement({
      trigger,
      list: { width: list.width, height: list.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  };

  let isListening = false;
  const startListening = () => {
    if (isListening) return;
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    isListening = true;
  };
  const stopListening = () => {
    if (!isListening) return;
    window.removeEventListener("resize", update);
    window.removeEventListener("scroll", update, true);
    isListening = false;
  };

  watch(
    isOpen,
    (open) => {
      if (open) {
        update();
        startListening();
      } else {
        stopListening();
        placement.value = { ...DEFAULT_PLACEMENT };
      }
    },
    { flush: "post" }
  );

  onBeforeUnmount(stopListening);

  // Style giới hạn kích thước khi cả hai phía đều thiếu chỗ (cuộn trong danh sách)
  const placementStyle = computed(() => ({
    ...(placement.value.maxWidth !== null ? { maxWidth: `${placement.value.maxWidth}px` } : {}),
    ...(placement.value.maxHeight !== null ? { maxHeight: `${placement.value.maxHeight}px`, overflowY: "auto" } : {}),
  }));

  return { placement, placementStyle, update };
};
