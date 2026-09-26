import { test, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ChoiceGrid from "@/components/ChoiceGrid.vue";

const names = [
  "Cá trắm",
  "Cá mè",
  "Cá rô phi loại 1",
  "Cá rô phi loại 2",
  "Cá chép",
  "Cá trôi",
  "Cá lăng",
  "Cá rô đồng",
];
const fish = names.map((fishName, index) => ({ _id: `f${index + 1}`, fishName }));

const mountGrid = (props = {}) => {
  const items = props.items ?? fish;
  return mount(ChoiceGrid, {
    props: {
      items,
      modelValue: null,
      valueField: "_id",
      textField: "fishName",
      ranking: items.map((item) => item._id),
      maxVisible: 5,
      idPrefix: "fishType",
      emptyText: "Chưa có loại cá — thêm ở trang Danh mục",
      ...props,
    },
  });
};

const gridTexts = (wrapper) => wrapper.findAll(".choice-grid__item .choice-grid__text").map((node) => node.text());

test("ít loại (≤ maxVisible + 1) → hiện tất cả, không có Loại khác", () => {
  const wrapper = mountGrid({ items: fish.slice(0, 6) });
  expect(gridTexts(wrapper)).toEqual(names.slice(0, 6));
  expect(wrapper.find(".choice-grid__more").exists()).toBe(false);
  wrapper.unmount();
});

test("nhiều loại → 5 nút theo xếp hạng + '＋ Loại khác (3)'", () => {
  const wrapper = mountGrid();
  expect(gridTexts(wrapper)).toEqual(names.slice(0, 5));
  expect(wrapper.find(".choice-grid__more").text()).toBe("＋ Loại khác (3)");
  wrapper.unmount();
});

test("item đang chọn ngoài nhóm hiện được đưa lên vị trí cuối và sáng", () => {
  const wrapper = mountGrid({ modelValue: "f7" });
  expect(gridTexts(wrapper)).toEqual(["Cá trắm", "Cá mè", "Cá rô phi loại 1", "Cá rô phi loại 2", "Cá lăng"]);
  const selected = wrapper.find('.choice-grid__item[aria-pressed="true"]');
  expect(selected.text()).toBe("Cá lăng");
  expect(wrapper.find(".choice-grid__more").text()).toBe("＋ Loại khác (3)");
  wrapper.unmount();
});

test("bấm nút → emit update với id", async () => {
  const wrapper = mountGrid();
  await wrapper.findAll(".choice-grid__item")[1].trigger("click");
  expect(wrapper.emitted().update).toEqual([["f2"]]);
  wrapper.unmount();
});

test("Loại khác: tìm không dấu, chọn → emit và đóng sheet", async () => {
  const wrapper = mountGrid();
  await wrapper.find(".choice-grid__more").trigger("click");
  expect(wrapper.findAll(".choice-grid__option").map((node) => node.text())).toEqual([
    "Cá trôi",
    "Cá lăng",
    "Cá rô đồng",
  ]);

  await wrapper.find(".choice-grid__search").setValue("lang");
  const options = wrapper.findAll(".choice-grid__option");
  expect(options.map((node) => node.text())).toEqual(["Cá lăng"]);

  await options[0].trigger("click");
  expect(wrapper.emitted().update).toEqual([["f7"]]);
  expect(wrapper.find(".bottom-sheet").exists()).toBe(false);
  wrapper.unmount();
});

test("Loại khác: không có kết quả → 'Không tìm thấy'", async () => {
  const wrapper = mountGrid();
  await wrapper.find(".choice-grid__more").trigger("click");
  await wrapper.find(".choice-grid__search").setValue("xyz");
  expect(wrapper.find(".choice-grid__no-result").text()).toBe("Không tìm thấy");
  wrapper.unmount();
});

test("ô tìm được focus khi mở sheet", async () => {
  const focusSpy = vi.spyOn(HTMLInputElement.prototype, "focus");
  const wrapper = mountGrid();
  await wrapper.find(".choice-grid__more").trigger("click");
  await nextTick();
  expect(focusSpy.mock.contexts).toContain(wrapper.find(".choice-grid__search").element);
  focusSpy.mockRestore();
  wrapper.unmount();
});

test("subText hiện dòng phụ (trọng lượng giỏ)", () => {
  const wrapper = mountGrid({
    items: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }],
    textField: "basketName",
    ranking: ["b1"],
    subText: (basket) => `${basket.basketWeight} kg`,
  });
  expect(wrapper.find(".choice-grid__item .choice-grid__text").text()).toBe("Giỏ to");
  expect(wrapper.find(".choice-grid__sub").text()).toBe("2 kg");
  wrapper.unmount();
});

test("danh sách rỗng → thông báo kèm liên kết Danh mục", () => {
  const wrapper = mountGrid({ items: [], ranking: [] });
  const empty = wrapper.find("#fishType .choice-grid__empty");
  expect(empty.text()).toContain("Chưa có loại cá — thêm ở trang Danh mục");
  expect(empty.find('a[href="#/danh-muc"]').exists()).toBe(true);
  wrapper.unmount();
});

test("disabled → mọi nút bị khóa", () => {
  const wrapper = mountGrid({ disabled: true });
  expect(wrapper.findAll("button").every((button) => button.element.disabled)).toBe(true);
  wrapper.unmount();
});
