import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

vi.mock("@/services/weighSessionAPI", () => ({
  default: { getSessionSummary: vi.fn(), updateSessionPrices: vi.fn(), updateSessionCurrency: vi.fn() },
}));

import WeighSessionAPI from "@/services/weighSessionAPI";
import { useSessionSummary } from "@/composables/useSessionSummary";

const summaryData = () => ({
  session: { _id: "s1", sessionName: "Phiên 26/09/2026", currency: "VND" },
  lines: [
    { fishTypeId: "f1", fishName: "Cá trắm", count: 1, totalGross: 20, totalNet: 18, unitPrice: 45000, amount: 810000 },
    { fishTypeId: "f2", fishName: "Cá mè", count: 1, totalGross: 7, totalNet: 5, unitPrice: null, amount: null },
  ],
  totalNet: 23,
  totalAmount: 810000,
  missingPriceCount: 1,
});

// Bọc composable trong một component để có vòng đời watch như khi dùng thật
const mountComposable = async (sessionId = "s1") => {
  const sessionIdRef = ref(sessionId);
  const refreshKeyRef = ref(0);
  let state;
  const wrapper = mount({
    setup() {
      state = useSessionSummary(sessionIdRef, refreshKeyRef);
      return {};
    },
    template: "<div />",
  });
  await flushPromises();
  return { wrapper, state, sessionIdRef, refreshKeyRef };
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(WeighSessionAPI.getSessionSummary).mockResolvedValue({ success: true, data: summaryData() });
});

test("tải tổng hợp theo phiên, ô giá định dạng theo loại tiền", async () => {
  const { state } = await mountComposable();
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledWith("s1");
  expect(state.summary.value.lines).toHaveLength(2);
  expect(state.currency.value).toBe("VND");
  expect(state.currencySymbol.value).toBe("đ");
  expect(state.priceInputs.f1).toBe("45.000");
  expect(state.priceInputs.f2).toBe("");
  expect(state.formatMoney(810000)).toBe("810.000 đ");
});

test("đổi phiên hoặc refreshKey → tải lại; không có phiên → summary null", async () => {
  const { state, sessionIdRef, refreshKeyRef } = await mountComposable();
  refreshKeyRef.value++;
  await flushPromises();
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledTimes(2);
  sessionIdRef.value = null;
  await flushPromises();
  expect(state.summary.value).toBeNull();
});

test("savePrice gửi toàn bộ bảng giá rồi tải lại", async () => {
  vi.mocked(WeighSessionAPI.updateSessionPrices).mockResolvedValue({ success: true });
  const { state } = await mountComposable();
  state.priceInputs.f2 = "40.000";
  await state.savePrice(state.summary.value.lines[1]);
  expect(WeighSessionAPI.updateSessionPrices).toHaveBeenCalledWith("s1", [
    { fishType: "f1", unitPrice: 45000 },
    { fishType: "f2", unitPrice: 40000 },
  ]);
  expect(WeighSessionAPI.getSessionSummary).toHaveBeenCalledTimes(2);
});

test("changeCurrency: bấm Hủy → không gọi API, ô chọn trở về loại cũ", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const { state } = await mountComposable();
  const select = { value: "USD" };
  await state.changeCurrency({ target: select });
  expect(WeighSessionAPI.updateSessionCurrency).not.toHaveBeenCalled();
  expect(select.value).toBe("VND");
});
