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
    <div class="cp-input__control" :class="{ 'cp-input--focus': isFocusOn }">
      <input
        class="input-control"
        :id="idControl"
        :value="modelValue"
        :placeholder="placeholderText"
        @input="handleChangeInput"
        @keydown="handleKeyPress"
        @focus="handleFocusInput"
        @blur="handleBlurInput"
      />
    </div>
  </div>
</template>
<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "CPInput",
  props: {
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
      default: "2",
    },
  },
  setup(props, { emit }) {
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

    return {
      // Computed

      // Property
      isFocusOn,

      // Function
      handleChangeInput,
      handleFocusInput,
      handleBlurInput,
      handleKeyPress,
    };
  },
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

    &:hover {
      border-color: #6b778c;
    }

    .input-control {
      flex: 1;
      border: none;
      outline: none;
      padding: 8px 16px;

      &::placeholder {
        opacity: 0.7;
      }
    }
  }
}
</style>
