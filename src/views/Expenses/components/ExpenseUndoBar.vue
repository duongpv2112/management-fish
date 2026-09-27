<template>
  <div v-if="visible && expense" class="expense-undo" role="status">
    <span class="expense-undo__text">
      Đã lưu {{ expense.description || "khoản chi" }} · {{ formatMoney(expense.amount) }}
    </span>
    <button type="button" class="btn-expense-undo" :disabled="isUndoing" @click="undo">Hoàn tác</button>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";

import ExpenseAPI from "@/services/expenseAPI";
import { formatMoney } from "@/common/currency";

// Thanh "Hoàn tác" 10 giây sau khi thêm khoản chi (giống nút Hoàn tác khi cân)
const UNDO_MS = 10000;

const props = defineProps({
  expense: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["undone", "expired"]);

const visible = ref(false);
const isUndoing = ref(false);
let timer = null;

const clearTimer = () => {
  if (timer) clearTimeout(timer);
  timer = null;
};

watch(
  () => props.expense,
  (expense) => {
    clearTimer();
    visible.value = Boolean(expense);
    if (!expense) return;
    timer = setTimeout(() => {
      visible.value = false;
      emit("expired");
    }, UNDO_MS);
  }
);

const undo = async () => {
  isUndoing.value = true;
  try {
    await ExpenseAPI.deleteExpense(props.expense._id);
    clearTimer();
    visible.value = false;
    emit("undone");
  } catch (error) {
    console.error("Lỗi khi hoàn tác khoản chi:", error);
  } finally {
    isUndoing.value = false;
  }
};

onBeforeUnmount(clearTimer);
</script>

<style lang="scss" scoped>
.expense-undo {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 12px;
  width: max-content;
  max-width: calc(100vw - 32px);
  padding: 8px 8px 8px 16px;
  border-radius: $radius-md;
  background-color: $color-text-primary;
  color: $color-card-background;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  .expense-undo__text {
    flex: 1;
    min-width: 0;
    font-size: 14px;
  }

  .btn-expense-undo {
    min-height: 44px;
    padding: 0 14px;
    border: none;
    border-radius: $radius-md;
    background-color: $color-card-background;
    color: $color-primary;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
