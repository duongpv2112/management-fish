<template>
  <div class="management-fish">
    <div class="management-fish__heading">Quản lý cân cá nhà Đặng Ánh</div>
    <div class="management-fish__container">
      <SessionBar
        :sessions="sessions"
        :selectedId="selectedSessionId"
        @select="selectSession"
        @created="handleSessionChanged"
        @closed="handleSessionChanged"
      />
      <div class="viewer-data">
        <div class="load-error" v-if="loadError">{{ loadError }}</div>
        <DataViewer
          ref="dataViewerRef"
          :isLoading="isLoading"
          @editItem="openEditDialog"
        ></DataViewer>
      </div>
      <div class="add-data">
        <div v-if="isSessionClosed" class="session-closed">
          Phiên đã kết thúc. Chọn phiên đang mở hoặc bấm "Phiên mới" để cân tiếp.
        </div>
        <AddWeight v-else @weightAdded="handleWeightAdded"></AddWeight>
      </div>
      <div class="statistic-data">
        <StatisticData :fishData="fishData"></StatisticData>
      </div>
    </div>

    <WeightEditDialog
      v-if="editingItem"
      :item="editingItem"
      :fishTypes="fishData"
      :basketTypes="basketTypes"
      @saved="handleEditDone"
      @deleted="handleEditDone"
      @close="editingItem = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import FishTypeAPI from "../../services/fishTypeAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";

import SessionBar from "./components/SessionBar.vue";
import DataViewer from "./components/DataViewer.vue";
import AddWeight from "./components/AddWeight.vue";
import StatisticData from "./components/StatisticData.vue";
import WeightEditDialog from "./components/WeightEditDialog.vue";
import BasketTypeAPI from "@/services/basketTypeAPI";

const dataViewerRef = ref(null);
const isLoading = ref(false);

const fishData = ref([]);
const loadError = ref("");

const sessions = ref([]);
const selectedSessionId = ref(null);
const selectedSession = computed(() =>
  sessions.value.find((session) => session._id === selectedSessionId.value)
);
// Phiên đã kết thúc thì chỉ xem, không thêm/sửa/xóa lần cân
const isSessionClosed = computed(() => selectedSession.value?.status === "closed");

// Tải danh sách phiên; giữ phiên đang chọn nếu còn, không thì chọn phiên đang mở (hoặc mới nhất)
const loadSessions = async ({ selectOpen = false } = {}) => {
  try {
    let result = await WeighSessionAPI.getWeighSessions();
    sessions.value = result?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách phiên cân:", error);
  }
  const stillExists = sessions.value.some((session) => session._id === selectedSessionId.value);
  if (selectOpen || !stillExists) {
    const openSession = sessions.value.find((session) => session.status === "open");
    selectedSessionId.value = (openSession ?? sessions.value[0])?._id ?? null;
  }
};

// Tải dữ liệu một lần rồi truyền xuống cả bảng và biểu đồ
const loadData = async () => {
  isLoading.value = true;
  loadError.value = "";
  try {
    let result = await FishTypeAPI.getDataFish(selectedSessionId.value ?? undefined);
    fishData.value = result?.data ?? [];
  } catch (error) {
    loadError.value = "Không thể tải dữ liệu, vui lòng thử lại sau.";
    console.error("Lỗi khi tải dữ liệu cá:", error);
  } finally {
    // Math.max(0, ...) để DB trống không cho -Infinity
    let maxRows = Math.max(
      0,
      ...fishData.value.map((fishType) => fishType.fishWeights.length)
    );

    if (dataViewerRef.value) {
      dataViewerRef.value.initDataTable(fishData.value, maxRows);
    }

    isLoading.value = false;
  }
};

const editingItem = ref(null);
const basketTypes = ref([]);

// Mở hộp thoại sửa/xóa một lần cân; danh sách loại giỏ tải lúc mở để luôn mới nhất
const openEditDialog = async (item) => {
  if (isSessionClosed.value) return;
  editingItem.value = item;
  try {
    let result = await BasketTypeAPI.getBasketTypes();
    basketTypes.value = result?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách loại giỏ:", error);
  }
};

const handleEditDone = async () => {
  editingItem.value = null;
  await loadData();
};

const selectSession = async (sessionId) => {
  selectedSessionId.value = sessionId;
  await loadData();
};

// Tạo/kết thúc phiên, hoặc lần cân đầu tiên tự tạo phiên: tải lại danh sách và chuyển sang phiên đang mở
const handleSessionChanged = async () => {
  await loadSessions({ selectOpen: true });
  await loadData();
};

const handleWeightAdded = async () => {
  if (!selectedSession.value) await loadSessions({ selectOpen: true });
  await loadData();
};

onMounted(async () => {
  await loadSessions({ selectOpen: true });
  await loadData();
});
</script>

<style lang="scss" scoped>
.management-fish {
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
  width: 100%;
  flex: 1;
  background-color: $color-background;

  .management-fish__heading {
    font-size: 24px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0px;
    font-weight: 600;
    color: $color-primary;
  }

  .management-fish__container {
    display: flex;
    width: 100%;
    gap: 16px;
    flex-wrap: wrap;
    flex: 1;

    .viewer-data {
      width: 100%;

      .load-error {
        color: $color-error;
        background-color: lighten($color-error, 40%);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 16px;
        text-align: center;
        font-size: 14px;
      }
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .add-data {
      flex: 1;

      .session-closed {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 120px;
        text-align: center;
        font-weight: 600;
        color: $color-text-primary;
      }
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .statistic-data {
      flex: 1;
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }
  }
}
</style>
