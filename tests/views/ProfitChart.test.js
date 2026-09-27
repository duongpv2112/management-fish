import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

const chartMock = vi.hoisted(() => {
  const destroy = vi.fn();
  const ctor = vi.fn();
  class FakeChart {
    constructor(canvas, config) {
      ctor(canvas, config);
      this.destroy = destroy;
    }
  }
  return { destroy, ctor, FakeChart };
});
vi.mock("chart.js/auto", () => ({ default: chartMock.FakeChart }));

import ProfitChart from "@/views/Report/components/ProfitChart.vue";

beforeEach(() => {
  chartMock.destroy.mockReset();
  chartMock.ctor.mockReset();
});

const rows = [
  { label: "Ao 1 · Vụ 03/2026", profit: 4000000 },
  { label: "Ao 2 · Vụ 05/2026", profit: -1500000 },
];

test("vẽ cột lãi/lỗ, cột lỗ khác màu", async () => {
  mount(ProfitChart, { props: { rows } });
  await flushPromises();
  expect(chartMock.ctor).toHaveBeenCalledTimes(1);
  const config = chartMock.ctor.mock.calls[0][1];
  expect(config.type).toBe("bar");
  expect(config.data.labels).toEqual(["Ao 1 · Vụ 03/2026", "Ao 2 · Vụ 05/2026"]);
  const dataset = config.data.datasets[0];
  expect(dataset.data).toEqual([4000000, -1500000]);
  expect(dataset.backgroundColor).toHaveLength(2);
  expect(dataset.backgroundColor[1]).not.toBe(dataset.backgroundColor[0]);
});

test("đổi rows → hủy biểu đồ cũ rồi vẽ lại; unmount → hủy", async () => {
  const wrapper = mount(ProfitChart, { props: { rows } });
  await flushPromises();
  await wrapper.setProps({ rows: [rows[0]] });
  await flushPromises();
  expect(chartMock.destroy).toHaveBeenCalledTimes(1);
  expect(chartMock.ctor).toHaveBeenCalledTimes(2);
  expect(chartMock.ctor.mock.calls[1][1].data.labels).toEqual(["Ao 1 · Vụ 03/2026"]);
  wrapper.unmount();
  expect(chartMock.destroy).toHaveBeenCalledTimes(2);
});

test("rows rỗng → không vẽ, hiện chữ", async () => {
  const wrapper = mount(ProfitChart, { props: { rows: [] } });
  await flushPromises();
  expect(chartMock.ctor).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Chưa có vụ nào trong kỳ.");
  expect(wrapper.find("canvas").exists()).toBe(false);
});
