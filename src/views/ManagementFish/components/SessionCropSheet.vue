<template>
  <BottomSheet :open="open" title="Phiên này bán cá ao nào?" @close="emit('close')">
    <div class="session-crop">
      <div class="session-crop__error" v-if="errorMessage">{{ errorMessage }}</div>

      <div v-if="isLoading" class="session-crop__empty">Đang tải danh sách vụ nuôi...</div>
      <div v-else-if="crops.length === 0" class="session-crop__empty">
        Chưa có vụ nuôi nào. <a href="#/vu-nuoi">Mở trang Vụ nuôi</a>
      </div>

      <button
        v-for="crop in crops"
        :key="crop._id"
        type="button"
        class="session-crop__item"
        :class="{ 'session-crop__item--selected': crop._id === currentCropId }"
        :disabled="isSaving"
        @click="assign(crop._id)"
      >
        <span class="session-crop__info">
          <span class="session-crop__pond">{{ crop.pond?.pondName }}</span>
          <span class="session-crop__name">{{ crop.cropName }}</span>
        </span>
        <span v-if="crop.status === 'closed'" class="session-crop__badge">đã kết thúc</span>
        <span class="session-crop__check" v-if="crop._id === currentCropId">✓</span>
      </button>

      <button v-if="currentCropId" type="button" class="btn-unassign-crop" :disabled="isSaving" @click="assign(null)">
        Bỏ gán ao
      </button>
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import CropAPI from "@/services/cropAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";

// Gán / đổi / bỏ gán ao (vụ nuôi) cho một phiên, kể cả phiên cũ và vụ đã kết thúc
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  session: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "updated"]);

const crops = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");

const currentCropId = computed(() => props.session?.crop?._id ?? null);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    errorMessage.value = "";
    isLoading.value = true;
    try {
      // Server trả vụ đang nuôi trước, rồi ngày thả mới nhất
      crops.value = (await CropAPI.getCrops())?.data ?? [];
    } catch (error) {
      errorMessage.value = "Không thể tải danh sách vụ nuôi, vui lòng thử lại sau.";
      console.error("Lỗi khi tải danh sách vụ nuôi:", error);
    } finally {
      isLoading.value = false;
    }
  }
);

const assign = async (cropId) => {
  errorMessage.value = "";
  isSaving.value = true;
  try {
    const result = await WeighSessionAPI.updateSessionCrop(props.session._id, cropId);
    emit("updated", result?.data);
    emit("close");
  } catch (error) {
    errorMessage.value = error?.message || "Cập nhật ao cho phiên không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.session-crop {
  .session-crop__error {
    margin-bottom: 8px;
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .session-crop__empty {
    padding: 12px 8px;
    font-size: 14px;

    a {
      color: $color-primary;
      font-weight: 600;
    }
  }

  .session-crop__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 56px;
    padding: 6px 8px;
    border: none;
    border-bottom: 1px solid $color-border;
    background: transparent;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;

    &.session-crop__item--selected {
      background-color: $color-hover;
    }
  }

  .session-crop__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .session-crop__pond {
    font-size: 16px;
    font-weight: 600;
  }

  .session-crop__name {
    font-size: 13px;
    opacity: 0.7;
  }

  .session-crop__badge {
    padding: 2px 8px;
    border-radius: $radius-sm;
    font-size: 12px;
    background-color: $color-border;
  }

  .session-crop__check {
    color: $color-primary;
    font-weight: 700;
  }

  .btn-unassign-crop {
    width: 100%;
    min-height: 48px;
    margin-top: 12px;
    border: 1px solid lighten($color-error, 32%);
    border-radius: $radius-md;
    background-color: $color-card-background;
    color: $color-error;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
