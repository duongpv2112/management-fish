// Loại cá/giỏ dùng gần đây trên máy này (localStorage), dùng để xếp hạng lưới "hay cân"
export const RECENT_FISH_KEY = "recentFishTypes";
export const RECENT_BASKET_KEY = "recentBasketTypes";

const MAX_RECENT = 20;

/**
 * @param {string} key
 * @returns {string[]} id mới nhất trước; lỗi đọc hoặc dữ liệu hỏng → []
 */
export const getRecent = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

/**
 * Đưa id lên đầu danh sách (bỏ trùng, tối đa 20). Không ném lỗi khi không ghi được.
 * @param {string} key
 * @param {string} id
 * @returns {string[]} danh sách mới
 */
export const pushRecent = (key, id) => {
  const recent = [id, ...getRecent(key).filter((item) => item !== id)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(key, JSON.stringify(recent));
  } catch {
    // localStorage đầy hoặc bị chặn: chỉ mất phần "dùng gần đây"
  }
  return recent;
};
