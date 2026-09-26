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
.cp-button {
  .cp-button__content {
    user-select: none;
    display: flex;
    border-radius: 6px;
    width: v-bind(width);
    height: v-bind(height);
    overflow: hidden;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    outline: none;

    &.cp-button--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.cp-button--loading {
      cursor: not-allowed;
    }

    .button-control {
      cursor: pointer;
      flex: 1;
      border: none;
      outline: none;
      padding: 10px 20px;
      background-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        outline: none;
      }

      &:active:not(:disabled) {
        transform: translateY(1px);
      }

      &:disabled {
        cursor: not-allowed;
      }

      &.btn-default {
        background-color: #f8f9fa;
        color: #343a40;
        border: 1px solid #ced4da;

        &:hover:not(:disabled) {
          background-color: #e9ecef;
        }

        &:active:not(:disabled) {
          background-color: #dee2e6;
        }
      }

      &.btn-primary {
        background-color: #007bff;
        color: #fff;
        border: 1px solid #007bff;
        
        &:hover:not(:disabled) {
          background-color: #0069d9;
        }
        
        &:active:not(:disabled) {
          background-color: #0062cc;
        }
      }

      &.btn-secondary {
        background-color: #6c757d;
        color: #fff;
        border: 1px solid #6c757d;
        
        &:hover:not(:disabled) {
          background-color: #5a6268;
        }
        
        &:active:not(:disabled) {
          background-color: #545b62;
        }
      }

      &.btn-danger {
        background-color: #dc3545;
        color: #fff;
        border: 1px solid #dc3545;
        
        &:hover:not(:disabled) {
          background-color: #c82333;
        }
        
        &:active:not(:disabled) {
          background-color: #bd2130;
        }
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
