import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn() } }));
vi.mock("@/services/fishTypeAPI", () => ({
  default: { getFishTypes: vi.fn(async () => ({ data: [{ _id: "f1", fishName: "Cá trắm" }] })) },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: {
    getBasketTypes: vi.fn(async () => ({ data: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }] })),
  },
}));

import FishWeightAPI from "@/services/fishWeightAPI";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";

const mountForm = async () => {
  const wrapper = mount(AddWeight);
  await flushPromises();
  return wrapper;
};

const fillForm = async (wrapper, weightText) => {
  wrapper.vm.setFormValues({ fishType: "f1", basketType: "b1" });
  await wrapper.find("#fishWeight").setValue(weightText);
};

const formValues = (wrapper) => ({
  fishType: wrapper.find("#fishType").element.value,
  basketType: wrapper.find("#basketType").element.value,
  fishWeight: wrapper.find("#fishWeight").element.value,
});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(FishWeightAPI.saveFishWeight).mockReset();
});

test("lưu thành công: gọi API với số thập phân, emit sau khi lưu, chỉ xóa số cân, giữ cá và giỏ", async () => {
  const saved = { _id: "w1", fishWeight: 25.5 };
  vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: saved });
  const wrapper = await mountForm();
  await fillForm(wrapper, "25,5");

  const ok = await wrapper.vm.save();
  await flushPromises();

  expect(ok).toBe(true);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledWith({
    fishType: "f1",
    basketType: "b1",
    fishWeight: 25.5,
  });
  expect(wrapper.emitted().weightAdded).toEqual([[saved]]);
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "" });
  expect(wrapper.text()).toContain("Lưu số cân thành công!");
});

test("lưu thất bại: không emit, giữ nguyên giá trị đã nhập, hiện message server", async () => {
  vi.mocked(FishWeightAPI.saveFishWeight).mockRejectedValue(new Error("Thêm cân cá không thành công!"));
  const wrapper = await mountForm();
  await fillForm(wrapper, "25,5");

  const ok = await wrapper.vm.save();
  await flushPromises();

  expect(ok).toBe(false);
  expect(wrapper.emitted().weightAdded).toBeUndefined();
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "25,5" });
  expect(wrapper.find(".error-message").text()).toBe("Thêm cân cá không thành công!");
});

test("thiếu loại cá: không gọi API", async () => {
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ basketType: "b1", fishWeight: 10 });
  await wrapper.vm.save();
  await flushPromises();

  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Vui lòng chọn loại cá.");
});

test.each(["0", "abc"])("số cân %j: báo lỗi số dương", async (weightText) => {
  const wrapper = await mountForm();
  await fillForm(wrapper, weightText);
  await wrapper.vm.save();
  await flushPromises();

  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Số cân cá phải là số dương.");
});

test("setFormValues điền số cân dạng số", async () => {
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ fishType: "f1", basketType: "b1", fishWeight: 12.5 });
  await flushPromises();
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "12.5" });
});

test("không dùng cache localStorage cho danh sách loại cá", async () => {
  localStorage.setItem(
    "fishTypes",
    JSON.stringify({ data: [{ _id: "cu", fishName: "Cá cũ" }], timestamp: Date.now() })
  );
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ fishType: "f1" });
  await flushPromises();
  expect(wrapper.find("#fishType").element.value).toBe("Cá trắm");
});
