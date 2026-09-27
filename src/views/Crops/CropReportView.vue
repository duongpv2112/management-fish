<template>
  <div class="report">
    <a class="report__back" href="#/vu-nuoi">← Vụ nuôi</a>

    <div class="report__error" v-if="errorMessage">{{ errorMessage }}</div>
    <div v-else-if="!report" class="report__loading">Đang tải báo cáo...</div>

    <template v-if="report">
      <header class="report-header">
        <div class="report-header__pond">{{ report.crop.pond.pondName }}</div>
        <h1 class="report-header__name">{{ report.crop.cropName }}</h1>
        <div class="report-header__meta">
          Thả ngày {{ formatDateOnly(report.crop.startDate) }}
          <template v-if="report.crop.endDate"> · Kết thúc {{ formatDateOnly(report.crop.endDate) }}</template>
          · {{ report.crop.days }} ngày
          <span class="report-header__badge" :class="{ 'report-header__badge--open': isOpen }">
            {{ isOpen ? "đang nuôi" : "đã kết thúc" }}
          </span>
        </div>
        <div class="report-header__actions">
          <CPButton class="btn-add-expense" textButton="＋ Chi phí" height="44px" @click="expenseFormOpen = true" />
          <CPButton
            v-if="isOpen"
            class="btn-close-crop"
            typeButton="danger"
            textButton="Kết thúc vụ"
            height="44px"
            @click="cropSheetOpen = true"
          />
          <CPButton
            v-else
            class="btn-reopen-crop"
            textButton="Mở lại vụ"
            height="44px"
            :disabled="isReopening"
            @click="reopenCrop"
          />
        </div>
        <div class="report__action-error" v-if="actionError">{{ actionError }}</div>
      </header>

      <div class="report-kpis">
        <div class="report-kpi">
          <span class="report-kpi__label">Tổng thu</span>
          <span class="report-kpi__value">{{ formatMoney(report.revenue.total) }}</span>
        </div>
        <div class="report-kpi">
          <span class="report-kpi__label">Tổng chi</span>
          <span class="report-kpi__value">{{ formatMoney(report.expense.total) }}</span>
        </div>
        <div class="report-kpi report-kpi--result" :class="{ 'report-kpi--loss': report.profit < 0 }">
          <span class="report-kpi__label">{{ report.profit < 0 ? "Lỗ" : "Lãi" }}</span>
          <span class="report-kpi__value">{{ formatMoney(Math.abs(report.profit)) }}</span>
        </div>
      </div>

      <section class="report-section">
        <h2>Thu</h2>
        <p v-if="report.revenue.sessions.length === 0" class="report-section__empty">Chưa có phiên bán nào.</p>
        <div v-for="session in report.revenue.sessions" :key="session._id" class="report-session">
          <div class="report-session__main">
            <span class="report-session__name">{{ session.sessionName }}</span>
            <span class="report-session__meta">
              <template v-if="session.buyerName">{{ session.buyerName }} · </template>{{ formatKg(session.totalNet) }} kg
            </span>
            <a v-if="session.missingPrice" class="report-session__warning" :href="`#/?session=${session._id}`">
              ⚠ Chưa có giá, chưa tính vào thu
            </a>
          </div>
          <span class="report-session__amount">{{ formatMoney(session.amount) }}</span>
        </div>
        <p v-if="report.revenue.excludedForeignCurrency > 0" class="report-section__note">
          Có {{ report.revenue.excludedForeignCurrency }} phiên bằng USD không được tính
        </p>
      </section>

      <section class="report-section">
        <h2>Chi</h2>
        <p v-if="report.expense.byCategory.length === 0" class="report-section__empty">Chưa có khoản chi nào.</p>
        <template v-for="line in report.expense.byCategory" :key="line.category._id">
          <button type="button" class="report-category" @click="toggleCategory(line.category._id)">
            <span>{{ line.category.categoryName }} · {{ formatPercent(line.percent) }}%</span>
            <span class="report-category__amount">{{ formatMoney(line.amount) }}</span>
          </button>
          <div v-if="expandedCategoryId === line.category._id" class="report-category__items">
            <div v-if="isLoadingItems">Đang tải...</div>
            <div v-for="expense in categoryItems" :key="expense._id" class="report-category__item">
              <span>{{ formatDateOnly(expense.date) }}<template v-if="expense.description"> · {{ expense.description }}</template></span>
              <span>{{ formatMoney(expense.amount) }}</span>
            </div>
          </div>
        </template>
      </section>

      <section class="report-section report-metrics">
        <h2>Chỉ số</h2>
        <ul>
          <li>Cá bán: {{ formatKg(report.metrics.totalNetKg) }} kg</li>
          <li>
            Giá vốn / kg: {{ report.metrics.costPerKg === null ? "—" : formatMoney(report.metrics.costPerKg) }}
          </li>
          <li v-if="report.metrics.seedQuantities.length > 0">
            Giống: {{ formatQuantities(report.metrics.seedQuantities) }}
          </li>
          <li v-if="report.metrics.feedQuantities.length > 0">
            Thức ăn: {{ formatQuantities(report.metrics.feedQuantities) }}
          </li>
          <li v-if="report.metrics.fcr !== null">Hệ số thức ăn: {{ formatKg(report.metrics.fcr) }}</li>
        </ul>
      </section>

      <CropSheet
        :open="cropSheetOpen"
        mode="close"
        :pond="report.crop.pond"
        :crop="report.crop"
        @close="cropSheetOpen = false"
        @saved="handleCropClosed"
      />
    </template>

    <ExpenseForm
      :open="expenseFormOpen"
      :expense="null"
      :defaultCropId="cropId"
      @close="expenseFormOpen = false"
      @saved="handleExpenseSaved"
    />
    <ExpenseUndoBar :expense="undoExpense" @undone="loadReport" @expired="undoExpense = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import CPButton from "@/components/ButtonComponent.vue";
