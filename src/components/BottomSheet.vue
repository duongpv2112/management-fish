<template>
  <template v-if="open">
    <div class="bottom-sheet__backdrop" @click="emit('close')"></div>
    <div class="bottom-sheet" role="dialog" aria-modal="true" :aria-label="title || undefined">
      <div class="bottom-sheet__grab"></div>
      <div v-if="title" class="bottom-sheet__title">{{ title }}</div>
      <div class="bottom-sheet__content">
        <slot></slot>
      </div>
    </div>
  </template>
</template>

<script setup>
import { onBeforeUnmount, watch } from "vue";

// Khung trượt từ dưới lên (điện thoại): chọn loại khác, chọn phiên, menu
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);

const handleKeydown = (event) => {
  if (event.key === "Escape") emit("close");
};

// Chỉ nghe phím Esc khi đang mở
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) document.addEventListener("keydown", handleKeydown);
    else document.removeEventListener("keydown", handleKeydown);
  },
  { immediate: true }
);

onBeforeUnmount(() => document.removeEventListener("keydown", handleKeydown));
</script>

<style lang="scss" scoped>
.bottom-sheet__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background-color: rgba(0, 0, 0, 0.35);
}

.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1101;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  background-color: $color-card-background;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25);
  padding: 8px 12px calc(12px + env(safe-area-inset-bottom));
  animation: slideUp 0.2s ease-out;

  .bottom-sheet__grab {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background-color: $color-border;
    margin: 0 auto 8px;
  }

  .bottom-sheet__title {
    font-size: 16px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 8px;
  }

  .bottom-sheet__content {
    overflow-y: auto;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
