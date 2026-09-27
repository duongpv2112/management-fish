import { vi } from "vitest";

// jsdom không tính bố cục: giả lập getBoundingClientRect theo class của phần tử.
// rects: { "<class>": { left, top, width, height } }; phần tử khác trả về 0.
export const mockRects = (rects) =>
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    const key = Object.keys(rects).find((name) => this.classList.contains(name));
    const { left = 0, top = 0, width = 0, height = 0 } = key ? rects[key] : {};
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} };
  });
