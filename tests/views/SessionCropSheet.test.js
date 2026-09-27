import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/cropAPI", () => ({ default: { getCrops: vi.fn() } }));
vi.mock("@/services/weighSessionAPI", () => ({ default: { updateSessionCrop: vi.fn() } }));

import CropAPI from "@/services/cropAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";
import SessionCropSheet from "@/views/ManagementFish/components/SessionCropSheet.vue";

const ao1 = { _id: "p1", pondName: "Ao 1" };
const ao2 = { _id: "p2", pondName: "Ao 2" };
// Thứ tự server trả: vụ mở trước
const crops = [
  { _id: "c2", cropName: "Ao 2 · Vụ 09/2026", status: "open", pond: ao2 },
  { _id: "c1", cropName: "Ao 1 · Vụ 01/2026", status: "closed", pond: ao1 },
];
const sessionNoCrop = { _id: "s1", sessionName: "Phiên 25/09/2026", status: "closed", crop: null };
const sessionWithCrop = { ...sessionNoCrop, crop: { _id: "c1", cropName: "Ao 1 · Vụ 01/2026", pond: ao1 } };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: crops });
});

const mountSheet = async (session) => {
  const wrapper = mount(SessionCropSheet, { props: { open: false, session } });
  await wrapper.setProps({ open: true });
  await flushPromises();
  return wrapper;
};

test("liệt kê vụ theo ao, vụ mở trước; vụ đã kết thúc có nhãn", async () => {
  const items = (await mountSheet(sessionNoCrop)).findAll(".session-crop__item");
  expect(items).toHaveLength(2);
  expect(items[0].text()).toContain("Ao 2");
  expect(items[0].text()).toContain("Ao 2 · Vụ 09/2026");
  expect(items[0].text()).not.toContain("đã kết thúc");
  expect(items[1].text()).toContain("đã kết thúc");
});

test("chọn vụ → updateSessionCrop, emit updated và close", async () => {
  vi.mocked(WeighSessionAPI.updateSessionCrop).mockResolvedValue({ data: { _id: "s1", crop: "c2" } });
  const wrapper = await mountSheet(sessionNoCrop);
  await wrapper.findAll(".session-crop__item")[0].trigger("click");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionCrop).toHaveBeenCalledWith("s1", "c2");
  expect(wrapper.emitted("updated")).toHaveLength(1);
  expect(wrapper.emitted("close")).toHaveLength(1);
});

test("phiên chưa có vụ → không có nút Bỏ gán ao", async () => {
  const wrapper = await mountSheet(sessionNoCrop);
  expect(wrapper.find(".btn-unassign-crop").exists()).toBe(false);
});

test("phiên đang có vụ: đánh dấu vụ hiện tại, Bỏ gán ao → gửi null", async () => {
  vi.mocked(WeighSessionAPI.updateSessionCrop).mockResolvedValue({ data: {} });
  const wrapper = await mountSheet(sessionWithCrop);
  expect(wrapper.findAll(".session-crop__item")[1].text()).toContain("✓");
  await wrapper.find(".btn-unassign-crop").trigger("click");
  await flushPromises();
  expect(WeighSessionAPI.updateSessionCrop).toHaveBeenCalledWith("s1", null);
  expect(wrapper.emitted("updated")).toHaveLength(1);
});

test("lỗi → hiện message, không emit", async () => {
  vi.mocked(WeighSessionAPI.updateSessionCrop).mockRejectedValue(new Error("Không tìm thấy dữ liệu!"));
  const wrapper = await mountSheet(sessionNoCrop);
  await wrapper.findAll(".session-crop__item")[0].trigger("click");
  await flushPromises();
  expect(wrapper.find(".session-crop__error").text()).toBe("Không tìm thấy dữ liệu!");
  expect(wrapper.emitted("updated")).toBeUndefined();
});
