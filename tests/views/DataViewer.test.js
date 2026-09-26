import { test, expect, describe } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DataViewer from "@/views/ManagementFish/components/DataViewer.vue";

const makeData = () => [
  { _id: "f1", fishName: "Cá trắm", fishWeights: Array.from({ length: 12 }, (_, i) => i + 1) },
  { _id: "f2", fishName: "Cá mè", fishWeights: [5] },
];

const pageText = (wrapper) => wrapper.find(".pagination span").text();

test("tìm kiếm khi đang ở trang 3 thì về trang 1", async () => {
  const wrapper = mount(DataViewer);
  wrapper.vm.initDataTable(makeData(), 12);
  await nextTick();
  const next = wrapper.findAll(".page-btn")[1];
  await next.trigger("click");
  await next.trigger("click");
  expect(pageText(wrapper)).toBe("Trang 3 / 3");

  await wrapper.find(".search-input").setValue("trắm");
  expect(pageText(wrapper)).toBe("Trang 1 / 3");
});

test("đổi số dòng mỗi trang thì về trang 1", async () => {
  const wrapper = mount(DataViewer);
  wrapper.vm.initDataTable(makeData(), 12);
  await nextTick();
  await wrapper.findAll(".page-btn")[1].trigger("click");
  await wrapper.find(".items-per-page").setValue(10);
  expect(pageText(wrapper)).toBe("Trang 1 / 2");
});

test("dữ liệu rỗng → Trang 1 / 1, không còn skeleton", async () => {
  const wrapper = mount(DataViewer);
  wrapper.vm.initDataTable([], 0);
  await nextTick();
  expect(pageText(wrapper)).toBe("Trang 1 / 1");
  expect(wrapper.find(".skeleton-loader").exists()).toBe(false);
});

test("bản ghi mới nhất ở trên, không sửa mảng đầu vào", async () => {
  const data = makeData();
  const wrapper = mount(DataViewer);
  wrapper.vm.initDataTable(data, 12);
  await nextTick();
  expect(wrapper.find("tbody tr td").text()).toBe("12");
  expect(data[0].fishWeights[0]).toBe(1);
});

describe("chọn ô để sửa", () => {
  const dataWithItems = () => [
    {
      _id: "f1",
      fishName: "Cá trắm",
      fishWeights: [25, 10],
      fishWeightItems: [
        { _id: "w1", fishWeight: 25, basketType: "b1", createdAt: "2026-09-26T01:00:00Z" },
        { _id: "w2", fishWeight: 10, basketType: "b1", createdAt: "2026-09-26T02:00:00Z" },
      ],
    },
    {
      _id: "f2",
      fishName: "Cá mè",
      fishWeights: [7],
      fishWeightItems: [{ _id: "w3", fishWeight: 7, basketType: null, createdAt: "2026-09-26T03:00:00Z" }],
    },
  ];

  test("click ô có dữ liệu → emit editItem đúng _id và loại cá", async () => {
    const wrapper = mount(DataViewer);
    wrapper.vm.initDataTable(dataWithItems(), 2);
    await nextTick();
    // Hàng 1 (mới nhất): w2 ở cột Cá trắm
    await wrapper.findAll("tbody tr")[0].findAll("td")[0].trigger("click");
    expect(wrapper.emitted().editItem[0][0]).toMatchObject({
      _id: "w2",
      fishWeight: 10,
      fishType: "f1",
      fishName: "Cá trắm",
    });
  });

  test("click ô trống → không emit", async () => {
    const wrapper = mount(DataViewer);
    wrapper.vm.initDataTable(dataWithItems(), 2);
    await nextTick();
    await wrapper.findAll("tbody tr")[1].findAll("td")[1].trigger("click");
    expect(wrapper.emitted().editItem).toBeUndefined();
  });
});
