import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/weighSessionAPI", () => ({
  default: { createWeighSession: vi.fn(), closeWeighSession: vi.fn() },
}));

import WeighSessionAPI from "@/services/weighSessionAPI";
import SessionSheet from "@/views/ManagementFish/components/SessionSheet.vue";
import { sessionLabel } from "@/common/sessionLabel";

const sessions = [
  { _id: "s2", sessionName: "Phiên 26/09/2026", status: "open", createdAt: "2026-09-26T01:00:00.000Z" },
  { _id: "s1", sessionName: "Phiên 25/09/2026", status: "closed", createdAt: "2026-09-25T01:00:00.000Z" },
];

const mountSheet = (props = {}) =>
  mount(SessionSheet, { props: { open: true, sessions, selectedId: "s2", ...props } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const withPond = {
  ...sessions[0],
  crop: { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", pond: { _id: "p1", pondName: "Ao 1" } },
};

test("sessionLabel", () => {
  expect(sessionLabel(sessions[0])).toBe("Phiên 26/09/2026 · đang mở");
  expect(sessionLabel(sessions[1])).toBe("Phiên 25/09/2026 · đã kết thúc");
  expect(sessionLabel(withPond)).toBe("Phiên 26/09/2026 · Ao 1 · đang mở");
  expect(sessionLabel(null)).toBe("Chưa có phiên");
});

test("liệt kê phiên, nhãn trạng thái, dấu ✓ ở phiên đang chọn", () => {
  const items = mountSheet().findAll(".session-sheet__item");
  expect(items).toHaveLength(2);
  expect(items[0].text()).toContain("Phiên 26/09/2026");
  expect(items[0].find(".session-sheet__badge").text()).toBe("đang mở");
  expect(items[0].text()).toContain("✓");
  expect(items[1].find(".session-sheet__badge").text()).toBe("đã kết thúc");
  expect(items[1].text()).not.toContain("✓");
});

test("chọn phiên → emit select và close", async () => {
  const wrapper = mountSheet();
  await wrapper.findAll(".session-sheet__item")[1].trigger("click");
  expect(wrapper.emitted().select).toEqual([["s1"]]);
  expect(wrapper.emitted().close).toHaveLength(1);
});

test("Phiên mới → emit requestNew và close, không tự tạo phiên", async () => {
  const wrapper = mountSheet();
  await wrapper.find(".btn-sheet-new").trigger("click");
  expect(wrapper.emitted().requestNew).toHaveLength(1);
  expect(wrapper.emitted().close).toHaveLength(1);
  expect(WeighSessionAPI.createWeighSession).not.toHaveBeenCalled();
});

test("phiên đang chọn chưa có ao → Chọn ao; có ao → Đổi ao; bấm → emit requestCrop và close", async () => {
  let wrapper = mountSheet();
  expect(wrapper.find(".btn-sheet-crop").text()).toBe("Chọn ao");
  await wrapper.find(".btn-sheet-crop").trigger("click");
  expect(wrapper.emitted().requestCrop).toHaveLength(1);
  expect(wrapper.emitted().close).toHaveLength(1);

  wrapper = mountSheet({ sessions: [withPond, sessions[1]] });
  expect(wrapper.find(".btn-sheet-crop").text()).toBe("Đổi ao");
  expect(wrapper.findAll(".session-sheet__item")[0].text()).toContain("Ao 1");
});

test("Kết thúc phiên: hỏi xác nhận đúng câu; đồng ý → đóng phiên, emit closed", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(WeighSessionAPI.closeWeighSession).mockResolvedValue({ success: true, data: { _id: "s2" } });
  const wrapper = mountSheet();
  await wrapper.find(".btn-sheet-close").trigger("click");
  await flushPromises();
  expect(confirmSpy).toHaveBeenCalledWith(
    'Kết thúc phiên "Phiên 26/09/2026"? Sau khi kết thúc sẽ không thêm/sửa lần cân được.'
  );
  expect(WeighSessionAPI.closeWeighSession).toHaveBeenCalledWith("s2");
  expect(wrapper.emitted().closed).toEqual([[{ _id: "s2" }]]);
  expect(wrapper.emitted().close).toHaveLength(1);
});

test("Kết thúc phiên: từ chối → không gọi API", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = mountSheet();
  await wrapper.find(".btn-sheet-close").trigger("click");
  expect(WeighSessionAPI.closeWeighSession).not.toHaveBeenCalled();
});

test("API lỗi → hiện message, không đóng sheet", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(WeighSessionAPI.closeWeighSession).mockRejectedValue(new Error("Phiên cân đã kết thúc!"));
  const wrapper = mountSheet();
  await wrapper.find(".btn-sheet-close").trigger("click");
  await flushPromises();
  expect(wrapper.find(".session-sheet__error").text()).toBe("Phiên cân đã kết thúc!");
  expect(wrapper.emitted().close).toBeUndefined();
});

test("phiên đang chọn đã kết thúc → không có nút Kết thúc phiên", () => {
  const wrapper = mountSheet({ selectedId: "s1" });
  expect(wrapper.find(".btn-sheet-close").exists()).toBe(false);
  expect(wrapper.find(".btn-sheet-new").exists()).toBe(true);
});
