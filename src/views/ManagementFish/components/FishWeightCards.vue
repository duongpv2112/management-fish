<template>
  <div class="fish-cards">
    <div v-if="cards.length === 0" class="fish-cards__empty">Chưa có lần cân nào trong phiên.</div>
    <template v-else>
      <div class="edit-hint">
        {{ readOnly ? "Phiên đã kết thúc, không sửa được." : "Chạm vào số cân để sửa hoặc xóa." }}
      </div>
      <div v-for="card in cards" :key="card._id" class="fish-card">
        <div class="fish-card__header">
          <span class="fish-card__name">{{ card.fishName }}</span>
          <span class="fish-card__summary">{{ formatKg(card.total) }} kg · {{ card.items.length }} lần</span>
        </div>
        <div class="fish-card__weights">
          <button
            v-for="item in card.items"
            :key="item._id"
            type="button"
            class="fish-card__weight"
            :class="{ 'fish-card__weight--editable': !readOnly }"
            :title="item.netWeight != null ? `Tổng ${formatKg(item.fishWeight)} − giỏ ${formatKg(item.basketWeightSnapshot ?? 0)}` : undefined"
            @click="editItem(card, item)"
          >
            {{ formatKg(item.netWeight ?? item.fishWeight) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Tab "Bảng" trên điện thoại: mỗi loại cá một thẻ, không phải vuốt ngang như bảng cột
const props = defineProps({
  fishData: {
    type: Array,
    default: () => [],
  },
  // Phiên đã kết thúc: chỉ xem
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["editItem"]);

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");

// Chỉ loại cá đã có lần cân, giữ thứ tự danh mục; lần cân mới nhất trước
const cards = computed(() =>
  props.fishData
    .filter((fishType) => (fishType.fishWeightItems ?? []).length > 0)
    .map((fishType) => {
      const items = [...fishType.fishWeightItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        _id: fishType._id,
        fishName: fishType.fishName,
        items,
        total: items.reduce((sum, item) => sum + (item.netWeight ?? item.fishWeight ?? 0), 0),
      };
    })
);

// Cùng dạng dữ liệu với DataViewer để dùng chung WeightEditDialog
const editItem = (card, item) => {
  if (props.readOnly) return;
  emit("editItem", { ...item, fishType: card._id, fishName: card.fishName });
};
</script>

<style lang="scss" scoped>
.fish-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .fish-cards__empty {
    padding: 24px 8px;
    text-align: center;
    font-size: 15px;
    color: $color-text-primary;
    background-color: $color-card-background;
    border-radius: 10px;
  }

  .edit-hint {
    font-size: 13px;
    color: $color-text-primary;
    opacity: 0.8;
  }
}

.fish-card {
  padding: 10px 12px;
  border-radius: 10px;
  background-color: $color-card-background;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .fish-card__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  }

  .fish-card__name {
    font-size: 16px;
    font-weight: 700;
    color: $color-text-primary;
  }

  .fish-card__summary {
    font-size: 14px;
    font-weight: 600;
    color: $color-primary;
    white-space: nowrap;
  }

  .fish-card__weights {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .fish-card__weight {
    min-width: 52px;
    min-height: 40px;
    padding: 0 8px;
    border: 1px solid $color-border;
    border-radius: 8px;
    background-color: $color-background;
    color: $color-text-primary;
    font-size: 16px;
    font-weight: 600;

    &.fish-card__weight--editable {
      border-color: lighten($color-primary, 45%);
      background-color: $color-hover;
      color: $color-primary;
      text-decoration: underline dotted;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  }
}
</style>
