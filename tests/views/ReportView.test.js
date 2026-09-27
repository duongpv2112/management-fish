import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

vi.mock("chart.js/auto", () => ({ default: class { destroy() {} } }));
vi.mock("@/services/reportAPI", () => ({ default: { getOverview: vi.fn() } }));

import ReportAPI from "@/services/reportAPI";
import ReportView from "@/views/Report/ReportView.vue";
import ProfitChart from "@/views/Report/components/ProfitChart.vue";
import { chooseOption } from "../helpers/select";

const year = new Date().getFullYear();

const row = (id, pondName, cropName, { revenue, expense, startDate, endDate = null, status = "closed" }) => ({
  crop: {
    _id: id,
    cropName,
    pond: { _id: `p-${id}`, pondName },
    startDate,
    endDate,
    status,
    days: 100,
  },
  revenue,
  expense,
  profit: revenue - expense,
});

const overview = (overrides = {}) => ({
  period: { from: `${year}-01-01`, to: `${year}-12-31` },
  crops: [
    row("c1", "Ao 1", "Vụ 03/2026", {
      revenue: 50000000,
      expense: 30000000,
      startDate: "2026-03-01T00:00:00.000Z",
      endDate: "2026-08-15T00:00:00.000Z",
    }),
    row("c2", "Ao 2", "Vụ 04/2026", {
      revenue: 10000000,
      expense: 12000000,
      startDate: "2026-04-01T00:00:00.000Z",
      endDate: "2026-09-01T00:00:00.000Z",
    }),
  ],
  openCrops: [
    row("c3", "Ao 3", "Vụ 07/2026", {
      revenue: 0,
      expense: 5000000,
      startDate: "2026-07-01T00:00:00.000Z",
      status: "open",
    }),
  ],
  cropsTotal: { revenue: 60000000, expense: 42000000, profit: 18000000 },
  commonExpense: {
    total: 600000,
    byCategory: [{ category: { _id: "d", categoryName: "Điện", metric: "none" }, amount: 600000, percent: 100, count: 1 }],
  },
  netProfit: 17400000,
  excludedForeignCurrency: 0,
  includeOpen: false,
  ...overrides,
});

const emptyOverview = () =>
  overview({
    crops: [],
    openCrops: [],
    cropsTotal: { revenue: 0, expense: 0, profit: 0 },
    commonExpense: { total: 0, byCategory: [] },
    netProfit: 0,
  });

const mountView = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/bao-cao", name: "report", component: ReportView },
      { path: "/vu-nuoi/:cropId", name: "crop-report", component: { template: "<div />" } },
    ],
  });
  router.push("/bao-cao");
  await router.isReady();
  const wrapper = mount(ReportView, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({ data: overview() });
});

test("mặc định năm nay; ô chọn kỳ có năm nay, 4 năm trước và Tùy chọn", async () => {
  const { wrapper } = await mountView();
  expect(ReportAPI.getOverview).toHaveBeenCalledWith({ from: `${year}-01-01`, to: `${year}-12-31`, includeOpen: 0 });
  await wrapper.find("#reportPeriod").trigger("click");
  const values = wrapper.findAll("#reportPeriod-list [data-value]").map((option) => option.attributes("data-value"));
  expect(values).toEqual([year, year - 1, year - 2, year - 3, year - 4].map(String).concat("custom"));
  expect(wrapper.find("#reportPeriod-list").text()).toContain("Tùy chọn");
});

test("mỗi vụ một dòng; bấm dòng → báo cáo vụ", async () => {
  const { wrapper, router } = await mountView();
  const rows = wrapper.findAll(".report-crops .report-crop-row");
  expect(rows).toHaveLength(2);
  const first = rows[0].text();
  expect(first).toContain("Ao 1");
  expect(first).toContain("Vụ 03/2026");
  expect(first).toContain("01/03/2026");
  expect(first).toContain("15/08/2026");
  expect(first).toContain("50.000.000");
  expect(first).toContain("30.000.000");
  expect(first).toContain("Lãi");
  expect(first).toContain("20.000.000");
  const second = rows[1].text();
  expect(second).toContain("Lỗ");
  expect(second).toContain("2.000.000");
  expect(second).not.toContain("-2.000.000");
  expect(rows[1].classes()).toContain("report-crop-row--loss");

  await rows[0].trigger("click");
  await flushPromises();
  expect(router.currentRoute.value.name).toBe("crop-report");
  expect(router.currentRoute.value.params.cropId).toBe("c1");
});

test("tổng các vụ, chi phí chung theo nhóm, lãi ròng cả nhà", async () => {
  const { wrapper } = await mountView();
  const total = wrapper.find(".report-crops-total").text();
  expect(total).toContain("60.000.000");
  expect(total).toContain("42.000.000");
  expect(total).toContain("18.000.000");
  const common = wrapper.find(".report-common").text();
  expect(common).toContain("Chi phí chung");
  expect(common).toContain("Điện · 600.000 đ");
  const net = wrapper.find(".report-net");
  expect(net.text()).toContain("Lãi ròng cả nhà");
  expect(net.text()).toContain("17.400.000");
  expect(net.classes()).not.toContain("report-net--loss");
});

