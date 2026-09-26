<template>
  <div class="cp-button">
    <div class="cp-button__content" :class="{ 'cp-button--disabled': disabled, 'cp-button--loading': loading }" :style="{ minWidth: minWidth, minHeight: minHeight }">
      <div class="button-icon" :class="leftIcon" v-if="leftIcon"></div>
      <button class="button-control" :id="idControl" :class="['btn-' + typeButton]" :disabled="disabled || loading" @click="handleClick">
        <span v-if="loading" class="loading-spinner"></span>
        <span>{{ textButton }}</span>
      </button>
      <div class="button-icon" :class="rightIcon" v-if="rightIcon"></div>
    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";

const props = defineProps({
  idControl: {
    type: String,
    default: "",
  },
  typeButton: {
    type: String,
    default: "default",
  },
  textButton: {
    type: String,
    default: "",
  },
  leftIcon: {
    type: String,
    default: "",
  },
  rightIcon: {
    type: String,
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
  minWidth: {
    type: [String, Number],
    default: "",
  },
  minHeight: {
    type: [String, Number],
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click');
  }
};
</script>
<style lang="scss" scoped>
// 4 kiểu nút dùng chung: primary (xanh đặc, hành động chính), default/secondary (viền xanh),
// danger (viền đỏ, thao tác xóa/kết thúc), ghost (chỉ chữ). Cùng bo góc, cùng chiều cao.
.cp-button {
  .cp-button__content {
    user-select: none;
    display: flex;
    border-radius: $radius-md;
    width: v-bind(width);
    height: v-bind(height);
    min-height: 40px;
    overflow: hidden;
    outline: none;

    &.cp-button--loading {
      cursor: not-allowed;
    }

    .button-control {
      cursor: pointer;
      flex: 1;
      border: 1px solid transparent;
      border-radius: $radius-md;
      outline: none;
      padding: 0 16px;
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

      &:focus-visible {
        box-shadow: 0 0 0 3px $color-focus-ring;
      }

      &:active:not(:disabled) {
        transform: translateY(1px);
      }

      &:disabled {
        cursor: not-allowed;
        background-color: $color-background;
        border-color: $color-border;
        color: #9aa5a0;
      }

      &.btn-primary {
        background-color: $color-primary;
        border-color: $color-primary;
        color: $color-card-background;

        &:hover:not(:disabled) {
          background-color: darken($color-primary, 6%);
        }

        &:disabled {
          background-color: #dfe6e0;
          border-color: #dfe6e0;
          color: #7d8c81;
        }
      }

      &.btn-default,
      &.btn-secondary {
        background-color: $color-card-background;
        border-color: $color-border-strong;
        color: $color-primary;

        &:hover:not(:disabled) {
          background-color: $color-hover;
          border-color: $color-primary;
        }
      }

      &.btn-danger {
        background-color: $color-card-background;
        border-color: lighten($color-error, 32%);
        color: $color-error;

        &:hover:not(:disabled) {
          background-color: lighten($color-error, 44%);
          border-color: $color-error;
        }
      }

      &.btn-ghost {
        color: $color-primary;

        &:hover:not(:disabled) {
          background-color: $color-hover;
        }
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: currentColor;
        animation: spin 1s ease-in-out infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Điện thoại: nút đủ cao để chạm
@media (max-width: 899.98px) {
  .cp-button {
    .cp-button__content {
      min-height: 44px;
    }

    .button-control {
      font-size: 16px;
    }
  }
}
</style>
