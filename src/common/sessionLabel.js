/**
 * Tên ao của phiên (qua vụ nuôi), "" nếu phiên chưa chọn ao
 * @param {{ crop?: { pond?: { pondName: string } } | null } | null | undefined} session
 * @returns {string}
 */
export const sessionPondName = (session) => session?.crop?.pond?.pondName ?? "";

/**
 * Nhãn ngắn của phiên cho nút trên thanh trên cùng, ví dụ "Phiên 26/09/2026 · Ao 1 · đang mở"
 * @param {{ sessionName: string, status: string, crop?: object | null } | null | undefined} session
 * @returns {string}
 */
export const sessionLabel = (session) => {
  if (!session) return "Chưa có phiên";
  const pondName = sessionPondName(session);
  return [session.sessionName, pondName, session.status === "open" ? "đang mở" : "đã kết thúc"]
    .filter(Boolean)
    .join(" · ");
};
