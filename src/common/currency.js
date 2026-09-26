// Loại tiền của bảng giá phiên cân (khớp với BE app/config/currency.js)
export const CURRENCIES = {
  VND: { label: "VND (đ)", symbol: "đ", decimals: 0, locale: "vi-VN", symbolAfter: true },
  USD: { label: "USD ($)", symbol: "$", decimals: 2, locale: "en-US", symbolAfter: false },
};

export const DEFAULT_CURRENCY = "VND";

const getCurrency = (currency) => CURRENCIES[currency] ?? CURRENCIES[DEFAULT_CURRENCY];

// Chỉ phần số: VND "45.000", USD "1,250.50"
const formatNumber = (value, currency) => {
  const { locale, decimals } = getCurrency(currency);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
};

/**
 * Số tiền kèm ký hiệu: VND "2.418.750 đ", USD "$1,250.50"
 * @param {number|null} value
 * @param {string} currency "VND" | "USD"
 */
export const formatMoney = (value, currency = DEFAULT_CURRENCY) => {
  const { symbol, symbolAfter } = getCurrency(currency);
  const number = formatNumber(value, currency);
  return symbolAfter ? `${number} ${symbol}` : `${symbol}${number}`;
};

// Giá trị hiển thị trong ô nhập đơn giá (không kèm ký hiệu); chưa có giá thì rỗng
export const formatPriceInput = (value, currency = DEFAULT_CURRENCY) => {
  if (value === null || value === undefined) return "";
  return formatNumber(value, currency);
};

/**
 * Đọc đơn giá người dùng gõ. Rỗng hoặc không có chữ số → null.
 * VND: chỉ lấy chữ số ("40.000 đ" → 40000).
 * USD: "." là dấu thập phân và "," ngăn cách nghìn ("1,250.50"); nếu chỉ có "," và sau nó 1–2 chữ số
 * thì "," là dấu thập phân kiểu Việt Nam ("2,5" → 2.5).
 * @param {string|number|null} text
 * @param {string} currency
 * @returns {number|null}
 */
export const parseMoney = (text, currency = DEFAULT_CURRENCY) => {
  const raw = (text ?? "").toString();
  if (getCurrency(currency).decimals === 0) {
    const digits = raw.replace(/\D/g, "");
    return digits === "" ? null : Number(digits);
  }

  let cleaned = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(cleaned)) return null;
  if (cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (/,\d{1,2}$/.test(cleaned)) {
    const lastComma = cleaned.lastIndexOf(",");
    cleaned = `${cleaned.slice(0, lastComma).replace(/,/g, "")}.${cleaned.slice(lastComma + 1)}`;
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
};
