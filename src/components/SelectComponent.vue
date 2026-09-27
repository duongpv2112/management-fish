<template>
  <div class="cp-select" :class="{ 'cp-select--open': isOpen }" v-click-outside="close">
    <button
      :id="idControl"
      ref="triggerRef"
      type="button"
      class="cp-select__trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="listId"
      :disabled="disabled"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <span class="cp-select__value">{{ selectedLabel }}</span>
      <i class="mdi mdi-chevron-down cp-select__chevron" aria-hidden="true"></i>
    </button>
    <ul
      v-if="isOpen"
      :id="listId"
      ref="listRef"
      class="cp-select__list"
      :class="{
        'cp-select__list--start': placement.horizontal === 'start',
        'cp-select__list--up': placement.vertical === 'up',
      }"
      :style="placementStyle"
      role="listbox"
    >
      <li
        v-for="(option, index) in options"
        :key="option.value"
        role="option"
        class="cp-select__option"
        :class="{
          'cp-select__option--active': index === activeIndex,
          'cp-select__option--selected': option.value === modelValue,
        }"
        :data-value="option.value"
        :aria-selected="option.value === modelValue ? 'true' : 'false'"
        @click="pick(option)"
        @mouseenter="activeIndex = index"
      >
        <span>{{ option.label }}</span>
        <i v-if="option.value === modelValue" class="mdi mdi-check" aria-hidden="true"></i>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import "@mdi/font/css/materialdesignicons.css";

import { useDropdownPlacement } from "@/composables/useDropdownPlacement";

// Ô chọn tự vẽ thay <select> mặc định: bấm mở danh sách, chọn bằng chuột hoặc bàn phím
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  // [{ value, label }]
  options: {
    type: Array,
    default: () => [],
  },
  idControl: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const isOpen = ref(false);
const triggerRef = ref(null);
const listRef = ref(null);
// Thiếu chỗ bên trái thì mở sang phải (và ngược lại), thiếu chỗ bên dưới thì mở lên trên
const { placement, placementStyle } = useDropdownPlacement(triggerRef, listRef, isOpen);
const activeIndex = ref(-1);

const listId = computed(() => `${props.idControl || "cp-select"}-list`);
const selectedIndex = computed(() => props.options.findIndex((option) => option.value === props.modelValue));
const selectedLabel = computed(() => props.options[selectedIndex.value]?.label ?? "");

const open = () => {
  if (props.disabled) return;
  isOpen.value = true;
  activeIndex.value = Math.max(selectedIndex.value, 0);
};

const close = () => {
  isOpen.value = false;
};

const toggle = () => (isOpen.value ? close() : open());

const pick = (option) => {
  close();
  if (option.value === props.modelValue) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
};

const moveActive = (step) => {
  const last = props.options.length - 1;
  activeIndex.value = Math.min(Math.max(activeIndex.value + step, 0), last);
};

const handleKeydown = (event) => {
  if (!isOpen.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    }
    return;
  }
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      moveActive(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      moveActive(-1);
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      if (props.options[activeIndex.value]) pick(props.options[activeIndex.value]);
      break;
    case "Escape":
      event.preventDefault();
      close();
      break;
    case "Tab":
      close();
      break;
  }
};
</script>

<style lang="scss" scoped>
.cp-select {
  position: relative;
  display: inline-block;
  min-width: 132px;

  .cp-select__trigger {
    width: 100%;
    height: 40px;
    padding: 0 10px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    background-color: $color-card-background;
    color: $color-text-primary;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover:not(:disabled) {
      border-color: $color-primary;
    }

    &:focus-visible {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-focus-ring;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .cp-select__chevron {
      font-size: 20px;
      color: $color-primary;
      transition: transform 0.2s ease;
    }
  }

  &.cp-select--open .cp-select__trigger {
    border-color: $color-primary;
    box-shadow: 0 0 0 3px $color-focus-ring;

    .cp-select__chevron {
      transform: rotate(180deg);
    }
  }

  .cp-select__list {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 100%;
    z-index: 950;
    margin: 0;
    padding: 4px;
    list-style: none;
    background-color: $color-card-background;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    // Bên trái không đủ chỗ: căn mép trái với ô, danh sách mở sang phải
    &.cp-select__list--start {
      right: auto;
      left: 0;
    }

    // Bên dưới không đủ chỗ: mở lên trên
    &.cp-select__list--up {
      top: auto;
      bottom: calc(100% + 4px);
    }
  }

  .cp-select__option {
    min-height: 36px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-radius: $radius-sm;
    font-size: 14px;
    white-space: nowrap;
    color: $color-text-primary;
    cursor: pointer;

    // Danh sách bị giới hạn chiều rộng (hai bên đều thiếu chỗ) → chữ dài hiện "…"
    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &.cp-select__option--active {
      background-color: $color-background;
    }

    &.cp-select__option--selected {
      background-color: $color-hover;
      color: $color-primary;
      font-weight: 600;
    }
  }
}

// Điện thoại: đủ cao để chạm
@media (max-width: 899.98px) {
  .cp-select {
    .cp-select__trigger {
      height: 44px;
      font-size: 16px;
    }

    .cp-select__option {
      min-height: 44px;
      font-size: 16px;
    }
  }
}
</style>
