<template>
  <div class="recent-weights">
    <h2>Lần cân gần đây</h2>
    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

    <div v-if="recentItems.length === 0" class="recent-weights__empty">Chưa có lần cân nào trong phiên.</div>
    <ul v-else class="recent-weights__list">
      <li v-for="item in recentItems" :key="item._id" class="recent-weight">
        <span class="recent-weight__time">{{ item.time }}</span>
        <div class="recent-weight__info">
          <div>
            <strong>{{ item.fishName }}</strong>
            <span v-if="item.basketName"> · {{ item.basketName }}</span>
          </div>
          <div class="recent-weight__weight">
            {{ formatKg(item.displayWeight) }} kg
            <span v-if="item.netWeight != null" class="recent-weight__detail">
              (Tổng {{ formatKg(item.fishWeight) }} − giỏ {{ formatKg(item.basketWeightSnapshot ?? 0) }})
            </span>
          </div>
        </div>
        <div class="recent-weight__actions">
          <button type="button" class="btn-recent-edit" :disabled="isDeleting" @click="emit('edit', item)">
            Sửa
          </button>
          <button type="button" class="btn-recent-delete" :disabled="isDeleting" @click="removeItem(item)">
            Xóa
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

import FishWeightAPI from "@/services/fishWeightAPI";

const props = defineProps({
  // Kết quả getDataFish của phiên đang chọn (mỗi loại cá có fishWeightItems)
  fishData: {
    type: Array,
    default: () => [],
  },
  basketTypes: {
    type: Array,
    default: () => [],
  },
  limit: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits(["edit", "deleted"]);

const errorMessage = ref("");
const isDeleting = ref(false);

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value ?? 0)).replace(".", ",");

// HH:mm theo giờ máy người dùng
const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// Gộp lần cân của mọi loại cá, mới nhất trước; item có dạng giống ô bảng để dùng chung hộp thoại sửa
const recentItems = computed(() =>
  props.fishData
    .flatMap((fishType) =>
      (fishType.fishWeightItems ?? []).map((item) => ({
        ...item,
        fishType: fishType._id,
        fishName: fishType.fishName,
        basketName: props.basketTypes.find((basket) => basket._id === item.basketType)?.basketName ?? "",
        displayWeight: item.netWeight ?? item.fishWeight,
        time: formatTime(item.createdAt),
      }))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, props.limit)
);

const removeItem = async (item) => {
  errorMessage.value = "";
  if (!window.confirm(`Xóa lần cân ${formatKg(item.displayWeight)} kg "${item.fishName}" lúc ${item.time}?`)) return;

  isDeleting.value = true;
  try {
    await FishWeightAPI.deleteFishWeight(item._id);
    emit("deleted");
  } catch (error) {
    errorMessage.value = error?.message || "Xóa cân cá không thành công!";
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.recent-weights {
  width: 100%;
  margin-top: 16px;
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: 16px;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 12px;
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

  .recent-weights__empty {
    font-size: 14px;
    color: $color-text-primary;
    text-align: center;
    padding: 8px 0;
  }

  .recent-weights__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .recent-weight {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid $color-border;
    font-size: 14px;
    color: $color-text-primary;

    &:last-child {
      border-bottom: none;
    }

    .recent-weight__time {
      min-width: 44px;
      opacity: 0.7;
    }

    .recent-weight__info {
      flex: 1;
      min-width: 0;
    }

    .recent-weight__weight {
      font-weight: 600;
    }

    .recent-weight__detail {
      font-weight: 400;
      font-size: 12px;
      opacity: 0.7;
    }

    .recent-weight__actions {
      display: flex;
      gap: 6px;

      button {
        padding: 6px 12px;
        border: 1px solid $color-border;
        border-radius: 4px;
        background-color: $color-card-background;
        cursor: pointer;

        &:hover:not(:disabled) {
          background-color: $color-hover;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-recent-delete {
        color: $color-error;
      }
    }
  }
}
</style>
