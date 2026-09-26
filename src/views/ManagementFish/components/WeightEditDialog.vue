<template>
  <div class="weight-edit-overlay" @click.self="emit('close')">
    <div class="weight-edit-dialog" role="dialog" aria-modal="true">
      <h2>Sửa lần cân</h2>

      <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="weight-edit-form">
        <CPCombobox
          idControl="editFishType"
          labelControl="Loại cá"
          :modelValue="fishTypeValue"
          height="36px"
          :lstData="fishTypes"
          dataField="_id"
          dataFieldText="fishName"
          @update="($event) => (fishTypeValue = $event)"
        />
        <CPCombobox
          idControl="editBasketType"
          labelControl="Loại giỏ"
          :modelValue="basketTypeValue"
          height="36px"
          :lstData="basketTypes"
          dataField="_id"
          dataFieldText="basketName"
          @update="($event) => (basketTypeValue = $event)"
        />
        <CPInput
          idControl="editFishWeight"
          labelControl="Số cân (gồm giỏ)"
          :modelValue="fishWeightValue"
          height="36px"
          :typeInput="1"
          @update="($event) => (fishWeightValue = $event)"
          @enter="save"
        />
        <div
          v-if="netPreview"
          class="net-preview"
          :class="{ 'net-preview--error': netPreview.isError }"
        >
          {{ netPreview.text }}
        </div>
      </div>

      <div class="weight-edit-actions">
        <CPButton class="btn-delete" textButton="Xóa" :disabled="isSaving" @click="remove" />
        <div class="weight-edit-actions__right">
          <CPButton class="btn-close" textButton="Đóng" @click="emit('close')" />
          <CPButton class="btn-save" textButton="Lưu" :disabled="isSaving" @click="save" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import FishWeightAPI from "@/services/fishWeightAPI";
import { common } from "@/common/common";

const props = defineProps({
  // { _id, fishType, basketType, fishWeight, fishName? }
  item: {
    type: Object,
    required: true,
  },
  fishTypes: {
    type: Array,
    default: () => [],
  },
  basketTypes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["saved", "deleted", "close"]);

const fishTypeValue = ref(props.item.fishType);
const basketTypeValue = ref(props.item.basketType ?? null);
const fishWeightValue = ref(String(props.item.fishWeight ?? ""));
const errorMessage = ref("");
const isSaving = ref(false);

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value)).replace(".", ",");

// Trọng lượng giỏ server sẽ trừ: giữ giỏ cũ thì dùng số đã lưu lúc cân, đổi giỏ thì lấy trọng lượng giỏ hiện tại
const basketWeight = computed(() => {
  if (basketTypeValue.value === (props.item.basketType ?? null) && props.item.basketWeightSnapshot != null) {
    return props.item.basketWeightSnapshot;
  }
  return props.basketTypes.find((basket) => basket._id === basketTypeValue.value)?.basketWeight ?? 0;
});

// Bảng hiện số cân thực, còn ô nhập là số cân gồm giỏ: hiện ngay kết quả sau khi trừ giỏ để tránh nhầm
const netPreview = computed(() => {
  const fishWeight = common.parseDecimal(fishWeightValue.value);
  if (!fishWeight || fishWeight <= 0) return null;
  const net = round2(fishWeight - basketWeight.value);
  if (net <= 0) {
    return { isError: true, text: `Số cân phải lớn hơn trọng lượng giỏ (${formatKg(basketWeight.value)} kg)` };
  }
  return { isError: false, text: `Còn ${formatKg(net)} kg sau khi trừ giỏ ${formatKg(basketWeight.value)} kg` };
});

const save = async () => {
  errorMessage.value = "";
  if (!fishTypeValue.value) {
    errorMessage.value = "Vui lòng chọn loại cá.";
    return;
  }
  const fishWeight = common.parseDecimal(fishWeightValue.value);
  if (!fishWeight || fishWeight <= 0) {
    errorMessage.value = "Số cân cá phải là số dương.";
    return;
  }

  isSaving.value = true;
  try {
    await FishWeightAPI.updateFishWeight(props.item._id, {
      fishType: fishTypeValue.value,
      basketType: basketTypeValue.value,
      fishWeight: fishWeight,
    });
    emit("saved");
  } catch (error) {
    // Giữ hộp thoại mở để người dùng sửa và thử lại
    errorMessage.value = error?.message || "Cập nhật cân cá không thành công!";
  } finally {
    isSaving.value = false;
  }
};

const remove = async () => {
  errorMessage.value = "";
  const fishName =
    props.fishTypes.find((fishType) => fishType._id === props.item.fishType)?.fishName ??
    props.item.fishName ??
    "";
  if (!window.confirm(`Xóa lần cân ${props.item.fishWeight} kg "${fishName}"?`)) return;

  isSaving.value = true;
  try {
    await FishWeightAPI.deleteFishWeight(props.item._id);
    emit("deleted");
  } catch (error) {
    errorMessage.value = error?.message || "Xóa cân cá không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.weight-edit-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.4);

  .weight-edit-dialog {
    width: 100%;
    max-width: 420px;
    background-color: $color-card-background;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    padding: 20px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: $color-primary;
      margin-bottom: 16px;
      text-align: center;
    }

    .error-message {
      margin-bottom: 16px;
      font-size: 14px;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
      color: $color-error;
      background-color: lighten($color-error, 40%);
    }

    .weight-edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .net-preview {
      margin-top: -8px;
      font-size: 13px;
      color: $color-primary;

      &.net-preview--error {
        color: $color-error;
      }
    }

    .weight-edit-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;

      .weight-edit-actions__right {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