import CropSheet from "./components/CropSheet.vue";
import ExpenseForm from "@/views/Expenses/components/ExpenseForm.vue";
import ExpenseUndoBar from "@/views/Expenses/components/ExpenseUndoBar.vue";
import CropAPI from "@/services/cropAPI";
import ExpenseAPI from "@/services/expenseAPI";
import { formatMoney } from "@/common/currency";
import { formatDateOnly } from "@/common/dateInput";

// Báo cáo thu – chi – lãi của một vụ nuôi (/vu-nuoi/:cropId)
const route = useRoute();
const cropId = computed(() => String(route.params.cropId));

const report = ref(null);
const errorMessage = ref("");
const actionError = ref("");
const isReopening = ref(false);
const cropSheetOpen = ref(false);
const expenseFormOpen = ref(false);
const undoExpense = ref(null);

const expandedCategoryId = ref(null);
const categoryItems = ref([]);
const isLoadingItems = ref(false);

const isOpen = computed(() => report.value?.crop.status === "open");

const formatPercent = (value) => String(value).replace(".", ",");
const formatKg = (value) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value ?? 0);
const formatQuantities = (list) => list.map((item) => `${formatKg(item.quantity)} ${item.unit}`.trim()).join(" · ");

const loadReport = async () => {
  errorMessage.value = "";
  try {
    report.value = (await CropAPI.getCropReport(cropId.value))?.data ?? null;
  } catch (error) {
    report.value = null;
    errorMessage.value = "Không thể tải báo cáo vụ, vui lòng thử lại sau.";
    console.error("Lỗi khi tải báo cáo vụ:", error);
  }
};

const loadCategoryItems = async (categoryId) => {
  isLoadingItems.value = true;
  try {
    const result = await ExpenseAPI.getExpenses({ cropId: cropId.value, categoryId, page: 1, pageSize: 100 });
    categoryItems.value = result?.data?.items ?? [];
  } catch (error) {
    categoryItems.value = [];
    console.error("Lỗi khi tải khoản chi của nhóm:", error);
  } finally {
    isLoadingItems.value = false;
  }
};

const toggleCategory = async (categoryId) => {
  if (expandedCategoryId.value === categoryId) {
    expandedCategoryId.value = null;
    return;
  }
  expandedCategoryId.value = categoryId;
  categoryItems.value = [];
  await loadCategoryItems(categoryId);
};

const reopenCrop = async () => {
  actionError.value = "";
  isReopening.value = true;
  try {
    await CropAPI.reopenCrop(cropId.value);
    await loadReport();
  } catch (error) {
    actionError.value = error?.message || "Mở lại vụ nuôi không thành công!";
  } finally {
    isReopening.value = false;
  }
};

const handleCropClosed = async () => {
  cropSheetOpen.value = false;
  await loadReport();
};

const handleExpenseSaved = async ({ expense, isNew }) => {
  expenseFormOpen.value = false;
  if (isNew) undoExpense.value = expense;
  await loadReport();
  if (expandedCategoryId.value) await loadCategoryItems(expandedCategoryId.value);
};

onMounted(loadReport);
</script>

<style lang="scss" scoped>
.report {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 12px 16px 96px;

  .report__back {
    display: inline-block;
    padding: 8px 0;
    color: $color-primary;
    font-weight: 600;
  }

  .report__error,
  .report__action-error {
    margin: 12px 0;
    padding: 8px;
    border-radius: $radius-md;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .report__loading {
    padding: 12px 0;
  }
}

.report-header {
  margin: 8px 0 16px;

  .report-header__pond {
    font-weight: 700;
    color: $color-primary;
  }

  .report-header__name {
    font-size: 22px;
    font-weight: 700;
    margin: 2px 0 4px;
  }

  .report-header__meta {
    font-size: 14px;
    opacity: 0.85;
  }

  .report-header__badge {
    margin-left: 6px;
    padding: 2px 8px;
    border-radius: $radius-sm;
    font-size: 12px;
    background-color: $color-border;

    &.report-header__badge--open {
      background-color: $color-hover;
      color: $color-primary;
      font-weight: 600;
    }
  }

  .report-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
}

.report-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.report-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: $radius-lg;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .report-kpi__label {
    font-size: 13px;
    opacity: 0.75;
  }

  .report-kpi__value {
    font-size: 18px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  &.report-kpi--result .report-kpi__value {
    color: $color-primary;
  }

  &.report-kpi--loss .report-kpi__value {
    color: $color-error;
  }
}

.report-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: $radius-lg;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .report-section__empty,
  .report-section__note {
    font-size: 14px;
    opacity: 0.8;
  }

  .report-section__note {
    margin-top: 8px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    line-height: 1.8;
  }
}

.report-session {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid $color-border;

  .report-session__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .report-session__name {
    font-weight: 600;
  }

  .report-session__meta {
    font-size: 13px;
    opacity: 0.75;
  }

  .report-session__warning {
    font-size: 13px;
    color: $color-error;
  }

  .report-session__amount {
    font-weight: 700;
    white-space: nowrap;
  }
}

.report-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 8px 0;
  border: none;
  border-bottom: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  font-size: 15px;
  text-align: left;
  cursor: pointer;

  .report-category__amount {
    font-weight: 700;
    white-space: nowrap;
  }
}

.report-category__items {
  padding: 4px 0 8px 12px;
  font-size: 14px;

  .report-category__item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }
}

@media (max-width: 899.98px) {
  .report {
    padding: 8px 12px 96px;
  }

  .report-kpis {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
