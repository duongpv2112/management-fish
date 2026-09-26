import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FishWeightCards from "@/views/ManagementFish/components/FishWeightCards.vue";

const at = (minute) => new Date(2026, 8, 26, 7, minute).toISOString();

const fishData = [
  {
    _id: "f1",
    fishName: "Cá trắm",
    fishWeightItems: [
      { _id: "w1", fishWeight: 20, netWeight: 18, basketWeightSnapshot: 2, basketType: "b1", createdAt: at(1) },
      { _id: "w2", fishWeight: 7.5, netWeight: 5.5, basketWeightSnapshot: 2, basketType: "b1", createdAt: at(5) },
    ],
  },
  { _id: "f2", fishName: "Cá mè", fishWeightItems: [] },
  {
    _id: "f3",
    fishName: "Cá chép",
    fishWeightItems: [{ _id: "w3", fishWeight: 4, basketType: "b1", createdAt: at(3) }],
  },
];

test("mỗi loại cá có lần cân là một thẻ: tổng kg và số lần", () => {
  const cards = mount(FishWeightCards, { props: { fishData } }).findAll(".fish-card");
  expect(cards).toHaveLength(2);
  expect(cards[0].find(".fish-card__name").text()).toBe("Cá trắm");
  expect(cards[0].find(".fish-card__summary").text()).toBe("23,5 kg · 2 lần");
  // Lần cân cũ chưa có netWeight → dùng fishWeight
  expect(cards[1].find(".fish-card__summary").text()).toBe("4 kg · 1 lần");
});

test("các ô số cân mới nhất trước, hiện số cân thực", () => {
  const card = mount(FishWeightCards, { props: { fishData } }).find(".fish-card");
  expect(card.findAll(".fish-card__weight").map((node) => node.text())).toEqual(["5,5", "18"]);
});

test("chạm ô → emit editItem cùng dạng dữ liệu với bảng", async () => {
  const wrapper = mount(FishWeightCards, { props: { fishData } });
  await wrapper.find(".fish-card__weight").trigger("click");
  expect(wrapper.emitted().editItem[0][0]).toMatchObject({
    _id: "w2",
    fishWeight: 7.5,
    netWeight: 5.5,
    fishType: "f1",
    fishName: "Cá trắm",
  });
  expect(wrapper.find(".edit-hint").text()).toBe("Chạm vào số cân để sửa hoặc xóa.");
  expect(wrapper.find(".fish-card__weight").classes()).toContain("fish-card__weight--editable");
});

test("chỉ xem (phiên đã kết thúc) → không emit, không kiểu sửa được", async () => {
  const wrapper = mount(FishWeightCards, { props: { fishData, readOnly: true } });
  const weight = wrapper.find(".fish-card__weight");
  expect(weight.classes()).not.toContain("fish-card__weight--editable");
  await weight.trigger("click");
  expect(wrapper.emitted().editItem).toBeUndefined();
  expect(wrapper.find(".edit-hint").text()).toBe("Phiên đã kết thúc, không sửa được.");
});

test("chưa có lần cân → thông báo trống, không có gợi ý", () => {
  const wrapper = mount(FishWeightCards, { props: { fishData: [{ _id: "f2", fishName: "Cá mè", fishWeightItems: [] }] } });
  expect(wrapper.find(".fish-cards__empty").text()).toBe("Chưa có lần cân nào trong phiên.");
  expect(wrapper.find(".edit-hint").exists()).toBe(false);
});
