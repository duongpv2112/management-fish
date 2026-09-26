<template>
  <div class="price-summary__print-area summary-print">
    <!-- Phiếu in đầy đủ (không có ô nhập); điện thoại render ẩn và chỉ hiện khi in.
         Comment nằm trong div để component có một gốc duy nhất (class truyền vào mới được gắn) -->
    <div class="summary-print__header">
      <div class="summary-print__title">{{ summary.session.sessionName }}</div>
      <div v-if="summary.session.buyerName">Người mua: {{ summary.session.buyerName }}</div>
      <div>Ngày: {{ common.formatDateWithType(summary.session.createdAt, "DD/MM/YYYY") }}</div>
    </div>
    <table class="summary-print__table">
      <thead>
        <tr>
          <th>Loại cá</th>
          <th class="number">Số lần cân</th>
          <th class="number">Tổng cân (kg)</th>
          <th class="number">Trừ giỏ còn (kg)</th>
          <th class="number">Đơn giá ({{ symbol }}/kg)</th>
          <th class="number">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="summary.lines.length === 0">
          <td colspan="6">Chưa có lần cân nào trong phiên.</td>
        </tr>
        <tr v-for="line in summary.lines" :key="line.fishTypeId">
          <td>{{ line.fishName }}</td>
          <td class="number">{{ line.count }}</td>
          <td class="number">{{ formatKg(line.totalGross) }}</td>
          <td class="number">{{ formatKg(line.totalNet) }}</td>
          <td class="number">{{ line.unitPrice === null ? "" : formatMoney(line.unitPrice, currency) }}</td>
          <td class="number">{{ line.amount === null ? "Chưa nhập giá" : formatMoney(line.amount, currency) }}</td>
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
            {{ formatMoney(summary.totalAmount, currency) }}
            <div v-if="summary.missingPriceCount > 0">(thiếu giá {{ summary.missingPriceCount }} loại cá)</div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup>
import { computed } from "vue";

import { common } from "@/common/common";
import { CURRENCIES, DEFAULT_CURRENCY, formatMoney } from "@/common/currency";

const props = defineProps({
  // Kết quả getSessionSummary
  summary: {
    type: Object,
    required: true,
  },
  currency: {
    type: String,
    default: DEFAULT_CURRENCY,
  },
});

const symbol = computed(() => (CURRENCIES[props.currency] ?? CURRENCIES[DEFAULT_CURRENCY]).symbol);

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");
</script>

<style lang="scss" scoped>
.summary-print {
  font-size: 14px;
  color: $color-text-primary;

  .summary-print__header {
    margin-bottom: 12px;
  }

  .summary-print__title {
    font-size: 16px;
    font-weight: 600;
  }

  .summary-print__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      border: 1px solid #999;
      padding: 6px 8px;
      text-align: left;
    }

    .number {
      text-align: right;
    }

    tfoot td {
      font-weight: 600;
    }
  }
}
</style>
