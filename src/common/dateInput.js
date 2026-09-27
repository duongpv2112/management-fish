// Ngày lịch cho ô <input type="date"> và ngày vụ nuôi từ API (server lưu 00:00 UTC của ngày lịch)

const pad = (value) => String(value).padStart(2, "0");

/**
 * Hôm nay theo giờ máy, dạng "YYYY-MM-DD"
 * @returns {string}
 */
export const todayInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// "YYYY-MM-DD" hoặc ISO từ API → số ngày kể từ epoch (theo ngày lịch, không theo giờ)
const dayNumber = (value) => {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
};

/**
 * Số ngày theo lịch từ start đến end (mặc định hôm nay), tối thiểu 0
 * @param {string} start "YYYY-MM-DD" hoặc ISO
 * @param {string} [end]
 * @returns {number}
 */
export const daysBetween = (start, end = todayInputValue()) => Math.max(0, dayNumber(end) - dayNumber(start));

/**
 * "DD/MM/YYYY" của ngày vụ nuôi từ API; đọc phần ngày để không lệch múi giờ
 * @param {string|null|undefined} value
 * @returns {string}
 */
export const formatDateOnly = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};
