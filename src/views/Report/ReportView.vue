<template>
  <div class="overview print-area">
    <div class="overview__header">
      <h1 class="overview-title">Báo cáo</h1>
      <CPButton class="btn-print-overview no-print" textButton="In báo cáo" height="44px" @click="printReport" />
    </div>

    <div class="overview__filters no-print">
      <div class="overview__filter">
        <label class="overview__filter-label" for="reportPeriod">Kỳ</label>
        <CPSelect idControl="reportPeriod" v-model="period" :options="periodOptions" @change="handlePeriodChange" />
      </div>
      <template v-if="period === CUSTOM">
        <div class="overview__filter">
          <label class="overview__filter-label" for="reportFrom">Từ ngày</label>
          <CPDate idControl="reportFrom" v-model="customFrom" />
        </div>
        <div class="overview__filter">
          <label class="overview__filter-label" for="reportTo">Đến ngày</label>
          <CPDate idControl="reportTo" v-model="customTo" />
        </div>
        <div class="overview__filter overview__filter--button">
          <CPButton class="btn-apply-range" typeButton="primary" textButton="Xem" height="44px" @click="applyRange" />
        </div>
      </template>
    </div>
    <div class="report__range-error no-print" v-if="rangeError">{{ rangeError }}</div>

    <label v-if="rangeHasToday" class="overview__toggle no-print">
      <input id="includeOpen" type="checkbox" v-model="includeOpen" @change="loadOverview" />
      Tính cả vụ đang nuôi (tạm tính)
    </label>

    <div v-if="isLoading && data" class="overview__reloading no-print" role="status">Đang tải...</div>
    <div class="overview__error" v-if="errorMessage">{{ errorMessage }}</div>
    <div v-else-if="!data" class="overview__loading">Đang tải báo cáo...</div>

    <template v-if="data">
      <p class="overview__period">
        Kỳ: {{ formatDateOnly(data.period.from) }} – {{ formatDateOnly(data.period.to) }}
      </p>

      <section class="overview-section report-crops">
        <h2>Các vụ kết thúc trong kỳ</h2>
        <p v-if="data.crops.length === 0" class="overview-section__empty">Chưa có vụ nào kết thúc trong kỳ.</p>
        <button
          v-for="row in data.crops"
          :key="row.crop._id"
          type="button"
          class="report-crop-row"
          :class="{ 'report-crop-row--loss': row.profit < 0 }"
          @click="openCrop(row.crop._id)"
        >
          <span class="report-crop-row__name">
            <strong>{{ row.crop.pond.pondName }}</strong> · {{ cropTitle(row.crop) }}
            <span class="report-crop-row__dates">
              {{ formatDateOnly(row.crop.startDate) }} – {{ formatDateOnly(row.crop.endDate) }}
            </span>
          </span>
          <span class="report-crop-row__cell"><small>Thu</small> {{ formatMoney(row.revenue) }}</span>
          <span class="report-crop-row__cell"><small>Chi</small> {{ formatMoney(row.expense) }}</span>
          <span class="report-crop-row__cell report-crop-row__result">
            <small>{{ row.profit < 0 ? "Lỗ" : "Lãi" }}</small> {{ formatMoney(Math.abs(row.profit)) }}
          </span>
        </button>
      </section>

      <section v-if="periodHasToday(data.period) && data.openCrops.length > 0" class="overview-section report-open">
        <h2>Đang nuôi (tạm tính)</h2>
        <button
          v-for="row in data.openCrops"
          :key="row.crop._id"
          type="button"
          class="report-crop-row"
          :class="{ 'report-crop-row--loss': row.profit < 0 }"
          @click="openCrop(row.crop._id)"
        >
          <span class="report-crop-row__name">
            <strong>{{ row.crop.pond.pondName }}</strong> · {{ cropTitle(row.crop) }}
            <span class="report-crop-row__dates">Thả ngày {{ formatDateOnly(row.crop.startDate) }}</span>
          </span>
          <span class="report-crop-row__cell"><small>Thu</small> {{ formatMoney(row.revenue) }}</span>
          <span class="report-crop-row__cell"><small>Chi</small> {{ formatMoney(row.expense) }}</span>
          <span class="report-crop-row__cell report-crop-row__result">
            <small>{{ row.profit < 0 ? "Lỗ" : "Lãi" }}</small> {{ formatMoney(Math.abs(row.profit)) }}
          </span>
        </button>
      </section>

      <section class="overview-section report-crops-total">
        <h2>{{ data.includeOpen ? "Tổng các vụ (gồm vụ đang nuôi)" : "Tổng các vụ" }}</h2>
        <div class="overview-line"><span>Tổng thu</span><span>{{ formatMoney(data.cropsTotal.revenue) }}</span></div>
        <div class="overview-line"><span>Tổng chi của vụ</span><span>{{ formatMoney(data.cropsTotal.expense) }}</span></div>
        <div class="overview-line overview-line--strong">
          <span>{{ data.cropsTotal.profit < 0 ? "Lỗ các vụ" : "Lãi các vụ" }}</span>
          <span>{{ formatMoney(Math.abs(data.cropsTotal.profit)) }}</span>
        </div>
        <p v-if="data.excludedForeignCurrency > 0" class="overview-section__note">
          Có {{ data.excludedForeignCurrency }} phiên bằng USD không được tính
        </p>
      </section>

      <section class="overview-section report-common">
        <h2>Chi phí chung</h2>
        <p v-if="data.commonExpense.byCategory.length === 0" class="overview-section__empty">
          Không có chi phí chung trong kỳ.
        </p>
        <div v-for="line in data.commonExpense.byCategory" :key="line.category._id" class="overview-line">
          <span>{{ line.category.categoryName }} · {{ formatMoney(line.amount) }}</span>
        </div>
        <div class="overview-line overview-line--strong">
          <span>Tổng chi phí chung</span><span>{{ formatMoney(data.commonExpense.total) }}</span>
        </div>
      </section>

      <div class="report-net" :class="{ 'report-net--loss': data.netProfit < 0 }">
        <span class="report-net__label">{{ data.netProfit < 0 ? "Lỗ ròng cả nhà" : "Lãi ròng cả nhà" }}</span>
        <span class="report-net__value">{{ formatMoney(Math.abs(data.netProfit)) }}</span>
      </div>

      <section class="overview-section">
        <h2>Lãi / lỗ từng vụ</h2>
        <ProfitChart :rows="chartRows" />
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import CPButton from "@/components/ButtonComponent.vue";
import CPSelect from "@/components/SelectComponent.vue";
import CPDate from "@/components/DateInputComponent.vue";
import ProfitChart from "./components/ProfitChart.vue";
import ReportAPI from "@/services/reportAPI";
import { formatMoney } from "@/common/currency";
import { formatDateOnly, todayInputValue } from "@/common/dateInput";

