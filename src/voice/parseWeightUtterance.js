// Tách một câu nói thành loại cá, loại giỏ, số cân và lệnh, ví dụ
// "cá trắm giỏ to 25,5 lưu" → { fishTypeId, basketTypeId, weight: 25.5, command: "save" }
import { normalizeVi, findNumberSpan } from "./vietnameseNumber";

// Lệnh ở cuối câu (đã normalize), xét cụm dài trước
const COMMANDS = [
  { words: ["lam", "lai"], command: "cancel" },
  { words: ["luu"], command: "save" },
  { words: ["xong"], command: "save" },
  { words: ["huy"], command: "cancel" },
  { words: ["sai"], command: "cancel" },
];

const tokenize = (text) => {
  const normalized = normalizeVi(text);
  return normalized ? normalized.split(" ") : [];
};

const endsWith = (tokens, words) =>
  tokens.length >= words.length &&
  words.every((word, i) => tokens[tokens.length - words.length + i] === word);

const indexOfSequence = (tokens, words) => {
  for (let i = 0; i + words.length <= tokens.length; i++) {
    if (words.every((word, j) => tokens[i + j] === word)) return i;
  }
  return -1;
};

/**
 * Ứng viên tên của một mục danh mục: tên đầy đủ ("ca tram") và tên bỏ tiền tố ("tram")
 * @returns {{ id: string, words: string[], bare: boolean }[]}
 */
const buildCandidates = (items, idField, nameField, prefix) =>
  items.flatMap((item) => {
    const words = tokenize(item[nameField]);
    if (words.length === 0) return [];
    const candidates = [{ id: item[idField], words, bare: false }];
    if (words[0] === prefix && words.length > 1) {
      candidates.push({ id: item[idField], words: words.slice(1), bare: true });
    }
    return candidates;
  });

/**
 * Khớp tên dài nhất trong câu và cắt khỏi danh sách từ
 * @returns {{ id: string | null, tokens: string[] }}
 */
const matchAndRemove = (tokens, candidates, prefix) => {
  // Phần số của câu gốc: tên bỏ tiền tố nằm ở giữa/cuối phần số (ví dụ "lang" trong "ba can hai lang")
  // là lạng chứ không phải tên cá. Ở đầu phần số thì vẫn là tên cá ("tram ba" là trắm 3 cân, không phải 130)
  const numberSpan = findNumberSpan(tokens);

  let best = null;
  for (const candidate of candidates) {
    const start = indexOfSequence(tokens, candidate.words);
    if (start < 0) continue;
    const end = start + candidate.words.length;
    if (candidate.bare && numberSpan && start > numberSpan.start && end <= numberSpan.end) {
      continue;
    }
    const longer =
      !best ||
      candidate.words.length > best.candidate.words.length ||
      (candidate.words.length === best.candidate.words.length &&
        candidate.words.join(" ").length > best.candidate.words.join(" ").length);
    if (longer) best = { candidate, start, end };
  }

  if (!best) return { id: null, tokens };

  // Bỏ luôn từ tiền tố đứng trước ("ca", "gio") nếu người nói có nói
  let start = best.start;
  if (best.candidate.bare && tokens[start - 1] === prefix) start--;
  return {
    id: best.candidate.id,
    tokens: [...tokens.slice(0, start), ...tokens.slice(best.end)],
  };
};

/**
 * @param {string} transcript Câu nói nhận dạng được
 * @param {{ fishTypes: {_id, fishName}[], basketTypes: {_id, basketName}[] }} catalog
 * @returns {{ fishTypeId: string|null, basketTypeId: string|null, weight: number|null,
 *             command: "save"|"cancel"|null, unrecognized: string }}
 */
export const parseWeightUtterance = (transcript, catalog) => {
  let tokens = tokenize(transcript);

  let command = null;
  const matchedCommand = COMMANDS.find(({ words }) => endsWith(tokens, words));
  if (matchedCommand) {
    command = matchedCommand.command;
    tokens = tokens.slice(0, tokens.length - matchedCommand.words.length);
  }

  // Khớp tên cá trước khi đọc số để "cá lăng" không bị hiểu thành "lạng"
  const fish = matchAndRemove(
    tokens,
    buildCandidates(catalog?.fishTypes ?? [], "_id", "fishName", "ca"),
    "ca"
  );
  tokens = fish.tokens;

  const basket = matchAndRemove(
    tokens,
    buildCandidates(catalog?.basketTypes ?? [], "_id", "basketName", "gio"),
    "gio"
  );
  tokens = basket.tokens;

  let weight = null;
  const numberSpan = findNumberSpan(tokens);
  if (numberSpan) {
    weight = numberSpan.value;
    tokens = [...tokens.slice(0, numberSpan.start), ...tokens.slice(numberSpan.end)];
  }

  return {
    fishTypeId: fish.id,
    basketTypeId: basket.id,
    weight,
    command,
    unrecognized: tokens.join(" "),
  };
};
