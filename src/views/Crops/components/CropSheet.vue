<template>
  <BottomSheet :open="open" :title="title" @close="emit('close')">
    <div class="crop-sheet">
      <div class="crop-sheet__error" v-if="errorMessage">{{ errorMessage }}</div>

      <p class="crop-sheet__pond">{{ mode === "close" ? crop?.cropName : pond?.pondName }}</p>

      <CPInput
        v-if="mode === 'start'"
        idControl="crop-name"
        labelControl="Tên vụ"
        :modelValue="cropName"
        placeholderText="Để trống để tự đặt tên"
        height="44px"
        @update="($event) => (cropName = $event)"
      />

      <label class="crop-sheet__label" for="crop-date">{{ mode === "start" ? "Ngày thả" : "Ngày kết thúc" }}</label>
      <input id="crop-date" class="crop-sheet__date" type="date" v-model="dateValue" />

      <p v-if="mode === 'close'" class="crop-sheet__hint">Sau khi kết thúc, phiên bán mới không gắn được vào vụ này.</p>

      <CPButton
        class="btn-crop-submit"
        :typeButton="mode === 'start' ? 'primary' : 'danger'"
        :textButton="mode === 'start' ? 'Bắt đầu vụ' : 'Kết thúc vụ'"
        height="48px"
        :disabled="isSaving || !dateValue"
        @click="submit"
      />
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import CropAPI from "@/services/cropAPI";
import { todayInputValue } from "@/common/dateInput";

// Bắt đầu vụ mới cho một ao (mode "start") hoặc kết thúc vụ đang nuôi (mode "close")
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "start",
  },
  pond: {
    type: Object,
    default: null,
  },
  crop: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "saved"]);

const cropName = ref("");
const dateValue = ref(todayInputValue());
const isSaving = ref(false);
const errorMessage = ref("");

const title = computed(() => (props.mode === "start" ? "Bắt đầu vụ mới" : "Kết thúc vụ"));

// Mỗi lần mở lại thì làm mới form
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    cropName.value = "";
    dateValue.value = todayInputValue();
    errorMessage.value = "";
  }
);

const submit = async () => {
  errorMessage.value = "";
  isSaving.value = true;
  try {
    let result;
    if (props.mode === "start") {
      const data = { pondId: props.pond._id, startDate: dateValue.value };
      const name = cropName.value.trim();
      if (name) data.cropName = name;
      result = await CropAPI.createCrop(data);
    } else {
      result = await CropAPI.closeCrop(props.crop._id, { endDate: dateValue.value });
    }
    emit("saved", result?.data);
  } catch (error) {
    errorMessage.value = error?.message || "Có lỗi xảy ra, vui lòng thử lại sau.";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.crop-sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .crop-sheet__error {
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .crop-sheet__pond {
    font-size: 16px;
    font-weight: 600;
  }

  .crop-sheet__label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: -6px;
  }

  .crop-sheet__date {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    font-size: 16px;
    background-color: $color-card-background;
    color: $color-text-primary;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px $color-focus-ring;
    }
  }

  .crop-sheet__hint {
    font-size: 14px;
    opacity: 0.8;
  }
}
</style>
