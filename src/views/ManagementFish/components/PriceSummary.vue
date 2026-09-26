<template>
  <div class="price-summary">
    <div v-if="!sessionId" class="price-summary__empty">Chưa có phiên cân.</div>
    <template v-else>
      <div class="error-message no-print" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="price-summary__currency no-print" v-if="summary">
        <label for="currencySelect">Loại tiền</label>
        <select
          id="currencySelect"
          :value="currency"
          :disabled="isSaving"
          @change="changeCurrency($event)"
        >
          <option v-for="(item, code) in CURRENCIES" :key="code" :value="code">{{ item.label }}</option>
        </select>
      </div>

      <!-- Vùng in phiếu: khi in chỉ in phần này -->
      <div class="price-summary__print-area" v-if="summary">
        <div class="price-summary__header">
          <div class="price-summary__title">{{ summary.session.sessionName }}</div>
          <div v-if="summary.session.buyerName">Người mua: {{ summary.session.buyerName }}</div>
          <div>Ngày: {{ common.formatDateWithType(summary.session.createdAt, "DD/MM/YYYY") }}</div>
        </div>

        <table class="price-summary__table">
          <thead>
            <tr>
              <th>Loại cá</th>
              <th class="number">Số lần cân</th>
              <th class="number">Tổng cân (kg)</th>
              <th class="number">Trừ giỏ còn (kg)</th>
              <th class="number">Đơn giá ({{ currencySymbol }}/kg)</th>
              <th class="number">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="summary.lines.length === 0">
              <td colspan="6" class="price-summary__no-data">Chưa có lần cân nào trong phiên.</td>
            </tr>
            <tr v-for="line in summary.lines" :key="line.fishTypeId">
              <td>{{ line.fishName }}</td>
              <td class="number">{{ line.count }}</td>
              <td class="number">{{ formatKg(line.totalGross) }}</td>
              <td class="number">{{ formatKg(line.totalNet) }}</td>
              <td class="number">
                <div class="price-input-wrapper no-print">
                  <input
                    :id="`price-${line.fishTypeId}`"
                    class="price-input"
                    :inputmode="currency === 'VND' ? 'numeric' : 'decimal'"
                    placeholder="Nhập giá"
                    :value="priceInputs[line.fishTypeId]"
                    :disabled="isSaving"
                    @input="priceInputs[line.fishTypeId] = $event.target.value"
                    @blur="savePrice(line)"
                    @keydown.enter="$event.target.blur()"
                  />
                  <span class="price-input-symbol">{{ currencySymbol }}</span>
                </div>
                <span class="print-only">{{ line.unitPrice === null ? "" : formatMoney(line.unitPrice) }}</span>
              </td>
              <td class="number">
                <span v-if="line.amount === null" class="price-summary__missing">Chưa nhập giá</span>
                <span v-else>{{ formatMoney(line.amount) }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Tổng cộng</td>
              <td></td>
              <td></td>
              <td class="number">{{ formatKg(summary.totalNet) }}</td>
              <td></td>
              <td class="number">
                {{ formatMoney(summary.totalAmount) }}
                <div v-if="summary.missingPriceCount > 0" class="price-summary__missing">
                  (thiếu giá {{ summary.missingPriceCount }} loại cá)
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="price-summary__actions no-print">
        <CPButton class="btn-print" textButton="In phiếu" height="36px" @click="printSummary" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

import CPButton from "@/components/ButtonComponent.vue";
import WeighSessionAPI from "@/services/weighSessionAPI";
import { common } from "@/common/common";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney as formatCurrencyMoney,
  formatPriceInput,
  parseMoney,
} from "@/common/currency";

const props = defineProps({
  sessionId: {
    type: String,
    default: null,
  },
  // Tăng lên để buộc tải lại (ví dụ sau khi thêm/sửa lần cân)
  refreshKey: {
    type: Number,
    default: 0,
  },
});

const summary = ref(null);
const errorMessage = ref("");
const isSaving = ref(false);
// Giá đang hiển thị trong ô nhập, theo fishTypeId
const priceInputs = reactive({});

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");
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
  if (!props.sessionId) {
    summary.value = null;
    return;
  }
  try {
    const result = await WeighSessionAPI.getSessionSummary(props.sessionId);
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
    await WeighSessionAPI.updateSessionPrices(props.sessionId, prices);
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
    await WeighSessionAPI.updateSessionCurrency(props.sessionId, newCurrency);
    await loadSummary();
  } catch (error) {
    errorMessage.value = error?.message || "Đổi loại tiền không thành công!";
    select.value = currency.value;
  } finally {
    isSaving.value = false;
  }
};

const printSummary = () => {
  window.print();
};

watch(() => [props.sessionId, props.refreshKey], loadSummary, { immediate: true });
</script>

<style lang="scss" scoped>
.price-summary {
  width: 100%;

  .price-summary__empty,
  .price-summary__no-data {
    text-align: center;
    color: $color-text-primary;
    padding: 16px 0;
  }

  .error-message {
    margin-bottom: 12px;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .price-summary__header {
    margin-bottom: 12px;
    font-size: 14px;
    color: $color-text-primary;

    .price-summary__title {
      font-weight: 600;
      font-size: 16px;
      color: $color-primary;
    }
  }

  .price-summary__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th,
    td {
      border: 1px solid $color-border;
      padding: 6px 8px;
      text-align: left;
    }

    th {
      background-color: $color-secondary;
      color: $color-card-background;
      font-weight: 600;
    }

    .number {
      text-align: right;
    }

    tfoot td {
      font-weight: 600;
    }

    .price-input-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .price-input {
      width: 100px;
      padding: 4px 8px;
      border: 1px solid $color-border;
      border-radius: 4px;
      text-align: right;

      &:focus {
        outline: none;
        border-color: $color-primary;
      }
    }

    .price-input-symbol {
      min-width: 12px;
      color: $color-text-primary;
    }
  }

  .price-summary__currency {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: $color-text-primary;

    label {
      font-weight: 600;
    }

    select {
      padding: 4px 8px;
      border: 1px solid $color-border;
      border-radius: 4px;
      background-color: $color-card-background;

      &:focus {
        outline: none;
        border-color: $color-primary;
      }
    }
  }

  .price-summary__missing {
    color: $color-error;
    font-size: 12px;
  }

  .price-summary__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .print-only {
    display: none;
  }
}
</style>

<style lang="scss">
// Khi in phiếu: chỉ in tên phiên, người mua, ngày và bảng tổng hợp
@media print {
  body * {
    visibility: hidden;
  }

  .price-summary__print-area,
  .price-summary__print-area * {
    visibility: visible;
  }

  .price-summary__print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .price-summary .no-print {
    display: none !important;
  }

  .price-summary .print-only {
    display: inline !important;
  }
}
</style>
