import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/pondAPI", () => ({ default: { getPonds: vi.fn() } }));
vi.mock("@/services/cropAPI", () => ({ default: { getCrops: vi.fn(), createCrop: vi.fn() } }));
vi.mock("@/services/weighSessionAPI", () => ({ default: { createWeighSession: vi.fn() } }));

import PondAPI from "@/services/pondAPI";
import CropAPI from "@/services/cropAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";
import NewSessionSheet from "@/views/ManagementFish/components/NewSessionSheet.vue";

const ao1 = { _id: "p1", pondName: "Ao 1" };
const ao2 = { _id: "p2", pondName: "Ao 2" };
const crop1 = { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", status: "open", pond: ao1 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(PondAPI.getPonds).mockResolvedValue({ data: [ao1, ao2] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [crop1] });
});

// Mở sheet (open false → true) để sheet tải ao và vụ
const mountSheet = async () => {
  const wrapper = mount(NewSessionSheet, { props: { open: false } });
  await wrapper.setProps({ open: true });
  await flushPromises();
  return wrapper;
};

const pickPond = async (wrapper, name) => {
  const button = wrapper.findAll(".choice-grid__item").find((node) => node.find(".choice-grid__text").text() === name);
  await button.trigger("click");
};

const submit = async (wrapper) => {
  await wrapper.find(".btn-create-session button").trigger("click");
  await flushPromises();
};

test("tải ao và vụ đang mở khi mở sheet; nhãn phụ là tên vụ hoặc Chưa có vụ", async () => {
  const wrapper = await mountSheet();
  expect(CropAPI.getCrops).toHaveBeenCalledWith({ status: "open" });
  const items = wrapper.findAll(".choice-grid__item");
  expect(items[0].text()).toContain("Ao 1");
  expect(items[0].find(".choice-grid__sub").text()).toBe("Ao 1 · Vụ 09/2026");
  expect(items[1].find(".choice-grid__sub").text()).toBe("Chưa có vụ");
});

test("nút Tạo phiên bị khóa tới khi chọn ao", async () => {
  const wrapper = await mountSheet();
  expect(wrapper.find(".btn-create-session button").attributes("disabled")).toBeDefined();
  await pickPond(wrapper, "Ao 1");
  expect(wrapper.find(".btn-create-session button").attributes("disabled")).toBeUndefined();
});

test("ao có vụ đang nuôi → tạo phiên với vụ đó, tên người mua được trim", async () => {
  vi.mocked(WeighSessionAPI.createWeighSession).mockResolvedValue({ data: { _id: "s3" } });
  const wrapper = await mountSheet();
  await pickPond(wrapper, "Ao 1");
  await wrapper.find("#new-session-buyer").setValue(" Anh Tuấn ");
  await submit(wrapper);
  expect(WeighSessionAPI.createWeighSession).toHaveBeenCalledWith({ buyerName: "Anh Tuấn", cropId: "c1" });
  expect(wrapper.emitted("created")).toEqual([[{ _id: "s3" }]]);
  expect(wrapper.emitted("close")).toHaveLength(1);
});

test("ao chưa có vụ, đồng ý bắt đầu vụ → tạo vụ rồi tạo phiên với vụ mới", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(CropAPI.createCrop).mockResolvedValue({ data: { _id: "c2" } });
  vi.mocked(WeighSessionAPI.createWeighSession).mockResolvedValue({ data: { _id: "s3" } });
  const wrapper = await mountSheet();
  await pickPond(wrapper, "Ao 2");
  await submit(wrapper);
  expect(confirmSpy).toHaveBeenCalledWith("Ao này chưa có vụ, bắt đầu vụ mới?");
  expect(CropAPI.createCrop).toHaveBeenCalledWith({ pondId: "p2" });
  expect(WeighSessionAPI.createWeighSession).toHaveBeenCalledWith({ buyerName: "", cropId: "c2" });
});

test("ao chưa có vụ, từ chối → không gọi API", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = await mountSheet();
  await pickPond(wrapper, "Ao 2");
  await submit(wrapper);
  expect(CropAPI.createCrop).not.toHaveBeenCalled();
  expect(WeighSessionAPI.createWeighSession).not.toHaveBeenCalled();
  expect(wrapper.emitted("created")).toBeUndefined();
});

test("chưa có ao → hướng dẫn thêm ao trong Danh mục", async () => {
  vi.mocked(PondAPI.getPonds).mockResolvedValue({ data: [] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [] });
  const wrapper = await mountSheet();
  expect(wrapper.text()).toContain("Chưa có ao.");
  expect(wrapper.find('a[href="#/danh-muc"]').exists()).toBe(true);
});

test("lỗi từ server → hiện message, không emit", async () => {
  vi.mocked(WeighSessionAPI.createWeighSession).mockRejectedValue(new Error("Vụ đã kết thúc, hãy chọn vụ đang nuôi!"));
  const wrapper = await mountSheet();
  await pickPond(wrapper, "Ao 1");
  await submit(wrapper);
  expect(wrapper.find(".new-session__error").text()).toBe("Vụ đã kết thúc, hãy chọn vụ đang nuôi!");
  expect(wrapper.emitted("created")).toBeUndefined();
});
