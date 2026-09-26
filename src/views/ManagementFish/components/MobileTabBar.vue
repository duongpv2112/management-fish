<template>
  <nav class="mobile-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="mobile-tab-bar__tab"
      :class="{ 'mobile-tab-bar__tab--active': tab.value === modelValue }"
      :aria-current="tab.value === modelValue ? 'page' : undefined"
      @click="emit('update:modelValue', tab.value)"
    >
      <span class="mobile-tab-bar__icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="mobile-tab-bar__label">{{ tab.text }}</span>
    </button>
  </nav>
</template>

<script setup>
// Tab dưới cùng của trang Cân trên điện thoại
defineProps({
  modelValue: {
    type: String,
    default: "can",
  },
});

const emit = defineEmits(["update:modelValue"]);

const tabs = [
  { value: "can", text: "Cân", icon: "⚖️" },
  { value: "bang", text: "Bảng", icon: "📋" },
  { value: "tien", text: "Tiền", icon: "💰" },
];
</script>

<style lang="scss" scoped>
.mobile-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 800;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: $color-card-background;
  border-top: 1px solid $color-border;

  .mobile-tab-bar__tab {
    flex: 1;
    min-height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: none;
    border-top: 3px solid transparent;
    background: transparent;
    color: $color-text-primary;
    font-size: 13px;
    font-weight: 600;
    opacity: 0.65;
    cursor: pointer;

    &.mobile-tab-bar__tab--active {
      opacity: 1;
      color: $color-primary;
      border-top-color: $color-primary;
    }
  }

  .mobile-tab-bar__icon {
    font-size: 18px;
  }
}
</style>
