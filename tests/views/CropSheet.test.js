import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/cropAPI", () => ({
  default: { createCrop: vi.fn(), closeCrop: vi.fn() },
}));

import CropAPI from "@/services/cropAPI";
import CropSheet from "@/views/Crops/components/CropSheet.vue";
import { todayInputValue, formatDateOnly } from "@/common/dateInput";

const pond = { _id: "p1", pondName: "Ao 1" };
const crop = { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", startDate: "2026-09-01T00:00:00.000Z", pond };

beforeEach(() => {
  vi.resetAllMocks();
});

test("bắt đầu vụ: ngày mặc định hôm nay, tên trống → server tự đặt", async () => {
  vi.mocked(CropAPI.createCrop).mockResolvedValue({ success: true, data: { _id: "c2" } });
  const wrapper = mount(CropSheet, { props: { open: true, mode: "start", pond, crop: null } });

  expect(wrapper.find("#crop-date").element.value).toBe(formatDateOnly(todayInputValue()));
  expect(wrapper.find("#crop-name").attributes("placeholder")).toBe("Để trống để tự đặt tên");

  await wrapper.find(".btn-crop-submit button").trigger("click");
  await flushPromises();
  expect(CropAPI.createCrop).toHaveBeenCalledWith({ pondId: "p1", startDate: todayInputValue() });
  expect(wrapper.emitted("saved")[0][0]).toEqual({ _id: "c2" });
});

test("bắt đầu vụ với tên tự nhập (trim)", async () => {
  vi.mocked(CropAPI.createCrop).mockResolvedValue({ success: true, data: {} });
  const wrapper = mount(CropSheet, { props: { open: true, mode: "start", pond, crop: null } });
  await wrapper.find("#crop-name").setValue(" Vụ xuân ");
  await wrapper.find("#crop-date").setValue("5/3/2026");
  await wrapper.find(".btn-crop-submit button").trigger("click");
  await flushPromises();
  expect(CropAPI.createCrop).toHaveBeenCalledWith({ pondId: "p1", cropName: "Vụ xuân", startDate: "2026-03-05" });
});

test("kết thúc vụ", async () => {
  vi.mocked(CropAPI.closeCrop).mockResolvedValue({ success: true, data: { _id: "c1", status: "closed" } });
  const wrapper = mount(CropSheet, { props: { open: true, mode: "close", pond, crop } });
  expect(wrapper.text()).toContain("Sau khi kết thúc, phiên bán mới không gắn được vào vụ này.");
  expect(wrapper.find("#crop-name").exists()).toBe(false);

  await wrapper.find("#crop-date").setValue("27092026");
  await wrapper.find(".btn-crop-submit button").trigger("click");
  await flushPromises();
  expect(CropAPI.closeCrop).toHaveBeenCalledWith("c1", { endDate: "2026-09-27" });
  expect(wrapper.emitted("saved")).toHaveLength(1);
});

test("lỗi từ server → hiện message, không emit saved", async () => {
  vi.mocked(CropAPI.closeCrop).mockRejectedValue(new Error("Vụ còn phiên bán đang mở, hãy kết thúc phiên trước!"));
  const wrapper = mount(CropSheet, { props: { open: true, mode: "close", pond, crop } });
  await wrapper.find(".btn-crop-submit button").trigger("click");
  await flushPromises();
  expect(wrapper.find(".crop-sheet__error").text()).toBe("Vụ còn phiên bán đang mở, hãy kết thúc phiên trước!");
  expect(wrapper.emitted("saved")).toBeUndefined();
});
