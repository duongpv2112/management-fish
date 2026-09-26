/**
 * Xếp hạng lựa chọn (loại cá/giỏ) cho lưới "hay cân":
 * 1. số lần cân trong phiên đang chọn (nhiều trước),
 * 2. vị trí trong danh sách dùng gần đây (gần đây trước),
 * 3. thứ tự gốc trong danh mục.
 * @param {{ items: object[], valueField: string, sessionCounts?: Record<string, number>, recentIds?: string[] }} options
 * @returns {string[]} id đã xếp hạng (chỉ gồm id có trong items)
 */
export const rankChoices = ({ items, valueField, sessionCounts = {}, recentIds = [] }) =>
  (items ?? [])
    .map((item, catalogIndex) => {
      const id = item[valueField];
      const recentIndex = recentIds.indexOf(id);
      return {
        id,
        count: sessionCounts[id] ?? 0,
        recentIndex: recentIndex === -1 ? Infinity : recentIndex,
        catalogIndex,
      };
    })
    .sort(
      (a, b) =>
        b.count - a.count || a.recentIndex - b.recentIndex || a.catalogIndex - b.catalogIndex
    )
    .map((entry) => entry.id);
