<template>
  <div class="expenses">
    <div class="expenses__header">
      <h1 class="expenses-title">Chi phí</h1>
      <CPButton
        v-if="!isMobile"
        class="btn-add-expense"
        typeButton="primary"
        textButton="＋ Chi phí"
        height="40px"
        @click="openAdd"
      />
    </div>

    <div class="expenses__filters">
      <div class="expenses__filter">
        <label class="expenses__filter-label" for="expenseScope">Ao / vụ</label>
        <CPSelect idControl="expenseScope" v-model="scope" :options="scopeOptions" @change="applyFilter" />
      </div>
      <div class="expenses__filter">
        <label class="expenses__filter-label" for="expenseMonth">Tháng</label>
        <CPSelect idControl="expenseMonth" v-model="month" :options="monthOptions" @change="applyFilter" />
      </div>
    </div>

    <div class="expenses__error" v-if="errorMessage">{{ errorMessage }}</div>

    <div class="expenses__total">Tổng: {{ formatMoney(totalAmount) }}</div>

    <div v-if="items.length === 0 && !errorMessage" class="expenses__empty">
      {{ isLoading ? "Đang tải dữ liệu..." : "Chưa có khoản chi." }}
    </div>
    <button
      v-for="expense in items"
      :key="expense._id"
      type="button"
      class="expense-row"
      @click="openEdit(expense)"
    >
      <span class="expense-row__main">
        <span class="expense-row__title">
          {{ expense.category?.categoryName }}<template v-if="expense.description"> · {{ expense.description }}</template>
        </span>
        <span class="expense-row__meta">
          {{ formatDateOnly(expense.date) }} · {{ expense.crop?.pond?.pondName ?? (expense.crop ? expense.crop.cropName : "Chung") }}
        </span>
      </span>
      <span class="expense-row__amount">{{ formatMoney(expense.amount) }}</span>
    </button>

    <div v-if="pageCount > 1" class="expenses__paging">
      <CPButton class="btn-prev-page" textButton="Trước" height="44px" :disabled="page <= 1" @click="goToPage(page - 1)" />
      <span class="expenses__page">Trang {{ page }} / {{ pageCount }}</span>
      <CPButton
        class="btn-next-page"
        textButton="Sau"
        height="44px"
        :disabled="page >= pageCount"
        @click="goToPage(page + 1)"
      />
    </div>

    <ExpenseForm
      :open="form.open"
      :expense="form.expense"
      :defaultCropId="defaultCropId"
      @close="form.open = false"
      @saved="handleSaved"
      @deleted="handleDeleted"
    />
    <ExpenseUndoBar :expense="undoExpense" @undone="loadExpenses" @expired="undoExpense = null" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

import CPButton from "@/components/ButtonComponent.vue";
import CPSelect from "@/components/SelectComponent.vue";
import ExpenseForm from "./components/ExpenseForm.vue";
import ExpenseUndoBar from "./components/ExpenseUndoBar.vue";
import ExpenseAPI from "@/services/expenseAPI";
import CropAPI from "@/services/cropAPI";
import { formatMoney } from "@/common/currency";
import { formatDateOnly } from "@/common/dateInput";
import { useIsMobile } from "@/composables/useIsMobile";
import { clearTopBarAction, setTopBarAction } from "@/common/topBarAction";

const PAGE_SIZE = 20;
const MONTH_COUNT = 12;

const items = ref([]);
const total = ref(0);
const totalAmount = ref(0);
const page = ref(1);
const crops = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

// "all" | "common" | "crop:<id>"
const scope = ref("all");
// "" | "YYYY-MM"
const month = ref("");

const form = reactive({ open: false, expense: null });
const undoExpense = ref(null);

const isMobile = useIsMobile();

const pad = (value) => String(value).padStart(2, "0");

const scopeOptions = computed(() => [
  { value: "all", label: "Tất cả" },
  { value: "common", label: "Chung" },
  ...crops.value.map((crop) => ({ value: `crop:${crop._id}`, label: crop.cropName })),
]);