test("lỗ ròng → chữ Lỗ ròng, không dấu trừ", async () => {
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({ data: overview({ netProfit: -3000000 }) });
  const { wrapper } = await mountView();
  const net = wrapper.find(".report-net");
  expect(net.text()).toContain("Lỗ ròng cả nhà");
  expect(net.text()).toContain("3.000.000");
  expect(net.text()).not.toContain("-");
  expect(net.classes()).toContain("report-net--loss");
});

test("vụ đang nuôi (tạm tính); bật công tắc → gọi lại với includeOpen 1", async () => {
  const { wrapper } = await mountView();
  const open = wrapper.find(".report-open").text();
  expect(open).toContain("Đang nuôi (tạm tính)");
  expect(open).toContain("Ao 3");
  expect(open).toContain("Vụ 07/2026");
  expect(wrapper.findAll(".report-open .report-crop-row")).toHaveLength(1);

  await wrapper.find("#includeOpen").setValue(true);
  await flushPromises();
  expect(ReportAPI.getOverview).toHaveBeenLastCalledWith({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    includeOpen: 1,
  });
});

test("chọn năm trước → gọi với năm đó", async () => {
  const { wrapper } = await mountView();
  await chooseOption(wrapper, "#reportPeriod", String(year - 1));
  await flushPromises();
  expect(ReportAPI.getOverview).toHaveBeenLastCalledWith({
    from: `${year - 1}-01-01`,
    to: `${year - 1}-12-31`,
    includeOpen: 0,
  });
});

test("Tùy chọn: kiểm tra khoảng ngày trước khi gọi API", async () => {
  const { wrapper } = await mountView();
  expect(wrapper.find("#reportFrom").exists()).toBe(false);
  await chooseOption(wrapper, "#reportPeriod", "custom");
  await flushPromises();
  expect(ReportAPI.getOverview).toHaveBeenCalledTimes(1);
  expect(wrapper.find("#reportFrom").exists()).toBe(true);
  expect(wrapper.find("#reportTo").exists()).toBe(true);

  await wrapper.find("#reportFrom").setValue("2026-06-01");
  await wrapper.find("#reportTo").setValue("");
  await wrapper.find(".btn-apply-range button").trigger("click");
  expect(wrapper.find(".report__range-error").text()).toBe("Vui lòng chọn đủ từ ngày và đến ngày.");
  expect(ReportAPI.getOverview).toHaveBeenCalledTimes(1);

  await wrapper.find("#reportTo").setValue("2026-05-01");
  await wrapper.find(".btn-apply-range button").trigger("click");
  expect(wrapper.find(".report__range-error").text()).toBe("Ngày kết thúc không được trước ngày bắt đầu!");
  expect(ReportAPI.getOverview).toHaveBeenCalledTimes(1);

  await wrapper.find("#reportTo").setValue("2026-09-30");
  await wrapper.find(".btn-apply-range button").trigger("click");
  await flushPromises();
  expect(wrapper.find(".report__range-error").exists()).toBe(false);
  expect(ReportAPI.getOverview).toHaveBeenLastCalledWith({ from: "2026-06-01", to: "2026-09-30", includeOpen: 0 });
});

test("phiên USD không được tính", async () => {
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({ data: overview({ excludedForeignCurrency: 2 }) });
  const { wrapper } = await mountView();
  expect(wrapper.text()).toContain("Có 2 phiên bằng USD không được tính");
});

test("kỳ trống", async () => {
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({ data: emptyOverview() });
  const { wrapper } = await mountView();
  expect(wrapper.text()).toContain("Chưa có vụ nào kết thúc trong kỳ.");
  expect(wrapper.findAll(".report-crop-row")).toHaveLength(0);
  expect(wrapper.find(".report-open").exists()).toBe(false);
  expect(wrapper.find(".report-net").text()).toContain("0 đ");
  expect(wrapper.findComponent(ProfitChart).props("rows")).toEqual([]);
});

test("biểu đồ nhận vụ trong kỳ (+ vụ đang nuôi khi bật công tắc)", async () => {
  const { wrapper } = await mountView();
  expect(wrapper.findComponent(ProfitChart).props("rows")).toEqual([
    { label: "Ao 1 · Vụ 03/2026", profit: 20000000 },
    { label: "Ao 2 · Vụ 04/2026", profit: -2000000 },
  ]);
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({ data: overview({ includeOpen: true }) });
  await wrapper.find("#includeOpen").setValue(true);
  await flushPromises();
  expect(wrapper.findComponent(ProfitChart).props("rows")).toHaveLength(3);
  expect(wrapper.findComponent(ProfitChart).props("rows")[2]).toEqual({ label: "Ao 3 · Vụ 07/2026", profit: -5000000 });
});

