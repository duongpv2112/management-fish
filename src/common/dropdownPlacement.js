// Chọn hướng mở danh sách thả xuống sao cho không tràn khỏi màn hình.
// horizontal: "end" = căn mép phải với ô (danh sách mở sang trái, mặc định), "start" = căn mép trái (mở sang phải)
// vertical: "down" (mặc định) | "up"
// maxWidth / maxHeight: null khi đủ chỗ; khi hai phía đều thiếu thì là chỗ trống của phía rộng hơn

/**
 * @param {{
 *   trigger: { left: number, right: number, top: number, bottom: number },
 *   list: { width: number, height: number },
 *   viewport: { width: number, height: number },
 *   gap?: number,
 *   margin?: number,
 * }} params gap: khoảng cách ô ↔ danh sách; margin: chừa mép màn hình
 * @returns {{ horizontal: "start"|"end", vertical: "down"|"up", maxWidth: number|null, maxHeight: number|null }}
 */
export const computeDropdownPlacement = ({ trigger, list, viewport, gap = 4, margin = 8 }) => {
  // Chưa đo được (chưa hiển thị, môi trường test): giữ mặc định
  if (!list.width || !list.height) return { horizontal: "end", vertical: "down", maxWidth: null, maxHeight: null };

  let horizontal = "end";
  let maxWidth = null;
  const spaceEnd = trigger.right - margin;
  const spaceStart = viewport.width - margin - trigger.left;
  if (list.width > spaceEnd) {
    if (list.width <= spaceStart) {
      horizontal = "start";
    } else {
      horizontal = spaceStart > spaceEnd ? "start" : "end";
      maxWidth = Math.max(spaceStart, spaceEnd);
    }
  }

  let vertical = "down";
  let maxHeight = null;
  const spaceBelow = viewport.height - margin - trigger.bottom - gap;
  const spaceAbove = trigger.top - gap - margin;
  if (list.height > spaceBelow) {
    if (list.height <= spaceAbove) {
      vertical = "up";
    } else {
      vertical = spaceAbove > spaceBelow ? "up" : "down";
      maxHeight = Math.max(spaceAbove, spaceBelow);
    }
  }

  return { horizontal, vertical, maxWidth, maxHeight };
};
