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

/**
 * Đọc ngày người dùng gõ theo kiểu Việt Nam: "27/09/2026", "1/9/2026", "1-9-26", "1.9.2026", "27092026".
 * Năm 2 chữ số hiểu là 20xx.
 * @param {string} text
 * @returns {string|null} "YYYY-MM-DD"; "" khi ô trống; null khi sai hoặc chưa đủ
 */
export const parseDateText = (text) => {
  const value = String(text ?? "").trim();
  if (!value) return "";
  let parts = value.split(/[/.\-\s]+/);
  if (parts.length === 1 && /^\d{8}$/.test(value)) {
    parts = [value.slice(0, 2), value.slice(2, 4), value.slice(4)];
  }
  if (parts.length !== 3 || !parts.every((part) => /^\d+$/.test(part))) return null;
  const [dayText, monthText, yearText] = parts;
  if (dayText.length > 2 || monthText.length > 2 || (yearText.length !== 2 && yearText.length !== 4)) return null;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
};

/**
 * Định dạng lại chữ đang gõ trong ô ngày: dấu phân cách bất kỳ → "/", tự chèn "/" sau 2 số ngày/tháng
 * (bàn phím số của điện thoại không có dấu "/"), năm tối đa 4 số.
 * @param {string} text
 * @param {{ deleting?: boolean }} [options] đang xóa thì không tự chèn "/" để xóa lùi được
 * @returns {string}
 */
export const maskDateTyping = (text, { deleting = false } = {}) => {
  const segments = [""];
  for (const char of String(text ?? "")) {
    const index = segments.length - 1;
    if (/\d/.test(char)) {
      if (index < 2 && segments[index].length === 2) {
        segments.push(char);
      } else if (index === 2 && segments[index].length === 4) {
        break;
      } else {
        segments[index] += char;
      }
    } else if (/[/.\-\s]/.test(char) && segments[index] && index < 2) {
      segments.push("");
    }
  }
  const last = segments.length - 1;
  if (!deleting && last < 2 && segments[last].length === 2) segments.push("");
  return segments.join("/");
};