test("in: vùng in, bộ lọc/công tắc/nút In không in", async () => {
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const { wrapper } = await mountView();
  expect(wrapper.classes()).toContain("print-area");
  expect(wrapper.find("#reportPeriod").element.closest(".no-print")).not.toBeNull();
  expect(wrapper.find("#includeOpen").element.closest(".no-print")).not.toBeNull();
  const button = wrapper.find(".btn-print-overview");
  expect(button.element.closest(".no-print")).not.toBeNull();
  await button.find("button").trigger("click");
  expect(print).toHaveBeenCalledTimes(1);
  print.mockRestore();
});

test("lỗi tải", async () => {
  vi.mocked(ReportAPI.getOverview).mockRejectedValue(new Error("mạng"));
  const { wrapper } = await mountView();
  expect(wrapper.text()).toContain("Không thể tải báo cáo tổng, vui lòng thử lại sau.");
});

test("tên vụ mặc định đã có tên ao → không lặp tên ao", async () => {
  const base = overview();
  const crop = { ...base.crops[0].crop, cropName: "Ao 1 · Vụ 09/2026" };
  vi.mocked(ReportAPI.getOverview).mockResolvedValue({
    data: overview({ crops: [{ ...base.crops[0], crop }] }),
  });
  const { wrapper } = await mountView();
  const text = wrapper.find(".report-crops .report-crop-row").text();
  expect(text).toContain("Ao 1 · Vụ 09/2026");
  expect(text).not.toContain("Ao 1 · Ao 1");
  expect(wrapper.findComponent(ProfitChart).props("rows")[0].label).toBe("Ao 1 · Vụ 09/2026");
});

// Promise tự điều khiển để giả lập phản hồi về chậm
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
};

test("phản hồi cũ về sau không đè kết quả mới", async () => {
  const { wrapper } = await mountView();
  const slow = deferred();
  const fast = deferred();
  vi.mocked(ReportAPI.getOverview).mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);

  await chooseOption(wrapper, "#reportPeriod", String(year - 1));
  await chooseOption(wrapper, "#reportPeriod", String(year - 2));
  fast.resolve({ data: overview({ period: { from: `${year - 2}-01-01`, to: `${year - 2}-12-31` } }) });
  await flushPromises();
  slow.resolve({ data: overview({ period: { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` } }) });
  await flushPromises();

  expect(wrapper.find(".overview__period").text()).toContain(`01/01/${year - 2}`);
});

test("lỗi của yêu cầu cũ không che kết quả mới", async () => {
  const { wrapper } = await mountView();
  const slow = deferred();
  vi.mocked(ReportAPI.getOverview)
    .mockReturnValueOnce(slow.promise)
    .mockResolvedValueOnce({ data: overview({ period: { from: `${year - 2}-01-01`, to: `${year - 2}-12-31` } }) });

  await chooseOption(wrapper, "#reportPeriod", String(year - 1));
  await chooseOption(wrapper, "#reportPeriod", String(year - 2));
  await flushPromises();
  slow.resolve(Promise.reject(new Error("mạng")));
  await flushPromises();

  expect(wrapper.find(".overview__error").exists()).toBe(false);
  expect(wrapper.find(".overview__period").text()).toContain(`01/01/${year - 2}`);
});

test("đang tải lại → hiện Đang tải…, xong thì ẩn", async () => {
  const { wrapper } = await mountView();
  expect(wrapper.find(".overview__reloading").exists()).toBe(false);
  const pending = deferred();
  vi.mocked(ReportAPI.getOverview).mockReturnValueOnce(pending.promise);

  await chooseOption(wrapper, "#reportPeriod", String(year - 1));
  expect(wrapper.find(".overview__reloading").text()).toBe("Đang tải...");
  pending.resolve({ data: overview() });
  await flushPromises();
  expect(wrapper.find(".overview__reloading").exists()).toBe(false);
});

test("kỳ không có hôm nay → ẩn vụ đang nuôi và công tắc, không tính vụ đang nuôi", async () => {
  const { wrapper } = await mountView();
  await wrapper.find("#includeOpen").setValue(true);
  await flushPromises();

  vi.mocked(ReportAPI.getOverview).mockResolvedValueOnce({
    data: overview({ period: { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` } }),
  });
  await chooseOption(wrapper, "#reportPeriod", String(year - 1));
  await flushPromises();
  expect(ReportAPI.getOverview).toHaveBeenLastCalledWith({
    from: `${year - 1}-01-01`,
    to: `${year - 1}-12-31`,
    includeOpen: 0,
  });
  expect(wrapper.find("#includeOpen").exists()).toBe(false);
  expect(wrapper.find(".report-open").exists()).toBe(false);

  // Quay lại năm nay → công tắc vẫn giữ trạng thái bật
  await chooseOption(wrapper, "#reportPeriod", String(year));
  await flushPromises();
  expect(ReportAPI.getOverview).toHaveBeenLastCalledWith({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    includeOpen: 1,
  });
  expect(wrapper.find(".report-open").exists()).toBe(true);
});
