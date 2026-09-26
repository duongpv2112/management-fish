// Lưu phiên đăng nhập (token JWT) trong localStorage; bọc try/catch vì trình duyệt có thể chặn storage
const TOKEN_KEY = "token";
const EXPIRES_KEY = "tokenExpiresAt";

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * @returns {string|null} token còn hạn, hoặc null nếu chưa đăng nhập/đã hết hạn
 */
export const getToken = () => {
  const token = readStorage(TOKEN_KEY);
  const expiresAt = Date.parse(readStorage(EXPIRES_KEY) ?? "");
  if (!token || (Number.isFinite(expiresAt) && expiresAt <= Date.now())) return null;
  return token;
};

export const setSession = ({ token, expiresAt }) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_KEY, expiresAt);
  } catch {
    // Không lưu được thì phải đăng nhập lại lần sau
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  } catch {
    // bỏ qua
  }
};
