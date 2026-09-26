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
import { ref } from "vue";

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
  disabled: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  }
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
  emit("update", $event.target.value);
};

const handleKeyPress = ($event) => {
  if ($event.key === 'Enter') {
    emit('enter');
  }
  switch (props.typeInput) {
    case typeInputEnum.value.NumberType:
      // Chỉ cho phép các phím số (0-9), phím Backspace, phím Delete, phím Tab và phím mũi tên
      const allowedKeys = [
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
    border: 1px solid #dfe1e6;
    border-radius: 5px;
    padding: 1px 0 1px 1px;
    width: v-bind(width);
    height: v-bind(height);

    &.cp-input--focus {
      border-color: #0065ff !important;
    }

    &.cp-input--disabled {
      background-color: #f0f2f4;
      cursor: not-allowed;
    }

    &.cp-input--error {
      border-color: #dc3545;
    }

    &:hover:not(.cp-input--disabled) {
      border-color: #6b778c;
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
</style>
