<template>
  <div :id="idPrefix" class="choice-grid">
    <div v-if="items.length === 0" class="choice-grid__empty">
      {{ emptyText }}
      <a v-if="showCatalogLink" href="#/danh-muc">Mở Danh mục</a>
    </div>
    <div v-else class="choice-grid__grid">
      <button
        v-for="item in visibleItems"
        :key="item[valueField]"
        type="button"
        class="choice-grid__item"
        :class="{ 'choice-grid__item--selected': item[valueField] === modelValue }"
        :aria-pressed="item[valueField] === modelValue ? 'true' : 'false'"
        :disabled="disabled"
        @click="emit('update', item[valueField])"
      >
        <span class="choice-grid__text">{{ item[textField] }}</span>
        <small v-if="subText" class="choice-grid__sub">{{ subText(item) }}</small>
      </button>
      <button
        v-if="hiddenItems.length > 0"
        type="button"
        class="choice-grid__item choice-grid__more"
        :disabled="disabled"
        @click="openSheet"
      >
        ＋ {{ moreLabel }} ({{ hiddenItems.length }})
      </button>
    </div>

    <BottomSheet :open="isSheetOpen" :title="moreLabel" @close="isSheetOpen = false">
      <input
        ref="searchRef"
        v-model="query"
        class="choice-grid__search"
        type="text"
        placeholder="Gõ tên để tìm…"
        autocomplete="off"
      />
      <button
        v-for="item in filteredHiddenItems"
        :key="item[valueField]"
        type="button"
        class="choice-grid__option"
        @click="pickFromSheet(item)"
      >
        {{ item[textField] }}
      </button>
      <div v-if="filteredHiddenItems.length === 0" class="choice-grid__no-result">Không tìm thấy</div>
    </BottomSheet>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import { normalizeVi } from "@/voice/vietnameseNumber";

// Lưới nút lớn chạm một lần để chọn; loại ít dùng nằm trong "Loại khác" (có ô tìm)
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, null],
    default: null,
  },
  valueField: {
    type: String,
    default: "_id",
  },
  textField: {
    type: String,
    default: "",
  },
  // item → dòng phụ, ví dụ trọng lượng giỏ "2 kg"
  subText: {
    type: Function,
    default: null,
  },
  // id đã xếp hạng (rankChoices)
  ranking: {
    type: Array,
    default: () => [],
  },
  maxVisible: {
    type: Number,
    default: 5,
  },
  idPrefix: {
    type: String,
    default: "",
  },
  moreLabel: {
    type: String,
    default: "Loại khác",
  },
  emptyText: {
    type: String,
    default: "",
  },
  // Chỉ gợi ý mở Danh mục khi danh mục thật sự trống (không phải đang tải hay tải lỗi)
  showCatalogLink: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update"]);

const isSheetOpen = ref(false);
const query = ref("");
const searchRef = ref(null);

const itemById = computed(() => new Map(props.items.map((item) => [item[props.valueField], item])));

// Xếp hạng: theo ranking, id thiếu trong ranking xếp sau theo thứ tự danh mục
const rankedItems = computed(() => {
  const ranked = props.ranking.filter((id) => itemById.value.has(id)).map((id) => itemById.value.get(id));
  const rankedIds = new Set(ranked.map((item) => item[props.valueField]));
  return [...ranked, ...props.items.filter((item) => !rankedIds.has(item[props.valueField]))];
});

// Xếp hạng chỉ quyết định loại nào được hiện; nút luôn đứng theo thứ tự danh mục
// để người quen bấm theo vị trí không bị bấm nhầm khi thứ hạng thay đổi
const visibleItems = computed(() => {
  // Ít loại thì hiện hết (không cần nút "Loại khác" chỉ để giấu 1 loại)
  if (props.items.length <= props.maxVisible + 1) return props.items;
  const chosen = rankedItems.value.slice(0, props.maxVisible);
  const selected = itemById.value.get(props.modelValue);
  // Lựa chọn hiện tại (vd. từ giọng nói) luôn phải thấy được trên lưới
  if (selected && !chosen.includes(selected)) chosen[chosen.length - 1] = selected;
  return props.items.filter((item) => chosen.includes(item));
});

const hiddenItems = computed(() => props.items.filter((item) => !visibleItems.value.includes(item)));

const filteredHiddenItems = computed(() => {
  const text = normalizeVi(query.value);
  if (!text) return hiddenItems.value;
  return hiddenItems.value.filter((item) => normalizeVi(item[props.textField] ?? "").includes(text));
});

const openSheet = async () => {
  query.value = "";
  isSheetOpen.value = true;
  await nextTick();
  searchRef.value?.focus();
};

const pickFromSheet = (item) => {
  isSheetOpen.value = false;
  emit("update", item[props.valueField]);
};
</script>

<style lang="scss" scoped>
.choice-grid {
  .choice-grid__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .choice-grid__item {
    min-height: 44px;
    padding: 4px 6px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    background-color: $color-card-background;
    color: $color-text-primary;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;

    &.choice-grid__item--selected {
      border-color: $color-primary;
      // Viền dày thêm bằng bóng trong, không làm xô chữ
      box-shadow: inset 0 0 0 1px $color-primary;
      background-color: $color-hover;
      color: $color-primary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .choice-grid__sub {
      font-size: 12px;
      font-weight: 400;
      opacity: 0.7;
    }
  }

  .choice-grid__more {
    border-style: dashed;
    color: $color-primary;
  }

  .choice-grid__empty {
    font-size: 14px;
    color: $color-text-primary;
    padding: 8px 0;

    a {
      color: $color-primary;
      font-weight: 600;
      margin-left: 4px;
    }
  }

  .choice-grid__search {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px $color-focus-ring;
    }
  }

  .choice-grid__option {
    display: block;
    width: 100%;
    min-height: 48px;
    padding: 0 8px;
    border: none;
    border-bottom: 1px solid $color-border;
    background: transparent;
    text-align: left;
    font-size: 16px;
    font-weight: 600;
    color: $color-text-primary;
    cursor: pointer;
  }

  .choice-grid__no-result {
    padding: 12px 8px;
    font-size: 14px;
    opacity: 0.7;
  }
}
</style>
