<template>
  <div class="data-viewer-container">
    <div class="filter-section">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Tìm kiếm theo loại cá..."
        class="search-input"
      />
      <select v-model="itemsPerPage" class="items-per-page">
        <option :value="5">5 bản ghi</option>
        <option :value="10">10 bản ghi</option>
        <option :value="20">20 bản ghi</option>
      </select>
    </div>
    <div v-if="isLoading || !isShowTable" class="skeleton-loader">
      <div class="skeleton-header">
        <div class="skeleton-cell" v-for="n in 5"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-row" v-for="r in 5">
          <div class="skeleton-cell" v-for="n in 5"></div>
        </div>
      </div>
    </div>
    <table class="customers" v-else>
      <thead>
        <tr>
          <th v-for="(fishType, fishTypeIndex) in filteredData">
            {{ fishType.fishName }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="numberRowsOfTable === 0">
          <td :colspan="Math.max(1, filteredData.length)" class="empty-row">Chưa có dữ liệu cân cá.</td>
        </tr>
        <tr v-for="row in paginatedRows">
          <td
            v-for="(fishType, fishTypeIndex) in filteredData"
            :class="{ 'cell-editable': fishType.items[row - 1]?._id }"
            :title="cellTitle(fishType.items[row - 1])"
            @click="handleClickCell(fishType, row)"
          >
            {{ fishType.items[row - 1]?.netWeight ?? fishType.items[row - 1]?.fishWeight }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination" v-if="isShowTable">
      <button
        @click="currentPage -= 1"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        Trước
      </button>
      <span>Trang {{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="currentPage += 1"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Sau
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["editItem"]);

const isShowTable = ref(false);
const dataOfTable = ref([]);
const numberRowsOfTable = ref(0);
const searchTerm = ref("");
const itemsPerPage = ref(5);
const currentPage = ref(1);

const initDataTable = (data, numberRows) => {
  isShowTable.value = true;
  // Đảo ngược thứ tự các hàng để hiển thị bản ghi mới nhất lên đầu tiên (không sửa mảng đầu vào)
  // items: lấy từ fishWeightItems (có _id để sửa/xóa), nếu không có thì dựng từ fishWeights
  dataOfTable.value = (data ?? []).map((fishType) => ({
    ...fishType,
    items: (
      fishType.fishWeightItems ??
      fishType.fishWeights.map((fishWeight) => ({ fishWeight }))
    )
      .slice()
      .reverse(),
  }));
  numberRowsOfTable.value = numberRows;
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1;
  }
};

// Tìm kiếm hoặc đổi số dòng mỗi trang thì quay về trang đầu
watch([searchTerm, itemsPerPage], () => {
  currentPage.value = 1;
});

// Ô hiển thị trọng lượng thực (đã trừ giỏ); rê chuột để xem số cân gốc và trọng lượng giỏ
const cellTitle = (item) =>
  item?.netWeight === undefined || item?.netWeight === null
    ? undefined
    : `Tổng ${item.fishWeight} − giỏ ${item.basketWeightSnapshot ?? 0}`;

// Click vào ô có lần cân → báo component cha mở hộp thoại sửa/xóa
const handleClickCell = (fishType, row) => {
  const item = fishType.items[row - 1];
  if (!item?._id) return;
  emit("editItem", { ...item, fishType: fishType._id, fishName: fishType.fishName });
};

// Định nghĩa sự kiện để component cha có thể gọi cập nhật
defineExpose({ initDataTable });

const filteredData = computed(() => {
  if (!searchTerm.value) {
    return dataOfTable.value;
  }
  return dataOfTable.value.filter((fishType) =>
    fishType.fishName
      .toLowerCase()
      .includes(searchTerm.value.toLowerCase())
  );
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(numberRowsOfTable.value / itemsPerPage.value));
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(start + itemsPerPage.value - 1, numberRowsOfTable.value);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
</script>

<style lang="scss" scoped>
  .data-viewer-container {
  width: 100%;
  height: 100%;
  overflow: auto;

  .skeleton-loader {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: lighten($color-background, 5%);
    
    .skeleton-header {
      display: flex;
      width: 100%;
      background-color: $color-secondary;
      opacity: 0.8;
      
      .skeleton-cell {
        flex: 1;
        height: 40px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
    }
    
    .skeleton-body {
      width: 100%;
      
      .skeleton-row {
        display: flex;
        width: 100%;
        border-bottom: 1px solid $color-border;
        
        &:nth-child(even) {
          background-color: lighten($color-background, 2%);
        }
        
        .skeleton-cell {
          flex: 1;
          height: 50px;
          border-right: 1px solid $color-border;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      }
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .filter-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 16px;

    .search-input {
      padding: 8px 12px;
      border: 1px solid $color-border;
      border-radius: 4px;
      width: 250px;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: $color-primary;
        box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
      }
    }

    .items-per-page {
      padding: 8px 12px;
      border: 1px solid $color-border;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: $color-primary;
      }
    }
  }

  .customers {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 100%;
    height: fit-content;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    & td,
    & th {
      border: 1px solid $color-border;
      padding: 12px;
    }

    & tr {
      min-height: 55px;
    }

    & tr:nth-child(even) {
      background-color: lighten($color-background, 2%);
    }

    & tr:hover {
      background-color: $color-hover;
    }

    & td.cell-editable {
      cursor: pointer;

      &:hover {
        background-color: darken($color-hover, 5%);
      }
    }

    & td.empty-row {
      text-align: center;
    }

    & th {
      padding-top: 12px;
      padding-bottom: 12px;
      text-align: left;
      background-color: $color-secondary;
      color: $color-card-background;
      font-weight: 600;
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
      transition: background-color 0.3s ease;

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