// 12 tháng gần nhất theo giờ máy, mới nhất trước
const monthOptions = computed(() => {
  const now = new Date();
  const options = [{ value: "", label: "Tất cả tháng" }];
  for (let offset = 0; offset < MONTH_COUNT; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    options.push({ value: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`, label: `${pad(date.getMonth() + 1)}/${date.getFullYear()}` });
  }
  return options;
});

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

// Thêm từ bộ lọc vụ thì chọn sẵn vụ đó, bộ lọc "Chung" thì chọn sẵn Chung
const defaultCropId = computed(() => {
  if (scope.value === "common") return null;
  if (scope.value.startsWith("crop:")) return scope.value.slice(5);
  return undefined;
});

const buildParams = () => {
  const params = {};
  if (scope.value === "common") params.common = 1;
  else if (scope.value.startsWith("crop:")) params.cropId = scope.value.slice(5);
  if (month.value) {
    const [year, monthNumber] = month.value.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    params.from = `${month.value}-01`;
    params.to = `${month.value}-${pad(lastDay)}`;
  }
  params.page = page.value;
  params.pageSize = PAGE_SIZE;
  return params;
};

const loadExpenses = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const result = (await ExpenseAPI.getExpenses(buildParams()))?.data;
    items.value = result?.items ?? [];
    total.value = result?.total ?? 0;
    totalAmount.value = result?.totalAmount ?? 0;
  } catch (error) {
    items.value = [];
    errorMessage.value = "Không thể tải danh sách khoản chi, vui lòng thử lại sau.";
    console.error("Lỗi khi tải khoản chi:", error);
  } finally {
    isLoading.value = false;
  }
};

const loadCrops = async () => {
  try {
    crops.value = (await CropAPI.getCrops())?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải vụ nuôi:", error);
  }
};

const applyFilter = async () => {
  page.value = 1;
  await loadExpenses();
};

const goToPage = async (target) => {
  page.value = target;
  await loadExpenses();
};

const openAdd = () => {
  Object.assign(form, { open: true, expense: null });
};

const openEdit = (expense) => {
  Object.assign(form, { open: true, expense });
};

const handleSaved = async ({ expense, isNew }) => {
  form.open = false;
  if (isNew) undoExpense.value = expense;
  await loadExpenses();
};

const handleDeleted = async () => {
  form.open = false;
  await loadExpenses();
};

// Điện thoại: nút "＋ Chi phí" nằm trên thanh trên cùng
watch(
  isMobile,
  (mobile) => {
    if (mobile) setTopBarAction("＋ Chi phí", openAdd, { chevron: false });
    else clearTopBarAction();
  },
  { immediate: true }
);

onBeforeUnmount(clearTopBarAction);

onMounted(async () => {
  await Promise.all([loadExpenses(), loadCrops()]);
});
</script>

<style lang="scss" scoped>
.expenses {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 96px;

  .expenses__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .expenses-title {
    font-size: 24px;
    text-transform: uppercase;
    padding: 20px 0;
    font-weight: 600;
    color: $color-primary;
  }

  .expenses__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  .expenses__filter {
    flex: 1;
    min-width: 160px;
  }

  .expenses__filter-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .expenses__error {
    margin-bottom: 12px;
    padding: 8px;
    border-radius: $radius-md;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .expenses__total {
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: 700;
    color: $color-primary;
  }

  .expenses__empty {
    padding: 12px 0;
  }

  .expense-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px;
    border: none;
    border-bottom: 1px solid $color-border;
    background: transparent;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;

    &:hover {
      background-color: $color-hover;
    }
  }

  .expense-row__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .expense-row__title {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .expense-row__meta {
    font-size: 13px;
    opacity: 0.7;
  }

  .expense-row__amount {
    font-weight: 700;
    white-space: nowrap;
  }

  .expenses__paging {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
  }
}

@media (max-width: 899.98px) {
  .expenses {
    padding: 0 12px 96px;

    .expenses-title {
      font-size: 20px;
      padding: 12px 0;
    }
  }
}
</style>
