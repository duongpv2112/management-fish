/**
 * Nhãn ngắn của phiên cho nút trên thanh trên cùng, ví dụ "Phiên 26/09/2026 · đang mở"
 * @param {{ sessionName: string, status: string } | null | undefined} session
 * @returns {string}
 */
export const sessionLabel = (session) => {
  if (!session) return "Chưa có phiên";
  return `${session.sessionName} · ${session.status === "open" ? "đang mở" : "đã kết thúc"}`;
};