// Báo cáo tổng (/bao-cao): lãi các vụ trong kỳ − chi phí chung = lãi ròng cả nhà
const router = useRouter();

const CUSTOM = "custom";
const YEAR_COUNT = 5;
const currentYear = new Date().getFullYear();

const periodOptions = [
  ...Array.from({ length: YEAR_COUNT }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: `Năm ${year}` };
  }),
  { value: CUSTOM, label: "Tùy chọn" },
];

const yearRange = (year) => ({ from: `${year}-01-01`, to: `${year}-12-31` });

const period = ref(String(currentYear));
const customFrom = ref("");
const customTo = ref("");
const rangeError = ref("");
const includeOpen = ref(false);
// Khoảng ngày đang xem (chỉ đổi khi chọn năm hoặc bấm "Xem" với khoảng hợp lệ)
const range = ref(yearRange(currentYear));

const data = ref(null);
const isLoading = ref(false);
// Chỉ nhận phản hồi của lần tải mới nhất (đổi kỳ nhanh thì phản hồi cũ có thể về sau)
let latestRequest = 0;

// Vụ đang nuôi chỉ có nghĩa khi kỳ có ngày hôm nay (không cộng lãi tạm tính hiện tại vào năm cũ)
const periodHasToday = ({ from, to }) => {
  const today = todayInputValue();
  return from <= today && today <= to;
};
const rangeHasToday = computed(() => periodHasToday(range.value));
const errorMessage = ref("");

// Tên vụ mặc định đã có tên ao ("Ao 1 · Vụ 09/2026") thì bỏ phần tên ao để không lặp
const cropTitle = (crop) => {
  const prefix = `${crop.pond.pondName} · `;
  return crop.cropName.startsWith(prefix) ? crop.cropName.slice(prefix.length) : crop.cropName;
};
const rowLabel = (crop) => `${crop.pond.pondName} · ${cropTitle(crop)}`;

