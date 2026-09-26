// Đọc số cân từ lời nói tiếng Việt, ví dụ "hai mươi lăm phẩy năm", "hai lăm rưỡi", "3 cân 2 lạng".
// Mọi hàm làm việc trên chữ đã normalize (viết thường, bỏ dấu).

const DIGIT_WORDS = {
  khong: 0,
  mot: 1, // "một" và "mốt" đều thành "mot"
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  lam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
};

const DECIMAL_WORDS = ["phay", "cham", "."];
const UNIT_WORDS = ["can", "ky", "kg", "kilo"];

/**
 * Viết thường, bỏ dấu tiếng Việt, đổi "25,5" thành "25.5", tách chữ số dính chữ ("25kg" → "25 kg"),
 * bỏ dấu câu và gộp khoảng trắng.
 * Không dùng common.removeVietnameseTones vì hàm đó xóa cả dấu "." và ",".
 */
export const normalizeVi = (text) =>
  (text ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    // Dấu "." chỉ giữ khi nằm giữa hai chữ số
    .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isLatinNumber = (token) => /^\d+(\.\d+)?$/.test(token ?? "");
const isDigitWord = (token) => token in DIGIT_WORDS;
const digitOf = (token) => DIGIT_WORDS[token];

// Một chữ số (dạng chữ hoặc chữ số La-tinh một ký tự)
const singleDigitAt = (tokens, pos) => {
  const token = tokens[pos];
  if (isDigitWord(token)) return digitOf(token);
  if (/^\d$/.test(token ?? "")) return Number(token);
  return null;
};

// Đơn vị: "can", "ky", "kg", "kilo", hoặc "ki lo" (2 từ); trả số token đã dùng
const unitLengthAt = (tokens, pos) => {
  if (UNIT_WORDS.includes(tokens[pos])) return 1;
  if (tokens[pos] === "ki" && tokens[pos + 1] === "lo") return 2;
  return 0;
};

/**
 * Phần hàng chục và đơn vị: "muoi lam" = 15, "hai muoi mot" = 21, "hai lam" = 25, "bay" = 7
 * @returns {{ value: number, next: number, singleDigit: boolean } | null}
 */
const parseTens = (tokens, pos) => {
  if (tokens[pos] === "muoi") {
    const unit = singleDigitAt(tokens, pos + 1);
    if (unit !== null && tokens[pos + 1] !== "khong") {
      return { value: 10 + unit, next: pos + 2, singleDigit: false };
    }
    return { value: 10, next: pos + 1, singleDigit: false };
  }

  if (!isDigitWord(tokens[pos])) return null;
  const tens = digitOf(tokens[pos]);

  if (tokens[pos + 1] === "muoi") {
    const unit = singleDigitAt(tokens, pos + 2);
    if (unit !== null && isDigitWord(tokens[pos + 2])) {
      return { value: tens * 10 + unit, next: pos + 3, singleDigit: false };
    }
    return { value: tens * 10, next: pos + 2, singleDigit: false };
  }

  // Hai chữ số liền nhau, không có "mươi": "hai lăm" = 25
  if (isDigitWord(tokens[pos + 1])) {
    return { value: tens * 10 + digitOf(tokens[pos + 1]), next: pos + 2, singleDigit: false };
  }

  return { value: tens, next: pos + 1, singleDigit: true };
};

/**
 * Phần nguyên: số La-tinh, hoặc chữ có thể có hàng trăm ("mot tram linh nam", "tram hai")
 * @returns {{ value: number, next: number } | null}
 */
const parseInteger = (tokens, pos) => {
  const token = tokens[pos];
  if (isLatinNumber(token)) return { value: Number(token), next: pos + 1 };

  let hundreds = null;
  let cursor = pos;
  if (isDigitWord(token) && tokens[pos + 1] === "tram") {
    hundreds = digitOf(token) * 100;
    cursor = pos + 2;
  } else if (
    token === "tram" &&
    (isDigitWord(tokens[pos + 1]) || ["muoi", "linh", "le"].includes(tokens[pos + 1]))
  ) {
    // "trăm" không có chữ số phía trước chỉ là số khi có phần sau ("trăm hai"),
    // tránh hiểu nhầm tên cá "trắm" (cũng thành "tram") là 100
    hundreds = 100;
    cursor = pos + 1;
  }

  if (hundreds === null) {
    // "khong" đứng một mình không phải là số ("không có số nào"), trừ khi có phần thập phân theo sau
    if (token === "khong" && !DECIMAL_WORDS.includes(tokens[pos + 1])) return null;
    const tens = parseTens(tokens, pos);
    return tens && { value: tens.value, next: tens.next };
  }

  // "linh"/"le": hàng chục bằng 0
  if (["linh", "le"].includes(tokens[cursor]) && isDigitWord(tokens[cursor + 1])) {
    return { value: hundreds + digitOf(tokens[cursor + 1]), next: cursor + 2 };
  }

  const tens = parseTens(tokens, cursor);
  if (!tens) return { value: hundreds, next: cursor };
  // "tram hai" = 120: một chữ số đứng cuối sau "trăm" là hàng chục
  return {
    value: hundreds + (tens.singleDigit ? tens.value * 10 : tens.value),
    next: tens.next,
  };
};

// Phần thập phân sau "phay"/"cham": ghép các chữ số thành chuỗi ("hai lam" → "25")
const parseDecimalDigits = (tokens, pos) => {
  let digits = "";
  let cursor = pos;
  while (cursor < tokens.length) {
    const token = tokens[cursor];
    if (isDigitWord(token)) digits += String(digitOf(token));
    else if (/^\d+$/.test(token)) digits += token;
    else break;
    cursor++;
  }
  return digits ? { digits, next: cursor } : null;
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Đọc số bắt đầu tại vị trí pos
 * @returns {{ value: number, next: number } | null}
 */
const parseNumberAt = (tokens, pos) => {
  const integer = parseInteger(tokens, pos);
  if (!integer) return null;

  let value = integer.value;
  let cursor = integer.next;

  if (DECIMAL_WORDS.includes(tokens[cursor]) && Number.isInteger(value)) {
    const decimal = parseDecimalDigits(tokens, cursor + 1);
    if (decimal) {
      value = Number(`${value}.${decimal.digits}`);
      cursor = decimal.next;
    }
  }

  if (tokens[cursor] === "ruoi") {
    value += 0.5;
    cursor++;
  }

  const unitLength = unitLengthAt(tokens, cursor);
  if (unitLength) {
    cursor += unitLength;
    if (tokens[cursor] === "ruoi") {
      // "muoi can ruoi" = 10.5
      value += 0.5;
      cursor++;
    } else {
      // "3 can 2 lang", "ba ky hai": chữ số sau đơn vị là lạng (1/10 kg)
      const lang = singleDigitAt(tokens, cursor);
      if (lang !== null) {
        value += lang / 10;
        cursor++;
        if (tokens[cursor] === "lang") cursor++;
      }
    }
  }

  return { value: round2(value), next: cursor };
};

/**
 * Tìm số đầu tiên trong danh sách từ (đã normalize)
 * @returns {{ start: number, end: number, value: number } | null} end là vị trí ngay sau phần số
 */
export const findNumberSpan = (tokens) => {
  for (let start = 0; start < tokens.length; start++) {
    const parsed = parseNumberAt(tokens, start);
    if (parsed) return { start, end: parsed.next, value: parsed.value };
  }
  return null;
};

/**
 * Đọc số đầu tiên trong câu nói (chưa hoặc đã normalize)
 * @returns {number | null}
 */
export const parseVietnameseNumber = (text) => {
  const normalized = normalizeVi(text);
  if (!normalized) return null;
  return findNumberSpan(normalized.split(" "))?.value ?? null;
};
