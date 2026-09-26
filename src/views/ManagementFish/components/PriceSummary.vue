<template>
  <div class="price-summary">
    <div v-if="!sessionId" class="price-summary__empty">Chưa có phiên cân.</div>
    <template v-else>
      <div class="error-message no-print" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="price-summary__currency no-print" v-if="summary">
        <label for="currencySelect">Loại tiền</label>
        <CPSelect
          idControl="currencySelect"
          :modelValue="currency"
          :options="CURRENCY_OPTIONS"
          :disabled="isSaving"
          @change="changeCurrency"
        />
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
import { toRef } from "vue";

import CPButton from "@/components/ButtonComponent.vue";
import { common } from "@/common/common";
import CPSelect from "@/components/SelectComponent.vue";
import { CURRENCY_OPTIONS } from "@/common/currency";
import { useSessionSummary } from "@/composables/useSessionSummary";

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

// Logic tải/lưu giá/đổi tiền dùng chung với PriceCards (điện thoại)
const { summary, priceInputs, errorMessage, isSaving, currency, currencySymbol, formatMoney, savePrice, changeCurrency } =
  useSessionSummary(toRef(props, "sessionId"), toRef(props, "refreshKey"));

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");

const printSummary = () => {
  window.print();
};
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
