import { computed, reactive, ref, watch } from "vue";

import WeighSessionAPI from "@/services/weighSessionAPI";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney as formatCurrencyMoney,
  formatPriceInput,
  parseMoney,
} from "@/common/currency";

/**
 * Tổng hợp tiền của một phiên: tải, lưu đơn giá, đổi loại tiền.
 * Dùng chung cho PriceSummary (bảng, máy tính) và PriceCards (thẻ, điện thoại).
 * @param {import("vue").Ref<string|null>} sessionIdRef
 * @param {import("vue").Ref<number>} refreshKeyRef tăng lên để buộc tải lại
 */
export const useSessionSummary = (sessionIdRef, refreshKeyRef) => {
  const summary = ref(null);
  const errorMessage = ref("");
  const isSaving = ref(false);
  // Giá đang hiển thị trong ô nhập, theo fishTypeId
  const priceInputs = reactive({});

  // Loại tiền của phiên (phiên cũ chưa có trường này là VND)
  const currency = computed(() => summary.value?.session?.currency ?? DEFAULT_CURRENCY);
  const currencySymbol = computed(() => (CURRENCIES[currency.value] ?? CURRENCIES[DEFAULT_CURRENCY]).symbol);
  const formatMoney = (value) => formatCurrencyMoney(value, currency.value);
  const formatUnitPrice = (value) => formatPriceInput(value, currency.value);

  const resetPriceInputs = () => {
    Object.keys(priceInputs).forEach((key) => delete priceInputs[key]);
    summary.value?.lines.forEach((line) => {
      priceInputs[line.fishTypeId] = formatUnitPrice(line.unitPrice);
    });
  };

  const loadSummary = async () => {
    if (!sessionIdRef.value) {
      summary.value = null;
      return;
    }
    try {
      const result = await WeighSessionAPI.getSessionSummary(sessionIdRef.value);
      summary.value = result?.data ?? null;
      resetPriceInputs();
    } catch (error) {
      errorMessage.value = error?.message || "Không thể tải tổng hợp phiên cân.";
    }
  };

  // Rời ô đơn giá: gửi lại toàn bộ bảng giá (giữ giá các loại cá khác), rồi tải lại tổng hợp
  const savePrice = async (line) => {
    // VND: "40.000" hay "40000" đều là 40000; USD: "2,5" hay "2.50" là 2.5; ô trống là chưa có giá
    const newPrice = parseMoney(priceInputs[line.fishTypeId], currency.value);
    if (newPrice === line.unitPrice) {
      priceInputs[line.fishTypeId] = formatUnitPrice(line.unitPrice);
      return;
    }

    const prices = summary.value.lines
      .map((item) => ({
        fishType: item.fishTypeId,
        unitPrice: item.fishTypeId === line.fishTypeId ? newPrice : item.unitPrice,
      }))
      .filter((item) => item.unitPrice !== null);

    errorMessage.value = "";
    isSaving.value = true;
    try {
      await WeighSessionAPI.updateSessionPrices(sessionIdRef.value, prices);
      await loadSummary();
    } catch (error) {
      errorMessage.value = error?.message || "Cập nhật giá phiên không thành công!";
      // Trả ô về giá cũ
      priceInputs[line.fishTypeId] = formatUnitPrice(line.unitPrice);
    } finally {
      isSaving.value = false;
    }
  };

  // Đổi loại tiền của phiên: server xóa bảng giá cũ nên hỏi lại nếu đã nhập giá
  const changeCurrency = async ($event) => {
    const select = $event.target;
    const newCurrency = select.value;
    if (newCurrency === currency.value) return;

    const hasPrices = summary.value?.lines.some((line) => line.unitPrice !== null);
    if (hasPrices && !window.confirm("Đổi loại tiền sẽ xóa đơn giá đã nhập của phiên này. Tiếp tục?")) {
      select.value = currency.value;
      return;
    }

    errorMessage.value = "";
    isSaving.value = true;
    try {
      await WeighSessionAPI.updateSessionCurrency(sessionIdRef.value, newCurrency);
      await loadSummary();
    } catch (error) {
      errorMessage.value = error?.message || "Đổi loại tiền không thành công!";
      select.value = currency.value;
    } finally {
      isSaving.value = false;
    }
  };

  watch(() => [sessionIdRef.value, refreshKeyRef.value], loadSummary, { immediate: true });

  return {
    summary,
    priceInputs,
    errorMessage,
    isSaving,
    currency,
    currencySymbol,
    formatMoney,
    loadSummary,
    savePrice,
    changeCurrency,
  };
};
