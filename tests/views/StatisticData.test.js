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

import StatisticData from "@/views/ManagementFish/components/StatisticData.vue";

beforeEach(() => {
  chartMock.destroy.mockReset();
  chartMock.ctor.mockReset();
});

test("vẽ lại biểu đồ khi fishData đổi, hủy biểu đồ cũ", async () => {
  const wrapper = mount(StatisticData, { props: { fishData: [] } });
  await flushPromises();

  await wrapper.setProps({ fishData: [{ fishName: "Cá trắm", fishWeights: [25.5, 10] }] });
  await flushPromises();
  await wrapper.setProps({ fishData: [{ fishName: "Cá trắm", fishWeights: [25.5, 10, 4] }] });
  await flushPromises();

  expect(chartMock.ctor).toHaveBeenCalledTimes(2);
  expect(chartMock.destroy).toHaveBeenCalledTimes(1);
  const firstConfig = chartMock.ctor.mock.calls[0][1];
  expect(firstConfig.data.labels).toEqual(["Cá trắm"]);
  expect(firstConfig.data.datasets[0].data).toEqual([35.5]);
});

test("không tự gọi API", async () => {
  const spy = vi.spyOn(globalThis, "fetch");
  mount(StatisticData, { props: { fishData: [] } });
  await flushPromises();
  expect(spy).not.toHaveBeenCalled();
});

test("hủy biểu đồ khi unmount", async () => {
  const wrapper = mount(StatisticData, {
    props: { fishData: [{ fishName: "Cá mè", fishWeights: [3] }] },
  });
  await flushPromises();
  wrapper.unmount();
  expect(chartMock.destroy).toHaveBeenCalledTimes(1);
});

test("biểu đồ dùng trọng lượng thực nếu có", async () => {
  const wrapper = mount(StatisticData, { props: { fishData: [] } });
  await flushPromises();
  await wrapper.setProps({
    fishData: [
      {
        fishName: "Cá trắm",
        fishWeights: [25.5, 12],
        fishWeightItems: [
          { fishWeight: 25.5, netWeight: 23.5 },
          { fishWeight: 12, netWeight: 10 },
        ],
      },
    ],
  });
  await flushPromises();
  const config = chartMock.ctor.mock.calls[0][1];
  expect(config.data.datasets[0].data).toEqual([33.5]);
  expect(config.data.datasets[0].label).toBe("Trọng lượng thực (kg)");
});
