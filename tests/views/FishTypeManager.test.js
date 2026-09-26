import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/fishTypeAPI", () => ({
  default: {
    getFishTypes: vi.fn(),
    createFishType: vi.fn(),
    updateFishType: vi.fn(),
    deleteFishType: vi.fn(),
  },
}));

import FishTypeAPI from "@/services/fishTypeAPI";
import FishTypeManager from "@/views/Catalog/components/FishTypeManager.vue";

const list = [
  { _id: "f1", fishName: "Cá trắm" },
  { _id: "f2", fishName: "Cá mè" },
];

const mountManager = async () => {
  const wrapper = mount(FishTypeManager);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(FishTypeAPI.getFishTypes).mockResolvedValue({ success: true, data: list });
});

test("hiển thị danh sách loại cá", async () => {
  const wrapper = await mountManager();
  expect(wrapper.findAll("tbody .catalog-row__name").map((td) => td.text())).toEqual([
    "Cá trắm",
    "Cá mè",
  ]);
});

test("thêm loại cá: gửi tên đã trim và tải lại danh sách", async () => {
  vi.mocked(FishTypeAPI.createFishType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await wrapper.find("#fishType-new-fishName").setValue("  Cá chép ");
  await wrapper.find(".catalog-add button").trigger("click");
  await flushPromises();

  expect(FishTypeAPI.createFishType).toHaveBeenCalledWith({ fishName: "Cá chép" });
  expect(FishTypeAPI.getFishTypes).toHaveBeenCalledTimes(2);
  expect(wrapper.find("#fishType-new-fishName").element.value).toBe("");
  expect(wrapper.text()).toContain("Thêm loại cá thành công!");
});

test("server báo trùng tên: hiện nguyên văn message, giữ giá trị đã nhập", async () => {
  vi.mocked(FishTypeAPI.createFishType).mockRejectedValue(new Error("Tên loại cá đã tồn tại!"));
  const wrapper = await mountManager();
  await wrapper.find("#fishType-new-fishName").setValue("Cá trắm");
  await wrapper.find(".catalog-add button").trigger("click");
  await flushPromises();

  expect(wrapper.find(".error-message").text()).toBe("Tên loại cá đã tồn tại!");
  expect(wrapper.find("#fishType-new-fishName").element.value).toBe("Cá trắm");
});

test("tên rỗng: không gọi API", async () => {
  const wrapper = await mountManager();
  await wrapper.find(".catalog-add button").trigger("click");
  expect(FishTypeAPI.createFishType).not.toHaveBeenCalled();
  expect(wrapper.find(".error-message").text()).toBe("Tên loại cá không được để trống!");
});

test("sửa tại chỗ rồi lưu", async () => {
  vi.mocked(FishTypeAPI.updateFishType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await wrapper.findAll(".btn-edit button")[1].trigger("click");
  await wrapper.find("#fishType-edit-fishName").setValue(" Cá mè hoa ");
  await wrapper.find(".btn-save button").trigger("click");
  await flushPromises();

  expect(FishTypeAPI.updateFishType).toHaveBeenCalledWith("f2", { fishName: "Cá mè hoa" });
  expect(FishTypeAPI.getFishTypes).toHaveBeenCalledTimes(2);
  expect(wrapper.find("#fishType-edit-fishName").exists()).toBe(false);
});

test("hủy sửa: không gọi API", async () => {
  const wrapper = await mountManager();
  await wrapper.findAll(".btn-edit button")[0].trigger("click");
  await wrapper.find(".btn-cancel button").trigger("click");
  expect(FishTypeAPI.updateFishType).not.toHaveBeenCalled();
  expect(wrapper.find("#fishType-edit-fishName").exists()).toBe(false);
});

test("xóa: hỏi xác nhận, bấm hủy thì không gọi API", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = await mountManager();
  await wrapper.findAll(".btn-delete button")[0].trigger("click");
  expect(confirmSpy).toHaveBeenCalledWith('Xóa loại cá "Cá trắm"?');
  expect(FishTypeAPI.deleteFishType).not.toHaveBeenCalled();
});

test("xóa: đồng ý thì gọi API và tải lại", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(FishTypeAPI.deleteFishType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await wrapper.findAll(".btn-delete button")[0].trigger("click");
  await flushPromises();
  expect(FishTypeAPI.deleteFishType).toHaveBeenCalledWith("f1");
  expect(FishTypeAPI.getFishTypes).toHaveBeenCalledTimes(2);
});
