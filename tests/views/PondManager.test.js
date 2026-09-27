import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/pondAPI", () => ({
  default: {
    getPonds: vi.fn(),
    createPond: vi.fn(),
    updatePond: vi.fn(),
    deletePond: vi.fn(),
  },
}));

import PondAPI from "@/services/pondAPI";
import PondManager from "@/views/Catalog/components/PondManager.vue";

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(PondAPI.getPonds).mockResolvedValue({
    success: true,
    data: [{ _id: "p1", pondName: "Ao 1", area: null }],
  });
});

const mountManager = async () => {
  const wrapper = mount(PondManager);
  await flushPromises();
  return wrapper;
};

const addPond = async (wrapper, name, area) => {
  await wrapper.find("#pond-new-pondName").setValue(name);
  await wrapper.find("#pond-new-area").setValue(area);
  await wrapper.find(".catalog-add button").trigger("click");
  await flushPromises();
};

test("hiển thị tiêu đề và các cột", async () => {
  const wrapper = await mountManager();
  expect(wrapper.find("h2").text()).toBe("Ao");
  expect(wrapper.find("thead").text()).toContain("Tên ao");
  expect(wrapper.find("thead").text()).toContain("Diện tích (m²)");
  expect(wrapper.find("tbody tr").text()).toContain("Ao 1");
});

test("thêm ao bỏ trống diện tích → gửi area null", async () => {
  vi.mocked(PondAPI.createPond).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await addPond(wrapper, "Ao 3", "");
  expect(PondAPI.createPond).toHaveBeenCalledWith({ pondName: "Ao 3", area: null });
});

test('thêm ao với diện tích "1200,5" → gửi 1200.5', async () => {
  vi.mocked(PondAPI.createPond).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await addPond(wrapper, "Ao 4", "1200,5");
  expect(PondAPI.createPond).toHaveBeenCalledWith({ pondName: "Ao 4", area: 1200.5 });
});

test("sửa ao có diện tích trống → ô sửa trống, không phải chữ null", async () => {
  const wrapper = await mountManager();
  await wrapper.find(".btn-edit button").trigger("click");
  expect(wrapper.find("#pond-edit-area").element.value).toBe("");
});

test("server báo trùng tên → hiện nguyên văn", async () => {
  vi.mocked(PondAPI.createPond).mockRejectedValue(new Error("Tên ao đã tồn tại!"));
  const wrapper = await mountManager();
  await addPond(wrapper, "Ao 1", "");
  expect(wrapper.find(".error-message").text()).toBe("Tên ao đã tồn tại!");
});
