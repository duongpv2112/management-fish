<template>
  <div class="cp-date">
    <div class="cp-date__control" :class="{ 'cp-date__control--error': errorMessage }" :style="{ height }">
      <!-- Gõ ngày kiểu Việt Nam (dd/mm/yyyy); bàn phím số, tự chèn "/" -->
      <input
        :id="idControl"
        ref="textRef"
        class="cp-date__text"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :placeholder="placeholderText"
        :value="text"
        @input="handleInput"
        @blur="handleBlur"
      />
      <!-- Nút lịch: ô ngày gốc trong suốt phủ lên biểu tượng, chạm vào mở bảng chọn ngày của máy -->
      <span class="cp-date__picker-wrap">
        <i class="mdi mdi-calendar-month-outline cp-date__icon" aria-hidden="true"></i>
        <input
          class="cp-date__picker"
          type="date"
          tabindex="-1"
          aria-label="Chọn ngày trên lịch"
          :value="modelValue"
          @input="handlePick"
          @click="openPicker"
        />
      </span>
    </div>
    <div class="cp-date__error" v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import "@mdi/font/css/materialdesignicons.css";

import { formatDateOnly, maskDateTyping, parseDateText } from "@/common/dateInput";

// Ô ngày: gõ hoặc chọn trên lịch, luôn hiển thị dd/mm/yyyy; v-model là "YYYY-MM-DD" ("" khi trống hoặc sai)
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  idControl: {
    type: String,
    default: "",
  },
  placeholderText: {
    type: String,
    default: "dd/mm/yyyy",
  },
  height: {
    type: String,
    default: "44px",
  },
});

const emit = defineEmits(["update:modelValue"]);

const INVALID_MESSAGE = "Ngày không hợp lệ, nhập theo dạng ngày/tháng/năm.";

const textRef = ref(null);
const text = ref(formatDateOnly(props.modelValue));
const errorMessage = ref("");
// Giá trị ô vừa emit: model đổi về đúng giá trị này thì không ghi đè chữ đang gõ dở
let lastEmitted = props.modelValue;

const emitValue = (value) => {
  lastEmitted = value;
  if (value !== props.modelValue) emit("update:modelValue", value);
};

watch(
  () => props.modelValue,
  (value) => {
    if (value === lastEmitted) return;
    lastEmitted = value;
    text.value = formatDateOnly(value);
    errorMessage.value = "";
  }
);

const handleInput = (event) => {
  const deleting = String(event.inputType ?? "").startsWith("delete");
  const masked = maskDateTyping(event.target.value, { deleting });
  text.value = masked;
  // Giữ ô hiển thị khớp chữ đã định dạng (Vue không tự cập nhật khi text không đổi)
  if (event.target.value !== masked) event.target.value = masked;
  const parsed = parseDateText(masked);
  if (parsed !== null) errorMessage.value = "";
  emitValue(parsed ?? "");
};

const handleBlur = () => {
  const parsed = parseDateText(text.value);
  if (parsed === null) {
    errorMessage.value = INVALID_MESSAGE;
    return;
  }
  errorMessage.value = "";
  text.value = formatDateOnly(parsed);
};

const handlePick = (event) => {
  const value = event.target.value;
  text.value = formatDateOnly(value);
  errorMessage.value = "";
  emitValue(value);
};

// Chrome máy tính chỉ mở lịch khi bấm đúng biểu tượng gốc → mở luôn bằng showPicker
const openPicker = (event) => {
  try {
    event.target.showPicker?.();
  } catch {
    // Trình duyệt không cho mở bằng code: để hành vi mặc định
  }
};
</script>

<style lang="scss" scoped>
.cp-date {
  width: 100%;

  .cp-date__control {
    display: flex;
    align-items: stretch;
    min-height: 44px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    background-color: $color-card-background;
    overflow: hidden;

    &:focus-within {
      box-shadow: 0 0 0 3px $color-focus-ring;
    }

    &.cp-date__control--error {
      border-color: $color-error;
    }
  }

  .cp-date__text {
    flex: 1;
    min-width: 0;
    padding: 0 12px;
    border: none;
    outline: none;
    background: transparent;
    color: $color-text-primary;
    font: inherit;
    font-size: 16px; // ≥ 16px để iPhone không tự phóng to khi gõ

    &::placeholder {
      opacity: 0.7;
    }
  }

  .cp-date__picker-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    flex-shrink: 0;
    border-left: 1px solid $color-border;
  }

  .cp-date__icon {
    font-size: 22px;
    color: $color-primary;
  }

  .cp-date__picker {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    opacity: 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .cp-date__error {
    margin-top: 4px;
    font-size: 13px;
    color: $color-error;
  }
}
</style>
