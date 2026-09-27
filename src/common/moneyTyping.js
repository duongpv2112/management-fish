// Định dạng ô nhập tiền ngay khi đang gõ: VND tự thêm dấu "." ngăn cách hàng nghìn ("45000" → "45.000").
// USD giữ nguyên chữ đang gõ (định dạng khi rời ô), vì "," có thể là dấu thập phân kiểu Việt Nam.

/**
 * @param {string} text chữ đang có trong ô
 * @param {string} [currency] "VND" (mặc định) | "USD"
 * @returns {string}
 */
export const formatMoneyTyping = (text, currency = "VND") => {
  const raw = String(text ?? "");
  if (currency !== "VND") return raw;
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Vị trí ngay sau chữ số thứ `count` trong `text` (0 → đầu ô)
const positionAfterDigits = (text, count) => {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text[index])) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return text.length;
};

/**
 * Định dạng lại chữ trong ô nhập (gọi trong sự kiện input) và giữ con trỏ sau đúng chữ số người dùng vừa gõ.
 * @param {HTMLInputElement} input
 * @param {(text: string) => string} format
 * @returns {string} chữ sau khi định dạng
 */
export const applyTypingFormat = (input, format) => {
  const oldValue = input.value;
  const formatted = format(oldValue);
  if (formatted === oldValue) return formatted;
  const caret = input.selectionStart ?? oldValue.length;
  const digitsBeforeCaret = oldValue.slice(0, caret).replace(/\D/g, "").length;
  input.value = formatted;
  const position = positionAfterDigits(formatted, digitsBeforeCaret);
  try {
    input.setSelectionRange(position, position);
  } catch {
    // Ô không hỗ trợ chọn vùng (vd. type="number"): bỏ qua
  }
  return formatted;
};
