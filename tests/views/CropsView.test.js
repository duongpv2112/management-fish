import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/pondAPI", () => ({ default: { getPonds: vi.fn() } }));
vi.mock("@/services/cropAPI", () => ({
  default: { getCrops: vi.fn(), createCrop: vi.fn(), closeCrop: vi.fn() },
}));

import PondAPI from "@/services/pondAPI";
import CropAPI from "@/services/cropAPI";
import CropsView from "@/views/Crops/CropsView.vue";

const ao1 = { _id: "p1", pondName: "Ao 1" };
const ao2 = { _id: "p2", pondName: "Ao 2" };
const openCrop = { _id: "c1", cropName: "Ao 1 · Vụ 09/2026", status: "open", startDate: "2026-09-01T00:00:00.000Z", endDate: null, pond: ao1 };
const closedCrop = {
  _id: "c0",
  cropName: "Ao 2 · Vụ 01/2026",
  status: "closed",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-20T00:00:00.000Z",
  pond: ao2,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(PondAPI.getPonds).mockResolvedValue({ data: [ao1, ao2] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [openCrop, closedCrop] });
});

const mountView = async () => {
  const wrapper = mount(CropsView);
  await flushPromises();
  return wrapper;
};

test("mỗi ao một thẻ; ao có vụ hiện tên vụ, ngày thả, số ngày, nút Kết thúc vụ", async () => {
  const cards = (await mountView()).findAll(".pond-card");
  expect(cards).toHaveLength(2);
  expect(cards[0].text()).toContain("Ao 1");
  expect(cards[0].text()).toContain("Ao 1 · Vụ 09/2026");
  expect(cards[0].text()).toContain("Thả ngày 01/09/2026");
  expect(cards[0].text()).toMatch(/\d+ ngày/);
  expect(cards[0].text()).toContain("Kết thúc vụ");
  expect(cards[1].text()).toContain("Chưa có vụ nuôi");
  expect(cards[1].text()).toContain("Bắt đầu vụ mới");
});

test("mục Vụ đã kết thúc liệt kê vụ đã đóng với khoảng ngày", async () => {
  const wrapper = await mountView();
  const closed = wrapper.find(".crops__closed");
  expect(closed.text()).toContain("Vụ đã kết thúc");
  expect(closed.text()).toContain("Ao 2 · Vụ 01/2026");
  expect(closed.text()).toContain("10/01/2026 – 20/06/2026");
});

test("bấm Bắt đầu vụ mới mở sheet; lưu xong tải lại", async () => {
  vi.mocked(CropAPI.createCrop).mockResolvedValue({ data: {} });
  const wrapper = await mountView();
  await wrapper.findAll(".pond-card")[1].find(".btn-start-crop button").trigger("click");
  expect(wrapper.find(".crop-sheet").exists()).toBe(true);
  await wrapper.find(".btn-crop-submit button").trigger("click");
  await flushPromises();
  expect(CropAPI.createCrop).toHaveBeenCalledWith(expect.objectContaining({ pondId: "p2" }));
  expect(CropAPI.getCrops).toHaveBeenCalledTimes(2);
  expect(wrapper.find(".crop-sheet").exists()).toBe(false);
});

test("không có ao → hướng dẫn thêm ao trong Danh mục", async () => {
  vi.mocked(PondAPI.getPonds).mockResolvedValue({ data: [] });
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [] });
  const wrapper = await mountView();
  expect(wrapper.text()).toContain("Chưa có ao");
  expect(wrapper.find('a[href="#/danh-muc"]').exists()).toBe(true);
});

test("lỗi tải → thông báo lỗi", async () => {
  vi.mocked(PondAPI.getPonds).mockRejectedValue(new Error("Mất kết nối"));
  const wrapper = await mountView();
  expect(wrapper.find(".crops__error").text()).toBe("Không thể tải danh sách ao, vui lòng thử lại sau.");
});

test("vụ đã kết thúc hiện cả tên ao (tên vụ tự đặt không chứa tên ao)", async () => {
  vi.mocked(CropAPI.getCrops).mockResolvedValue({ data: [{ ...closedCrop, cropName: "Vụ xuân" }] });
  const closed = (await mountView()).find(".crops__closed-item");
  expect(closed.text()).toContain("Ao 2");
  expect(closed.text()).toContain("Vụ xuân");
});
