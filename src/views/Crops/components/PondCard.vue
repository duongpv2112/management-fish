<template>
  <div class="pond-card">
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
      <CPButton
        class="btn-close-crop"
        typeButton="danger"
        textButton="Kết thúc vụ"
        height="44px"
        @click="emit('close', openCrop)"
      />
    </template>
    <template v-else>
      <div class="pond-card__meta">Chưa có vụ nuôi</div>
      <CPButton
        class="btn-start-crop"
        typeButton="primary"
        textButton="Bắt đầu vụ mới"
        height="44px"
        @click="emit('start', pond)"
      />
    </template>
  </div>
</template>

<script setup>
import CPButton from "@/components/ButtonComponent.vue";
import { daysBetween, formatDateOnly } from "@/common/dateInput";

// Thẻ một ao trên trang Vụ nuôi: vụ đang nuôi (nếu có) và nút bắt đầu / kết thúc vụ
defineProps({
  pond: {
    type: Object,
    required: true,
  },
  openCrop: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["start", "close"]);
</script>

<style lang="scss" scoped>
.pond-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: $radius-lg;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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
}
</style>
