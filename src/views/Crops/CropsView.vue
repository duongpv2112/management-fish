<template>
  <div class="crops">
    <h1 class="crops-title">Vụ nuôi</h1>

    <div class="crops__error" v-if="errorMessage">{{ errorMessage }}</div>

    <div v-if="isLoading && ponds.length === 0" class="crops__empty">Đang tải dữ liệu...</div>
    <div v-else-if="!errorMessage && ponds.length === 0" class="crops__empty">
      Chưa có ao. <a href="#/danh-muc">Thêm ao trong Danh mục</a>.
    </div>

    <div class="crops__grid">
      <PondCard
        v-for="pond in ponds"
        :key="pond._id"
        :pond="pond"
        :openCrop="openCropByPond.get(pond._id) ?? null"
        :report="reports[openCropByPond.get(pond._id)?._id] ?? null"
        @start="openSheet('start', pond, null)"
        @close="(crop) => openSheet('close', pond, crop)"
        @open="openReport"
        @addExpense="openExpenseForm"
      />
    </div>

    <div v-if="closedCrops.length > 0" class="crops__closed">
      <h2>Vụ đã kết thúc</h2>
      <button
        v-for="crop in closedCrops"
        :key="crop._id"
        type="button"
        class="crops__closed-item"
        @click="openReport(crop)"
      >
        <span class="crops__closed-name">
          {{ crop.cropName }}
          <span v-if="crop.pond?.pondName && !crop.cropName.includes(crop.pond.pondName)" class="crops__closed-pond">
            · {{ crop.pond.pondName }}
          </span>
        </span>
        <span class="crops__closed-dates">
          {{ formatDateOnly(crop.startDate) }} – {{ formatDateOnly(crop.endDate) }}
        </span>
      </button>
    </div>

    <ExpenseForm
      :open="expenseForm.open"
      :expense="null"
      :defaultCropId="expenseForm.cropId"
      @close="expenseForm.open = false"
      @saved="handleExpenseSaved"
    />
    <ExpenseUndoBar :expense="undoExpense" @undone="loadReports" @expired="undoExpense = null" />

    <CropSheet
      :open="sheet.open"
      :mode="sheet.mode"
      :pond="sheet.pond"
      :crop="sheet.crop"
      @close="sheet.open = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from "vue";
import { routerKey } from "vue-router";

import PondCard from "./components/PondCard.vue";
import CropSheet from "./components/CropSheet.vue";
import ExpenseForm from "@/views/Expenses/components/ExpenseForm.vue";
import ExpenseUndoBar from "@/views/Expenses/components/ExpenseUndoBar.vue";
import PondAPI from "@/services/pondAPI";
import CropAPI from "@/services/cropAPI";
import { formatDateOnly } from "@/common/dateInput";

// inject thay cho useRouter để component vẫn chạy khi không có router (test)
const router = inject(routerKey, null);

const ponds = ref([]);
const crops = ref([]);
// Báo cáo tạm tính của vụ đang nuôi, theo id vụ
const reports = ref({});
const isLoading = ref(false);
const errorMessage = ref("");

const sheet = reactive({ open: false, mode: "start", pond: null, crop: null });
const expenseForm = reactive({ open: false, cropId: null });
const undoExpense = ref(null);

const openCropByPond = computed(
  () => new Map(crops.value.filter((crop) => crop.status === "open").map((crop) => [crop.pond?._id, crop]))
);

// Vụ đã kết thúc, mới kết thúc nhất trước
const closedCrops = computed(() =>
  crops.value
    .filter((crop) => crop.status === "closed")
    .sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)))
);

const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const [pondResult, cropResult] = await Promise.all([PondAPI.getPonds(), CropAPI.getCrops()]);
    ponds.value = pondResult?.data ?? [];
    crops.value = cropResult?.data ?? [];
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách ao, vui lòng thử lại sau.";
    console.error("Lỗi khi tải vụ nuôi:", error);
  } finally {
    isLoading.value = false;
  }
  await loadReports();
};

// Số tạm tính cho từng vụ đang nuôi; vụ nào lỗi thì thẻ đó không hiện số
const loadReports = async () => {
  const openCrops = crops.value.filter((crop) => crop.status === "open");
  const entries = await Promise.all(
    openCrops.map(async (crop) => {
      try {
        return [crop._id, (await CropAPI.getCropReport(crop._id))?.data ?? null];
      } catch (error) {
        console.error("Lỗi khi tải báo cáo vụ:", error);
        return [crop._id, null];
      }
    })
  );
  reports.value = Object.fromEntries(entries);
};

const openSheet = (mode, pond, crop) => {
  Object.assign(sheet, { open: true, mode, pond, crop });
};

const handleSaved = async () => {
  sheet.open = false;
  await loadData();
};

const openReport = (crop) => {
  router?.push({ name: "crop-report", params: { cropId: crop._id } });
};

const openExpenseForm = (crop) => {
  Object.assign(expenseForm, { open: true, cropId: crop._id });
};

const handleExpenseSaved = async ({ expense, isNew }) => {
  expenseForm.open = false;
  if (isNew) undoExpense.value = expense;
  await loadReports();
};

onMounted(loadData);
</script>

<style lang="scss" scoped>
.crops {
  width: 100%;
  padding: 0 16px 20px;

  .crops-title {
    font-size: 24px;
    text-transform: uppercase;
    text-align: center;
    padding: 20px 0;
    font-weight: 600;
    color: $color-primary;
  }

  .crops__error {
    margin-bottom: 12px;
    padding: 8px;
    border-radius: $radius-md;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .crops__empty {
    padding: 12px 0;

    a {
      color: $color-primary;
      font-weight: 600;
    }
  }

  .crops__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .crops__closed {
    margin-top: 24px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
  }

  .crops__closed-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    width: 100%;
    min-height: 48px;
    padding: 12px 8px;
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

  .crops__closed-name {
    font-weight: 600;
  }

  .crops__closed-pond {
    font-weight: 400;
    opacity: 0.75;
  }

  .crops__closed-dates {
    font-size: 14px;
    opacity: 0.75;
  }
}

@media (max-width: 899.98px) {
  .crops {
    padding: 0 12px 20px;

    .crops-title {
      font-size: 20px;
      padding: 12px 0;
    }

    .crops__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
