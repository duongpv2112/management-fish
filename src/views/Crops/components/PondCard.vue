<template>
  <div class="pond-card">
    <div
      class="pond-card__body"
      :class="{ 'pond-card__body--link': openCrop }"
      :role="openCrop ? 'link' : undefined"
      :tabindex="openCrop ? 0 : undefined"
      @click="openCrop && emit('open', openCrop)"
      @keydown.enter="openCrop && emit('open', openCrop)"
    >
      <div class="pond-card__header">
        <span class="pond-card__name">{{ pond.pondName }}</span>
        <span class="pond-card__badge" :class="{ 'pond-card__badge--open': openCrop }">
          {{ openCrop ? "đang nuôi" : "trống" }}
        </span>
      </div>

      <template v-if="openCrop">
        <div class="pond-card__crop">{{ openCrop.cropName }}</div>
        <div class="pond-card__meta">
          Thả ngày {{ formatDateOnly(openCrop.startDate) }} · {{ daysBetween(openCrop.startDate) }} ngày
        </div>
        <dl v-if="report" class="pond-card__money">
          <div>
            <dt>Thu</dt>
            <dd>{{ formatMoney(report.revenue.total) }}</dd>
          </div>
          <div>
            <dt>Chi</dt>
            <dd>{{ formatMoney(report.expense.total) }}</dd>
          </div>
          <div :class="{ 'pond-card__profit--loss': report.profit < 0 }">
            <dt>{{ report.profit < 0 ? "Lỗ tạm tính" : "Lãi tạm tính" }}</dt>
            <dd>{{ formatMoney(Math.abs(report.profit)) }}</dd>
          </div>
        </dl>
      </template>
      <div v-else class="pond-card__meta">Chưa có vụ nuôi</div>
    </div>

    <div class="pond-card__actions">
      <template v-if="openCrop">
        <CPButton
          class="btn-add-expense"
          textButton="＋ Chi phí"
          height="44px"
          @click="emit('addExpense', openCrop)"
        />
        <CPButton
          class="btn-close-crop"
          typeButton="danger"
          textButton="Kết thúc vụ"
          height="44px"
          @click="emit('close', openCrop)"
        />
      </template>
      <CPButton
        v-else
        class="btn-start-crop"
        typeButton="primary"
        textButton="Bắt đầu vụ mới"
        height="44px"
        @click="emit('start', pond)"
      />
    </div>
  </div>
</template>

<script setup>
import CPButton from "@/components/ButtonComponent.vue";
import { daysBetween, formatDateOnly } from "@/common/dateInput";
import { formatMoney } from "@/common/currency";

// Thẻ một ao trên trang Vụ nuôi: vụ đang nuôi (nếu có) với thu/chi/lãi tạm tính, và các nút
defineProps({
  pond: {
    type: Object,
    required: true,
  },
  openCrop: {
    type: Object,
    default: null,
  },
  // Báo cáo của vụ đang nuôi (getCropReport); null khi chưa tải được
  report: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["start", "close", "open", "addExpense"]);
</script>

<style lang="scss" scoped>
.pond-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: $radius-lg;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .pond-card__body {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &.pond-card__body--link {
      cursor: pointer;
    }
  }

  .pond-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .pond-card__name {
    font-size: 18px;
    font-weight: 700;
    color: $color-primary;
  }

  .pond-card__badge {
    padding: 2px 8px;
    border-radius: $radius-sm;
    font-size: 12px;
    background-color: $color-border;

    &.pond-card__badge--open {
      background-color: $color-hover;
      color: $color-primary;
      font-weight: 600;
    }
  }

  .pond-card__crop {
    font-size: 16px;
    font-weight: 600;
  }

  .pond-card__meta {
    font-size: 14px;
    opacity: 0.75;
  }

  .pond-card__money {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 0;

    dt {
      font-size: 12px;
      opacity: 0.75;
    }

    dd {
      margin: 0;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .pond-card__profit--loss dd {
      color: $color-error;
    }
  }

  .pond-card__actions {
    display: flex;
    gap: 8px;

    > * {
      flex: 1;
    }
  }
}
</style>
