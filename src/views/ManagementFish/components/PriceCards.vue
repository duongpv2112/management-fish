<template>
  <div class="price-cards">
    <div v-if="!sessionId" class="price-cards__empty">Chưa có phiên cân.</div>
    <template v-else>
      <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="price-cards__currency" v-if="summary">
        <label for="currencySelectMobile">Loại tiền</label>
        <CPSelect
          idControl="currencySelectMobile"
          :modelValue="currency"
          :options="CURRENCY_OPTIONS"
          :disabled="isSaving"
          @change="changeCurrency"
        />
      </div>

      <template v-if="summary">
        <div v-if="summary.lines.length === 0" class="price-cards__empty">Chưa có lần cân nào trong phiên.</div>
        <div v-for="line in summary.lines" :key="line.fishTypeId" class="price-card">
          <div class="price-card__header">
            <span class="price-card__name">{{ line.fishName }}</span>
            <span v-if="line.amount === null" class="price-card__amount price-card__missing">Chưa nhập giá</span>
            <span v-else class="price-card__amount">{{ formatMoney(line.amount) }}</span>
          </div>
          <div class="price-card__price">
            <span>{{ formatKg(line.totalNet) }} kg ×</span>
            <input
              :id="`price-card-${line.fishTypeId}`"
              class="price-card__input"
              :inputmode="currency === 'VND' ? 'numeric' : 'decimal'"
              placeholder="Nhập giá"
              :value="priceInputs[line.fishTypeId]"
              :disabled="isSaving"
              @input="priceInputs[line.fishTypeId] = $event.target.value"
              @blur="savePrice(line)"
              @keydown.enter="$event.target.blur()"
            />
            <span>{{ currencySymbol }}/kg</span>
          </div>
        </div>

        <div class="price-cards__total">
          <div class="price-cards__total-row">
            <span>Tổng · {{ formatKg(summary.totalNet) }} kg</span>
            <span>{{ formatMoney(summary.totalAmount) }}</span>
          </div>
          <div v-if="summary.missingPriceCount > 0" class="price-cards__total-note">
            (thiếu giá {{ summary.missingPriceCount }} loại cá)
          </div>
        </div>

        <div class="price-cards__actions">
          <button type="button" class="btn-print" @click="printSummary">🖨 In phiếu</button>
          <button type="button" class="btn-chart" @click="isChartOpen = !isChartOpen">
            📊 {{ isChartOpen ? "Ẩn biểu đồ" : "Biểu đồ" }}
          </button>
        </div>

        <StatisticData v-if="isChartOpen" :fishData="fishData" />
        <SummaryPrintTable class="screen-hidden" :summary="summary" :currency="currency" />
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, toRef } from "vue";

import StatisticData from "./StatisticData.vue";
import SummaryPrintTable from "./SummaryPrintTable.vue";
import CPSelect from "@/components/SelectComponent.vue";
import { CURRENCY_OPTIONS } from "@/common/currency";
import { useSessionSummary } from "@/composables/useSessionSummary";

// Tab "Tiền" trên điện thoại: mỗi loại cá một thẻ, ô giá to; logic dùng chung với PriceSummary
const props = defineProps({
  sessionId: {
    type: String,
    default: null,
  },
  refreshKey: {
    type: Number,
    default: 0,
  },
  // Dữ liệu cho biểu đồ (getDataFish của phiên)
  fishData: {
    type: Array,
    default: () => [],
  },
});

const { summary, priceInputs, errorMessage, isSaving, currency, currencySymbol, formatMoney, savePrice, changeCurrency } =
  useSessionSummary(toRef(props, "sessionId"), toRef(props, "refreshKey"));

const isChartOpen = ref(false);

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");

const printSummary = () => {
  window.print();
};
</script>

<style lang="scss" scoped>
.price-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .price-cards__empty {
    padding: 24px 8px;
    border-radius: $radius-lg;
    background-color: $color-card-background;
    text-align: center;
    font-size: 15px;
  }

  .error-message {
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .price-cards__currency {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
  }

  .price-cards__total {
    padding: 12px;
    border-radius: $radius-lg;
    background-color: $color-primary;
    color: $color-card-background;
    font-weight: 700;

    .price-cards__total-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 17px;
    }

    .price-cards__total-note {
      font-size: 13px;
      font-weight: 400;
      margin-top: 2px;
    }
  }

  .price-cards__actions {
    display: flex;
    gap: 8px;

    button {
      flex: 1;
      min-height: 48px;
      border: 1px solid $color-border-strong;
      border-radius: $radius-md;
      background-color: $color-card-background;
      color: $color-primary;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
  }
}

.price-card {
  padding: 10px 12px;
  border-radius: $radius-lg;
  background-color: $color-card-background;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .price-card__header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .price-card__name {
    font-size: 16px;
    font-weight: 700;
  }

  .price-card__amount {
    font-size: 16px;
    font-weight: 700;
    color: $color-primary;
    text-align: right;

    &.price-card__missing {
      color: $color-error;
    }
  }

  .price-card__price {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }

  .price-card__input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    text-align: right;
    font-size: 16px;
    font-weight: 600;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-focus-ring;
    }
  }
}
</style>