const chartRows = computed(() => {
  if (!data.value) return [];
  const rows = data.value.includeOpen ? [...data.value.crops, ...data.value.openCrops] : data.value.crops;
  return rows.map((row) => ({ label: rowLabel(row.crop), profit: row.profit }));
});

const loadOverview = async () => {
  const request = ++latestRequest;
  errorMessage.value = "";
  isLoading.value = true;
  try {
    const result = await ReportAPI.getOverview({
      ...range.value,
      includeOpen: includeOpen.value && rangeHasToday.value ? 1 : 0,
    });
    if (request !== latestRequest) return;
    data.value = result?.data ?? null;
  } catch (error) {
    if (request !== latestRequest) return;
    data.value = null;
    errorMessage.value = "Không thể tải báo cáo tổng, vui lòng thử lại sau.";
    console.error("Lỗi khi tải báo cáo tổng:", error);
  } finally {
    if (request === latestRequest) isLoading.value = false;
  }
};

const handlePeriodChange = () => {
  rangeError.value = "";
  if (period.value === CUSTOM) {
    // Điền sẵn khoảng đang xem để chỉ cần sửa một đầu
    customFrom.value = range.value.from;
    customTo.value = range.value.to;
    return;
  }
  range.value = yearRange(period.value);
  loadOverview();
};

const applyRange = () => {
  if (!customFrom.value || !customTo.value) {
    rangeError.value = "Vui lòng chọn đủ từ ngày và đến ngày.";
    return;
  }
  // "YYYY-MM-DD" so sánh chuỗi được
  if (customFrom.value > customTo.value) {
    rangeError.value = "Ngày kết thúc không được trước ngày bắt đầu!";
    return;
  }
  rangeError.value = "";
  range.value = { from: customFrom.value, to: customTo.value };
  loadOverview();
};

const openCrop = (cropId) => router.push({ name: "crop-report", params: { cropId } });

const printReport = () => window.print();

onMounted(loadOverview);
</script>

<style lang="scss" scoped>
.overview {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 96px;
}

.overview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overview-title {
  font-size: 24px;
  text-transform: uppercase;
  padding: 20px 0;
  font-weight: 600;
  color: $color-primary;
}

.overview__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.overview__filter {
  flex: 1;
  min-width: 160px;
}

.overview__filter--button {
  flex: 0 0 auto;
  min-width: 0;
  align-self: flex-end;
}

.overview__filter-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.report__range-error,
.overview__error {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: $radius-md;
  text-align: center;
  color: $color-error;
  background-color: lighten($color-error, 40%);
}

.overview__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: 8px;
  cursor: pointer;

  input {
    width: 20px;
    height: 20px;
    accent-color: $color-primary;
  }
}

.overview__loading {
  padding: 12px 0;
}

.overview__reloading {
  margin-bottom: 8px;
  font-weight: 600;
  color: $color-primary;
}

.overview__period {
  margin-bottom: 8px;
  font-weight: 600;
}

.overview-section {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: $radius-lg;
  background-color: $color-card-background;

  h2 {
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: 700;
    color: $color-primary;
  }
}

.overview-section__empty,
.overview-section__note {
  padding: 4px 0;
}

.overview-section__note {
  color: $color-error;
}

.report-crop-row {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 8px;
  border: none;
  border-bottom: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: $color-hover;
  }

  small {
    display: block;
    font-size: 12px;
    color: lighten($color-text-primary, 30%);
  }
}

.report-crop-row__name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.report-crop-row__dates {
  display: block;
  font-size: 13px;
  color: lighten($color-text-primary, 30%);
}

.report-crop-row__cell {
  text-align: right;
  white-space: nowrap;
}

.report-crop-row__result {
  font-weight: 700;
  color: $color-primary;
}

.report-crop-row--loss .report-crop-row__result {
  color: $color-error;
}

.overview-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
}

.overview-line--strong {
  font-weight: 700;
  border-top: 1px solid $color-border;
}

.report-net {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: $radius-lg;
  background-color: $color-hover;
  font-size: 20px;
  font-weight: 700;
  color: $color-primary;
}

.report-net--loss {
  background-color: lighten($color-error, 42%);
  color: $color-error;
}

@media (max-width: 899.98px) {
  .report-crop-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 8px;
  }

  .report-crop-row__name {
    grid-column: 1 / -1;
  }

  .report-crop-row__cell {
    text-align: left;
  }

  .report-net {
    font-size: 18px;
  }
}
</style>
