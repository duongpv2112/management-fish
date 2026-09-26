<template>
  <div class="management-tracking">
    <h1 class="management-tracking__title">Nhật ký</h1>

    <div class="management-tracking__card">
      <div class="management-tracking__filter">
        <CPCombobox
          class="filter-fish-type"
          idControl="logFishType"
          labelControl="Loại cá"
          :modelValue="fishTypeFilter"
          height="36px"
          :lstData="fishTypeOptions"
          dataField="value"
          dataFieldText="text"
          @update="changeFishType"
        />
      </div>

      <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>

      <table class="log-table">
        <thead>
          <tr>
            <th class="log-table__time">Thời gian</th>
            <th class="log-table__fish">Loại cá</th>
            <th>Nội dung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="logs.length === 0">
            <td colspan="3" class="log-table__empty">
              {{ isLoading ? "Đang tải dữ liệu..." : "Chưa có nhật ký." }}
            </td>
          </tr>
          <tr
            v-for="log in logs"
            :key="log._id"
            class="log-row"
            :class="{ 'log-row--error': log.stepName?.includes('không thành công') }"
          >
            <td>{{ formatDateTime(log.createdAt) }}</td>
            <td>{{ log.fishTypeName }}</td>
            <td>{{ log.stepName }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="page-btn" :disabled="page <= 1 || isLoading" @click="goToPage(page - 1)">
          Trước
        </button>
        <span>Trang {{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page >= totalPages || isLoading" @click="goToPage(page + 1)">
          Sau
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import LogTrackingAPI from "@/services/logTrackingAPI";
import FishTypeAPI from "@/services/fishTypeAPI";
import { common } from "@/common/common";

const PAGE_SIZE = 20;

const logs = ref([]);
const total = ref(0);
const page = ref(1);
const fishTypeFilter = ref("");
const fishTypes = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

// Nhật ký lưu tên loại cá (không phải id) nên lọc theo tên
const fishTypeOptions = computed(() => [
  { value: "", text: "Tất cả" },
  ...fishTypes.value.map((fishType) => ({ value: fishType.fishName, text: fishType.fishName })),
]);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

// dd/MM/yyyy HH:mm theo giờ máy người dùng
const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${common.formatDateWithType(date, "DD/MM/YYYY")} ${hours}:${minutes}`;
};

// Phân trang ở server để không phải tải hết hàng nghìn dòng nhật ký
const loadLogs = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await LogTrackingAPI.getLogTrackings({
      fishType: fishTypeFilter.value,
      page: page.value,
      pageSize: PAGE_SIZE,
    });
    logs.value = result?.data?.items ?? [];
    total.value = result?.data?.total ?? 0;
  } catch (error) {
    errorMessage.value = error?.message || "Không thể tải nhật ký, vui lòng thử lại sau.";
  } finally {
    isLoading.value = false;
  }
};

const goToPage = async (newPage) => {
  page.value = newPage;
  await loadLogs();
};

const changeFishType = async (value) => {
  fishTypeFilter.value = value ?? "";
  page.value = 1;
  await loadLogs();
};

const loadFishTypes = async () => {
  try {
    const result = await FishTypeAPI.getFishTypes();
    fishTypes.value = result?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách loại cá:", error);
  }
};

onMounted(async () => {
  await Promise.all([loadFishTypes(), loadLogs()]);
});
</script>

<style lang="scss" scoped>
.management-tracking {
  width: 100%;
  padding: 0 16px 20px;

  .management-tracking__title {
    font-size: 24px;
    text-transform: uppercase;
    text-align: center;
    padding: 20px 0;
    font-weight: 600;
    color: $color-primary;
  }

  .management-tracking__card {
    background-color: $color-card-background;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 16px;
  }

  .management-tracking__filter {
    max-width: 320px;
    margin-bottom: 16px;
  }

  .error-message {
    margin-bottom: 16px;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .log-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    th,
    td {
      border: 1px solid $color-border;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: $color-secondary;
      color: $color-card-background;
      font-weight: 600;
    }

    .log-table__time {
      width: 150px;
    }

    .log-table__fish {
      width: 150px;
    }

    .log-table__empty {
      text-align: center;
    }

    .log-row--error {
      color: $color-error;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 16px;

    .page-btn {
      padding: 8px 16px;
      border: 1px solid $color-border;
      border-radius: 4px;
      background-color: $color-card-background;
      cursor: pointer;

      &:hover:not(:disabled) {
        background-color: $color-hover;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    span {
      font-size: 14px;
      color: $color-text-primary;
    }
  }
}
</style>
