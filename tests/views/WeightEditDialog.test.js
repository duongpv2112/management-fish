import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/fishWeightAPI", () => ({
  default: { updateFishWeight: vi.fn(), deleteFishWeight: vi.fn() },
}));

import FishWeightAPI from "@/services/fishWeightAPI";
import WeightEditDialog from "@/views/ManagementFish/components/WeightEditDialog.vue";

const props = {
  item: { _id: "w1", fishType: "f1", basketType: "b1", fishWeight: 25 },
  fishTypes: [
    { _id: "f1", fishName: "Cá trắm" },
    { _id: "f2", fishName: "Cá mè" },
  ],
  basketTypes: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }],
};

const mountDialog = async () => {
  const wrapper = mount(WeightEditDialog, { props });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

test("hiện giá trị hiện tại của lần cân", async () => {
  const wrapper = await mountDialog();
  expect(wrapper.find("#editFishType").element.value).toBe("Cá trắm");
  expect(wrapper.find("#editBasketType").element.value).toBe("Giỏ to");
  expect(wrapper.find("#editFishWeight").element.value).toBe("25");
});

test('sửa số cân "26,5" → gọi updateFishWeight rồi emit saved', async () => {
  vi.mocked(FishWeightAPI.updateFishWeight).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountDialog();
  await wrapper.find("#editFishWeight").setValue("26,5");
  await wrapper.find(".btn-save button").trigger("click");
  await flushPromises();

  expect(FishWeightAPI.updateFishWeight).toHaveBeenCalledWith("w1", {
    fishType: "f1",
    basketType: "b1",
    fishWeight: 26.5,
  });
  expect(wrapper.emitted().saved).toHaveLength(1);
});

test("số cân không hợp lệ: không gọi API", async () => {
  const wrapper = await mountDialog();
  await wrapper.find("#editFishWeight").setValue("0");
  await wrapper.find(".btn-save button").trigger("click");
  expect(FishWeightAPI.updateFishWeight).not.toHaveBeenCalled();
  expect(wrapper.find(".error-message").text()).toBe("Số cân cá phải là số dương.");
});

test("server lỗi: dialog vẫn mở và hiện message", async () => {
  vi.mocked(FishWeightAPI.updateFishWeight).mockRejectedValue(
    new Error("Không tìm thấy bản ghi cân cá!")
  );
  const wrapper = await mountDialog();
  await wrapper.find(".btn-save button").trigger("click");
  await flushPromises();

  expect(wrapper.emitted().saved).toBeUndefined();
  expect(wrapper.emitted().close).toBeUndefined();
  expect(wrapper.find(".error-message").text()).toBe("Không tìm thấy bản ghi cân cá!");
});

test("xóa: đồng ý → deleteFishWeight rồi emit deleted", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(FishWeightAPI.deleteFishWeight).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountDialog();
  await wrapper.find(".btn-delete button").trigger("click");
  await flushPromises();

  expect(confirmSpy).toHaveBeenCalledWith('Xóa lần cân 25 kg "Cá trắm"?');
  expect(FishWeightAPI.deleteFishWeight).toHaveBeenCalledWith("w1");
  expect(wrapper.emitted().deleted).toHaveLength(1);
});

test("xóa: bấm hủy thì không gọi API", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = await mountDialog();
  await wrapper.find(".btn-delete button").trigger("click");
  expect(FishWeightAPI.deleteFishWeight).not.toHaveBeenCalled();
});

test("nút Đóng emit close", async () => {
  const wrapper = await mountDialog();
  await wrapper.find(".btn-close button").trigger("click");
  expect(wrapper.emitted().close).toHaveLength(1);
});

const mountWith = async (overrides = {}) => {
  const wrapper = mount(WeightEditDialog, {
    props: {
      ...props,
      basketTypes: [...props.basketTypes, { _id: "b2", basketName: "Giỏ nhỏ", basketWeight: 1 }],
      ...overrides,
    },
  });
  await flushPromises();
  return wrapper;
};

test("nhãn ghi rõ số cân gồm cả giỏ", async () => {
  const wrapper = await mountDialog();
  expect(wrapper.text()).toContain("Số cân (gồm giỏ)");
});

test("xem trước số cân thực: dùng trọng lượng giỏ đã lưu của lần cân", async () => {
  const wrapper = await mountWith({ item: { ...props.item, basketWeightSnapshot: 3 } });
  expect(wrapper.find(".net-preview").text()).toBe("Còn 22 kg sau khi trừ giỏ 3 kg");

  await wrapper.find("#editFishWeight").setValue("26,5");
  expect(wrapper.find(".net-preview").text()).toBe("Còn 23,5 kg sau khi trừ giỏ 3 kg");
});

test("đổi sang giỏ khác → xem trước theo trọng lượng giỏ mới", async () => {
  const wrapper = await mountWith({ item: { ...props.item, basketWeightSnapshot: 3 } });
  wrapper.findAllComponents({ name: "ComboboxComponent" })[1].vm.$emit("update", "b2");
  await flushPromises();
  expect(wrapper.find(".net-preview").text()).toBe("Còn 24 kg sau khi trừ giỏ 1 kg");
});

test("số cân không lớn hơn giỏ → cảnh báo trong phần xem trước", async () => {
  const wrapper = await mountWith();
  await wrapper.find("#editFishWeight").setValue("1,5");
  const preview = wrapper.find(".net-preview");
  expect(preview.text()).toBe("Số cân phải lớn hơn trọng lượng giỏ (2 kg)");
  expect(preview.classes()).toContain("net-preview--error");
});

test("số cân trống → không hiện xem trước", async () => {
  const wrapper = await mountWith();
  await wrapper.find("#editFishWeight").setValue("");
  expect(wrapper.find(".net-preview").exists()).toBe(false);
});
