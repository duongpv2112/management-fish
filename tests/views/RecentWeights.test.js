import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/fishWeightAPI", () => ({ default: { deleteFishWeight: vi.fn() } }));

import FishWeightAPI from "@/services/fishWeightAPI";
import RecentWeights from "@/views/ManagementFish/components/RecentWeights.vue";

const at = (hour, minute) => new Date(2026, 8, 26, hour, minute).toISOString();

const fishData = [
  {
    _id: "f1",
    fishName: "Cá trắm",
    fishWeightItems: [
      { _id: "w1", fishWeight: 25.5, netWeight: 23.5, basketWeightSnapshot: 2, basketType: "b1", createdAt: at(7, 1) },
      { _id: "w3", fishWeight: 20, netWeight: 18, basketWeightSnapshot: 2, basketType: "b1", createdAt: at(7, 3) },
    ],
  },
  {
    _id: "f2",
    fishName: "Cá mè",
    fishWeightItems: [
      { _id: "w2", fishWeight: 8, netWeight: 7, basketWeightSnapshot: 1, basketType: "b2", createdAt: at(7, 2) },
    ],
  },
];
const basketTypes = [
  { _id: "b1", basketName: "Giỏ to", basketWeight: 2 },
  { _id: "b2", basketName: "Giỏ nhỏ", basketWeight: 1 },
];

const mountList = (props = {}) => mount(RecentWeights, { props: { fishData, basketTypes, ...props } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

test("liệt kê lần cân mới nhất trước, kèm giờ, loại cá, giỏ, số cân thực", () => {
  const rows = mountList().findAll(".recent-weight");
  expect(rows.map((row) => row.find(".recent-weight__time").text())).toEqual(["07:03", "07:02", "07:01"]);
  expect(rows[0].text()).toContain("Cá trắm");
  expect(rows[0].text()).toContain("Giỏ to");
  expect(rows[0].text()).toContain("18 kg");
  expect(rows[2].text()).toContain("23,5 kg");
  expect(rows[2].text()).toContain("Tổng 25,5 − giỏ 2");
});

test("chỉ hiện tối đa limit lần cân", () => {
  expect(mountList({ limit: 2 }).findAll(".recent-weight")).toHaveLength(2);
});

test("chưa có lần cân → thông báo trống", () => {
  const wrapper = mountList({ fishData: [] });
  expect(wrapper.find(".recent-weights__empty").text()).toBe("Chưa có lần cân nào trong phiên.");
});

test("bấm Sửa → emit edit với _id, loại cá và tên cá", async () => {
  const wrapper = mountList();
  await wrapper.findAll(".btn-recent-edit")[1].trigger("click");
  expect(wrapper.emitted().edit[0][0]).toMatchObject({ _id: "w2", fishType: "f2", fishName: "Cá mè", fishWeight: 8 });
});

test("bấm Xóa → hỏi xác nhận, đồng ý thì xóa rồi emit deleted", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(FishWeightAPI.deleteFishWeight).mockResolvedValue({ success: true });
  const wrapper = mountList();
  await wrapper.findAll(".btn-recent-delete")[0].trigger("click");
  await flushPromises();
  expect(confirmSpy).toHaveBeenCalledWith('Xóa lần cân 18 kg "Cá trắm" lúc 07:03?');
  expect(FishWeightAPI.deleteFishWeight).toHaveBeenCalledWith("w3");
  expect(wrapper.emitted().deleted).toHaveLength(1);
});

test("bấm Xóa rồi Hủy → không gọi API", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = mountList();
  await wrapper.findAll(".btn-recent-delete")[0].trigger("click");
  expect(FishWeightAPI.deleteFishWeight).not.toHaveBeenCalled();
});

test("xóa lỗi → hiện message, không emit", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(FishWeightAPI.deleteFishWeight).mockRejectedValue(new Error("Phiên cân đã kết thúc!"));
  const wrapper = mountList();
  await wrapper.findAll(".btn-recent-delete")[0].trigger("click");
  await flushPromises();
  expect(wrapper.find(".error-message").text()).toBe("Phiên cân đã kết thúc!");
  expect(wrapper.emitted().deleted).toBeUndefined();
});
