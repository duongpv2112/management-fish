<template>
  <div class="cp-input">
    <label
      class="cp-input__label"
      :for="idControl"
      v-if="labelControl && !isCustomLabel"
    >
      {{ labelControl }}
    </label>
    <template v-else>
      <slot name="customLabel"></slot>
    </template>
    <div class="cp-input__control" :class="{ 'cp-input--focus': isFocusOn, 'cp-input--disabled': disabled, 'cp-input--error': errorMessage }">
      <input
        class="input-control"
        :id="idControl"
        :value="modelValue"
        :placeholder="placeholderText"
        :disabled="disabled"
        :inputmode="resolvedInputmode"
        @input="handleChangeInput"
        @keydown="handleKeyPress"
        @focus="handleFocusInput"
        @blur="handleBlurInput"
      />
    </div>
    <div class="cp-input__error" v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>
<script setup>
import { computed, ref } from "vue";

import { applyTypingFormat } from "@/common/moneyTyping";

const props = defineProps({
  idControl: {
    type: String,
    default: "",
  },
  labelControl: {
    type: String,
    default: "",
  },
  isCustomLabel: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number],
    default: "",
  },
  width: {
    type: [String, Number],
    default: "",
  },
  height: {
    type: [String, Number],
    default: "",
  },
  placeholderText: {
    type: String,
    default: "",
  },
  typeInput: {
    type: Number,
    default: 2,
  },
  // Kiểu bàn phím trên điện thoại; ô số (typeInput 1) mặc định "decimal"
  inputmode: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  // Hàm định dạng chữ ngay khi đang gõ (vd. formatMoneyTyping thêm dấu "." hàng nghìn); giữ con trỏ đúng chỗ
  formatter: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['update', 'enter']);
const isFocusOn = ref(false);

const handleFocusInput = () => {
  isFocusOn.value = true;
};

const handleBlurInput = () => {
  isFocusOn.value = false;
};

const handleChangeInput = ($event) => {
  const value = props.formatter ? applyTypingFormat($event.target, props.formatter) : $event.target.value;
  emit("update", value);
};

const handleKeyPress = ($event) => {
  if ($event.key === 'Enter') {
    emit('enter');
  }
  switch (props.typeInput) {
    case typeInputEnum.value.NumberType:
      // Chỉ cho phép các phím số (0-9), dấu thập phân (. hoặc ,), phím Backspace, phím Delete, phím Tab và phím mũi tên
      const allowedKeys = [
        ".",
        ",",
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ];

      // Kiểm tra nếu phím nhấn không phải là số hoặc không nằm trong danh sách các phím cho phép
      if (
        !allowedKeys.includes($event.key) && // Nếu không phải là một phím được cho phép
        ($event.key < "0" || $event.key > "9") && // Nếu không phải là phím số
        !(
          $event.ctrlKey &&
          ($event.key === "a" || $event.key === "c" || $event.key === "x")
        )
      ) {
        $event.preventDefault(); // Ngăn chặn hành động mặc định (nhập ký tự vào input)
      }
      break;
    default:
      break;
  }
};

const typeInputEnum = ref({
  NumberType: 1,
  TextType: 2,
});

// Ô số trên điện thoại mở bàn phím số (có dấu thập phân) thay vì bàn phím chữ
const resolvedInputmode = computed(() => {
  if (props.inputmode) return props.inputmode;
  return props.typeInput === typeInputEnum.value.NumberType ? "decimal" : undefined;
});
</script>
<style lang="scss" scoped>
.cp-input {
  .cp-input__label {
    color: #172b4d;
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .cp-input__control {
    user-select: none;
    position: relative;
    display: flex;
    border: 1px solid $color-border-strong;
    background-color: $color-card-background;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    border-radius: $radius-md;
    padding: 1px 0 1px 1px;
    width: v-bind(width);
    height: v-bind(height);

    &.cp-input--focus {
      border-color: $color-primary !important;
      box-shadow: 0 0 0 3px $color-focus-ring;
    }

    &.cp-input--disabled {
      background-color: #f0f2f4;
      cursor: not-allowed;
    }

    &.cp-input--error {
      border-color: $color-error;
    }

    &:hover:not(.cp-input--disabled) {
      border-color: $color-primary;
    }

    .input-control {
      flex: 1;
      border: none;
      outline: none;
      padding: 8px 16px;
      background: transparent;

      &::placeholder {
        opacity: 0.7;
      }

      &:disabled {
        cursor: not-allowed;
        color: #6c757d;
      }
    }
  }

  .cp-input__error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
    font-weight: 400;
  }
}

// Điện thoại: ô nhập đủ cao để chạm, chữ 16px để iPhone không tự phóng to
@media (max-width: 899.98px) {
  .cp-input {
    .cp-input__control {
      min-height: 44px;
    }

    .input-control {
      font-size: 16px;
    }
  }
}
</style>
