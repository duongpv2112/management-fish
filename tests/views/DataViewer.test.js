import { test, expect } from "vitest";
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
